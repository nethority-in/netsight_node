import { NextFunction, Request, Response } from 'express';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const DASHBOARD_COOKIE = 'netsight_dashboard_session';
const SESSION_TTL_SECONDS = 8 * 60 * 60; // 8 hours

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx < 0) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    out[key] = decodeURIComponent(val);
  }
  return out;
}

function getAuthConfig(): { username: string; password: string; secret: string } | null {
  const username = process.env.DASHBOARD_USERNAME?.trim() ?? '';
  const password = process.env.DASHBOARD_PASSWORD ?? '';
  if (!username || !password) return null;
  return {
    username,
    password,
    secret: process.env.DASHBOARD_SESSION_SECRET?.trim() || password,
  };
}

export function hasValidDashboardSession(req: Request): boolean {
  const cfg = getAuthConfig();
  if (!cfg) return false;
  const cookies = parseCookies(req.headers.cookie);
  return verifySessionToken(cookies[DASHBOARD_COOKIE], cfg.secret);
}

function signSession(username: string, tsSec: number, secret: string): string {
  return crypto.createHmac('sha256', secret).update(`${username}:${tsSec}`).digest('hex');
}

function createSessionToken(username: string, secret: string): string {
  const tsSec = Math.floor(Date.now() / 1000);
  const sig = signSession(username, tsSec, secret);
  return Buffer.from(`${username}:${tsSec}:${sig}`, 'utf8').toString('base64');
}

function verifySessionToken(token: string | undefined, secret: string): boolean {
  if (!token) return false;
  try {
    const raw = Buffer.from(token, 'base64').toString('utf8');
    const parts = raw.split(':');
    if (parts.length !== 3) return false;
    const username = parts[0];
    const tsSec = Number.parseInt(parts[1], 10);
    const sig = parts[2];
    if (!username || Number.isNaN(tsSec) || !sig) return false;
    if (Math.floor(Date.now() / 1000) - tsSec > SESSION_TTL_SECONDS) return false;
    const expectedSig = signSession(username, tsSec, secret);
    return safeEqual(sig, expectedSig);
  } catch {
    return false;
  }
}

function clearSessionCookie(res: Response): void {
  res.setHeader('Set-Cookie', `${DASHBOARD_COOKIE}=; HttpOnly; SameSite=Lax; Path=/dashboard; Max-Age=0`);
}

function setSessionCookie(res: Response, token: string): void {
  res.setHeader(
    'Set-Cookie',
    `${DASHBOARD_COOKIE}=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/dashboard; Max-Age=${SESSION_TTL_SECONDS}`,
  );
}

export function dashboardAuthStatus(_req: Request, res: Response): void {
  const cfg = getAuthConfig();
  if (!cfg) {
    res.status(500).json({ ok: false, configured: false, authenticated: false });
    return;
  }
  const authenticated = hasValidDashboardSession(_req);
  res.json({ ok: true, configured: true, authenticated });
}

export function dashboardLogin(req: Request, res: Response): void {
  const cfg = getAuthConfig();
  if (!cfg) {
    res.status(500).json({
      ok: false,
      error: 'Dashboard auth is not configured. Set DASHBOARD_USERNAME and DASHBOARD_PASSWORD in .env',
    });
    return;
  }

  const username = typeof req.body?.username === 'string' ? req.body.username : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const isValid = safeEqual(username, cfg.username) && safeEqual(password, cfg.password);
  if (!isValid) {
    clearSessionCookie(res);
    res.status(401).json({ ok: false, error: 'Invalid username or password.' });
    return;
  }

  const token = createSessionToken(cfg.username, cfg.secret);
  setSessionCookie(res, token);
  res.json({ ok: true });
}

export function dashboardLogout(_req: Request, res: Response): void {
  clearSessionCookie(res);
  res.json({ ok: true });
}

export function requireDashboardSession(req: Request, res: Response, next: NextFunction): void {
  const cfg = getAuthConfig();
  if (!cfg) {
    res.status(500).json({
      ok: false,
      error: 'Dashboard auth is not configured. Set DASHBOARD_USERNAME and DASHBOARD_PASSWORD in .env',
    });
    return;
  }
  const ok = hasValidDashboardSession(req);
  if (!ok) {
    res.status(401).json({ ok: false, error: 'Unauthorized' });
    return;
  }
  next();
}
