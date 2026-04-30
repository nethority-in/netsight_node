import fs from 'fs/promises';
import path from 'path';
import { getResolvedEmailLogPath, getResolvedWhatsAppLogPath } from '../utils/logApiResponse.js';
import { TEMPLATE_CONFIGS } from '../config/twiliotemplateConfigs.js';
import { getAllTwilioTemplateMappings } from '../config/twilioTemplateConfig.js';
import { EmailService } from './twilioemailService.js';

export interface DashboardLogQuery {
  template?: string;
  env?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface DashboardFilterMeta {
  emailTemplates: string[];
  whatsappTemplates: string[];
  envsInFile: string[];
  emailLogPath: string;
  whatsappLogPath: string;
  nodeEnv: string | undefined;
}

async function readJsonArray(filePath: string): Promise<unknown[]> {
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Best-effort match of `parameters` to a configured email template (for older rows without `templateName`). */
export function inferEmailTemplateFromParameters(params: unknown): string | undefined {
  if (params == null || typeof params !== 'object' || Array.isArray(params)) return undefined;
  const keys = new Set(Object.keys(params as Record<string, unknown>));
  let best: { name: string; score: number } | null = null;
  for (const [name, cfg] of Object.entries(TEMPLATE_CONFIGS)) {
    const required = cfg.requiredFields ?? [];
    if (required.length === 0) continue;
    const matched = required.every((f) => keys.has(f));
    if (matched) {
      const score = required.length;
      if (!best || score > best.score) best = { name, score };
    }
  }
  return best?.name;
}

function getEmailTemplateLabel(req: Record<string, unknown>): string {
  const tn = req.templateName;
  if (typeof tn === 'string' && tn.trim()) return tn.trim();
  const inferred = inferEmailTemplateFromParameters(req.parameters);
  if (inferred) return `${inferred} (inferred)`;
  return '—';
}

export function stripInferredTemplateLabel(label: string): string {
  return label.replace(/\s*\(inferred\)\s*$/i, '').trim();
}

function normalizeEnv(v: unknown): string {
  if (typeof v !== 'string') return '';
  return v.trim().toUpperCase();
}

function matchesEnv(entryReq: Record<string, unknown>, filterEnv: string | undefined): boolean {
  if (!filterEnv || filterEnv === 'all') return true;
  const fe = filterEnv.trim().toUpperCase();
  const env = normalizeEnv(entryReq.env);
  if (fe === 'LOCAL' && env === 'LOCAL') return true;
  if ((fe === 'SERVER' || fe === 'PRODUCTION') && (env === 'SERVER' || env === 'PRODUCTION')) return true;
  return env === fe;
}

function matchesTemplateEmail(label: string, filterTemplate: string | undefined): boolean {
  if (!filterTemplate || filterTemplate === '' || filterTemplate === 'all') return true;
  const raw = stripInferredTemplateLabel(label).toLowerCase();
  if (raw === '' || raw === '—') return false;
  return raw === filterTemplate.trim().toLowerCase();
}

function matchesTemplateWhatsapp(templateName: unknown, filterTemplate: string | undefined): boolean {
  if (!filterTemplate || filterTemplate === '' || filterTemplate === 'all') return true;
  if (typeof templateName !== 'string') return false;
  return templateName.trim().toLowerCase() === filterTemplate.trim().toLowerCase();
}

function emailEntryStatus(res: Record<string, unknown>): string {
  if (res.ok === true) {
    const data = res.data as Record<string, unknown> | undefined;
    const arr = data?.Messages as unknown[] | undefined;
    const first = arr?.[0] as Record<string, unknown> | undefined;
    return typeof first?.Status === 'string' ? first.Status : 'ok';
  }
  if (res.message) return String(res.message);
  return 'error';
}

function whatsappEntryStatus(res: Record<string, unknown>): string {
  if (typeof res.status === 'string') return res.status;
  if (typeof res.message === 'string') return res.message;
  return '—';
}

function rowMatchesSearch(entry: Record<string, unknown>, q: string): boolean {
  if (!q.trim()) return true;
  return JSON.stringify(entry).toLowerCase().includes(q.trim().toLowerCase());
}

/** Parses IST-style `d/m/yyyy, HH:mm:ss` from logs. */
export function parseLogTimestampMs(ts: string | undefined): number {
  if (!ts) return 0;
  const m = ts.match(/^(\d+)\/(\d+)\/(\d+),\s*(\d+):(\d+):(\d+)/);
  if (m) {
    const d = parseInt(m[1], 10);
    const mo = parseInt(m[2], 10) - 1;
    const y = parseInt(m[3], 10);
    const h = parseInt(m[4], 10);
    const mi = parseInt(m[5], 10);
    const s = parseInt(m[6], 10);
    return new Date(y, mo, d, h, mi, s).getTime();
  }
  const p2 = Date.parse(ts);
  return Number.isNaN(p2) ? 0 : p2;
}

export async function getDashboardFilterMeta(): Promise<DashboardFilterMeta> {
  const emailLogPath = getResolvedEmailLogPath();
  const whatsappLogPath = getResolvedWhatsAppLogPath();
  const [emailRows, waRows] = await Promise.all([
    readJsonArray(emailLogPath),
    readJsonArray(whatsappLogPath),
  ]);

  const envSet = new Set<string>();
  const emailDiscovered = new Set<string>();
  const waDiscovered = new Set<string>();

  for (const row of emailRows) {
    if (!row || typeof row !== 'object') continue;
    const r = row as Record<string, unknown>;
    const req = r.request as Record<string, unknown> | undefined;
    if (req?.env != null) envSet.add(normalizeEnv(req.env) || String(req.env));
    if (req) {
      const label = getEmailTemplateLabel(req);
      if (label !== '—') emailDiscovered.add(stripInferredTemplateLabel(label));
    }
  }
  for (const row of waRows) {
    if (!row || typeof row !== 'object') continue;
    const r = row as Record<string, unknown>;
    const req = r.request as Record<string, unknown> | undefined;
    if (req?.env != null) envSet.add(normalizeEnv(req.env) || String(req.env));
    if (typeof req?.templateName === 'string' && req.templateName.trim()) waDiscovered.add(req.templateName.trim());
  }

  const configEmail = Object.keys(TEMPLATE_CONFIGS);
  const configWa = Object.keys(getAllTwilioTemplateMappings());

  const emailTemplates = [...new Set([...configEmail, ...emailDiscovered])].filter(Boolean).sort();
  const whatsappTemplates = [...new Set([...configWa, ...waDiscovered])].sort();
  const envsInFile = [...envSet].filter(Boolean).sort();

  return {
    emailTemplates,
    whatsappTemplates,
    envsInFile: envsInFile.length ? envsInFile : ['LOCAL', 'SERVER'],
    emailLogPath,
    whatsappLogPath,
    nodeEnv: process.env.NODE_ENV,
  };
}

export interface EmailLogRow extends Record<string, unknown> {
  _rowIndex: number;
  timestamp: string;
  templateLabel: string;
  env: string;
  toPreview: string;
  subjectPreview: string;
  status: string;
}

function formatTo(req: Record<string, unknown>): string {
  const to = req.to;
  if (Array.isArray(to)) {
    const parts = to.map((x) => String(x)).slice(0, 2);
    return parts.join(', ') + (to.length > 2 ? ` +${to.length - 2}` : '');
  }
  if (typeof to === 'string') return to;
  return '—';
}

export async function queryEmailLogs(query: DashboardLogQuery): Promise<{
  total: number;
  entries: EmailLogRow[];
}> {
  const filePath = getResolvedEmailLogPath();
  const rows = (await readJsonArray(filePath)) as Record<string, unknown>[];
  const limit = Math.min(Math.max(query.limit ?? 50, 1), 500);
  const offset = Math.max(query.offset ?? 0, 0);
  const search = query.search ?? '';
  const filterEnv = query.env;
  const filterTemplate = query.template;

  const enriched: EmailLogRow[] = rows.map((entry, idx) => {
    const req = (entry.request as Record<string, unknown>) || {};
    const res = (entry.response as Record<string, unknown>) || {};
    const templateLabel = getEmailTemplateLabel(req);
    return {
      ...entry,
      _rowIndex: idx,
      timestamp: String(entry.timestamp ?? ''),
      templateLabel,
      env: normalizeEnv(req.env) || '—',
      toPreview: formatTo(req),
      subjectPreview: typeof req.subject === 'string' ? req.subject.slice(0, 140) : '—',
      status: emailEntryStatus(res),
    };
  });

  const filtered = enriched.filter((e) => {
    const req = e.request as Record<string, unknown>;
    if (!matchesEnv(req, filterEnv)) return false;
    if (!matchesTemplateEmail(e.templateLabel, filterTemplate)) return false;
    if (search && !rowMatchesSearch({ timestamp: e.timestamp, request: e.request, response: e.response }, search)) {
      return false;
    }
    return true;
  });

  filtered.sort((a, b) => parseLogTimestampMs(b.timestamp) - parseLogTimestampMs(a.timestamp));

  const total = filtered.length;
  const slice = filtered.slice(offset, offset + limit);
  return { total, entries: slice };
}

export interface WhatsappLogRow extends Record<string, unknown> {
  _rowIndex: number;
  timestamp: string;
  templateName: string;
  env: string;
  toPreview: string;
  status: string;
}

export async function queryWhatsappLogs(query: DashboardLogQuery): Promise<{
  total: number;
  entries: WhatsappLogRow[];
}> {
  const filePath = getResolvedWhatsAppLogPath();
  const rows = (await readJsonArray(filePath)) as Record<string, unknown>[];
  const limit = Math.min(Math.max(query.limit ?? 50, 1), 500);
  const offset = Math.max(query.offset ?? 0, 0);
  const search = query.search ?? '';
  const filterEnv = query.env;
  const filterTemplate = query.template;

  const enriched: WhatsappLogRow[] = rows.map((entry, idx) => {
    const req = (entry.request as Record<string, unknown>) || {};
    const res = (entry.response as Record<string, unknown>) || {};
    const templateName = typeof req.templateName === 'string' ? req.templateName : '—';
    return {
      ...entry,
      _rowIndex: idx,
      timestamp: String(entry.timestamp ?? ''),
      templateName,
      env: normalizeEnv(req.env) || '—',
      toPreview: typeof req.to === 'string' ? req.to : '—',
      status: whatsappEntryStatus(res),
    };
  });

  const filtered = enriched.filter((e) => {
    const req = e.request as Record<string, unknown>;
    if (!matchesEnv(req, filterEnv)) return false;
    if (!matchesTemplateWhatsapp(e.templateName, filterTemplate)) return false;
    if (search && !rowMatchesSearch({ timestamp: e.timestamp, request: e.request, response: e.response }, search)) {
      return false;
    }
    return true;
  });

  filtered.sort((a, b) => parseLogTimestampMs(b.timestamp) - parseLogTimestampMs(a.timestamp));

  const total = filtered.length;
  const slice = filtered.slice(offset, offset + limit);
  return { total, entries: slice };
}

export function resolveDashboardHtmlPath(): string {
  return path.join(process.cwd(), 'src', 'dashboard', 'logs-dashboard.html');
}

export async function getEmailHtmlPreviewByRowIndex(rowIndex: number): Promise<{
  templateName: string;
  subject: string;
  html: string;
}> {
  const filePath = getResolvedEmailLogPath();
  const rows = (await readJsonArray(filePath)) as Record<string, unknown>[];
  if (!Number.isInteger(rowIndex) || rowIndex < 0 || rowIndex >= rows.length) {
    throw new Error(`Invalid email log row index: ${rowIndex}`);
  }

  const row = rows[rowIndex];
  const req = (row?.request as Record<string, unknown>) || {};
  const rawTemplateName = typeof req.templateName === 'string' && req.templateName.trim()
    ? req.templateName.trim()
    : stripInferredTemplateLabel(getEmailTemplateLabel(req));

  if (!rawTemplateName || rawTemplateName === '—') {
    throw new Error('Template name unavailable for this email log row.');
  }

  const paramsRaw = req.parameters;
  const parameters = (paramsRaw != null && typeof paramsRaw === 'object' && !Array.isArray(paramsRaw))
    ? (paramsRaw as Record<string, unknown>)
    : {};

  const preview = await EmailService.previewTemplate(rawTemplateName, parameters);
  if (!preview?.ok) {
    const msg = (preview as { message?: string } | undefined)?.message ?? 'Unable to render template preview.';
    throw new Error(String(msg));
  }

  const meta = (preview as { meta?: Record<string, unknown> }).meta || {};
  const html = typeof meta.html === 'string' ? meta.html : '';
  const subject = typeof meta.subject === 'string'
    ? meta.subject
    : (typeof req.subject === 'string' ? req.subject : rawTemplateName);

  return {
    templateName: rawTemplateName,
    subject,
    html,
  };
}
