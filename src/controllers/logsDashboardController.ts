import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import {
  getDashboardFilterMeta,
  getEmailHtmlPreviewByRowIndex,
  queryEmailLogs,
  queryWhatsappLogs,
  resolveDashboardHtmlPath,
} from '../services/logsDashboardService.js';

export class LogsDashboardController {
  static serveSignin(_req: Request, res: Response): void {
    const htmlPath = path.join(process.cwd(), 'src', 'dashboard', 'dashboard-signin.html');
    if (!fs.existsSync(htmlPath)) {
      res.status(404).type('text/plain').send('Missing signin file: src/dashboard/dashboard-signin.html');
      return;
    }
    res.sendFile(path.resolve(htmlPath));
  }

  static serveUi(_req: Request, res: Response): void {
    const htmlPath = resolveDashboardHtmlPath();
    if (!fs.existsSync(htmlPath)) {
      res.status(404).type('text/plain').send('Missing dashboard file: src/dashboard/logs-dashboard.html');
      return;
    }
    res.sendFile(path.resolve(htmlPath));
  }

  static async meta(_req: Request, res: Response): Promise<void> {
    try {
      const meta = await getDashboardFilterMeta();
      res.json(meta);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      res.status(500).json({ error: msg });
    }
  }

  static async emailLogs(req: Request, res: Response): Promise<void> {
    try {
      const { template, env, search, limit, offset } = req.query;
      const result = await queryEmailLogs({
        template: typeof template === 'string' ? template : undefined,
        env: typeof env === 'string' ? env : undefined,
        search: typeof search === 'string' ? search : undefined,
        limit: limit != null ? parseInt(String(limit), 10) : undefined,
        offset: offset != null ? parseInt(String(offset), 10) : undefined,
      });
      res.json({ channel: 'email', ...result });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      res.status(500).json({ error: msg });
    }
  }

  static async whatsappLogs(req: Request, res: Response): Promise<void> {
    try {
      const { template, env, search, limit, offset } = req.query;
      const result = await queryWhatsappLogs({
        template: typeof template === 'string' ? template : undefined,
        env: typeof env === 'string' ? env : undefined,
        search: typeof search === 'string' ? search : undefined,
        limit: limit != null ? parseInt(String(limit), 10) : undefined,
        offset: offset != null ? parseInt(String(offset), 10) : undefined,
      });
      res.json({ channel: 'whatsapp', ...result });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      res.status(500).json({ error: msg });
    }
  }

  static async emailHtmlPreview(req: Request, res: Response): Promise<void> {
    try {
      const { rowIndex } = req.query;
      const idx = Number.parseInt(String(rowIndex), 10);
      if (!Number.isInteger(idx) || idx < 0) {
        res.status(400).json({ error: 'Invalid rowIndex query param.' });
        return;
      }

      const preview = await getEmailHtmlPreviewByRowIndex(idx);
      res.json(preview);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      res.status(400).json({ error: msg });
    }
  }
}
