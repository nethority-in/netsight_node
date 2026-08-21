import { Request, Response } from 'express';
import { EmailService } from '../services/twilioemailService.js';
import { ErrorHandler } from '../utils/errorHandler.js';
import { isRabbitEnabled, publishNotificationJob } from '../queue/rabbitNotifications.js';

function normalizeKeyWhitespace(key: string): string {
  // e.g. "PositiveC  hanges" -> "PositiveChanges"
  return String(key).replace(/\s+/g, '');
}

function replacePlaceholders(template: string, variables: Record<string, any>): string {
  return template.replace(/\{\{(\s*[\w.]+\s*)\}\}/g, (_match, key) => {
    const trimmed = key.trim();
    return trimmed in variables ? String(variables[trimmed] ?? '') : _match;
  });
}

export class EmailController {
  // POST /api/email/send-template
  static async sendTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { to, templateName, templateVariables, subject, cc, bcc, attachments } = req.body;

      const toVal = to != null ? (Array.isArray(to) ? to : [to]).map((e: unknown) => (e != null ? String(e).trim() : '')).filter(Boolean) : [];
      if (toVal.length === 0) {
        ErrorHandler.sendValidationError(res, 'Missing or empty required field: "to" (recipient email) is required');
        return;
      }
      if (templateName == null || String(templateName).trim() === '') {
        ErrorHandler.sendValidationError(res, 'Missing or empty required field: "templateName" is required');
        return;
      }

      const result = await EmailService.sendTemplate(
        toVal.length === 1 ? toVal[0] : toVal,
        templateName,
        templateVariables || {},
        subject,
        cc,
        bcc,
        attachments
      );

      ErrorHandler.sendServiceResult(res, result);
    } catch (error) {
      ErrorHandler.sendErrorResponse(res, error, 'Error in sendTemplate', 500);
    }
  }

  // POST /api/email/send-daily-kpi-snapshot flexible with optional parameters (uses sendDynamic internally)
  static async sendDailyKpiSnapshot(req: Request, res: Response): Promise<void> {
    try {
      const {
        to,
        storeName,
        date,
        businessOverview,
        marketingProfitability,
        operationsCash,
        keySignals,
        revenue,
        expenses,
        profit,
        newCustomers,
        returns,
        loyaltyPoints,
        cc,
        bcc,
        attachments
      } = req.body;

      const toVal = to != null ? (Array.isArray(to) ? to : [to]).map((e: unknown) => (e != null ? String(e).trim() : '')).filter(Boolean) : [];
      if (toVal.length === 0 || !storeName || !date) {
        ErrorHandler.sendValidationError(res, 'Missing required fields: "to", "storeName", and "date" are required. "to" cannot be empty.');
        return;
      }

      // Build parameters object with only provided fields
      const parameters: Record<string, any> = {
        storeName,
        date
      };

      if (businessOverview) parameters.businessOverview = businessOverview;
      if (marketingProfitability) parameters.marketingProfitability = marketingProfitability;
      if (operationsCash) parameters.operationsCash = operationsCash;
      if (keySignals) parameters.keySignals = keySignals;
      if (revenue) parameters.revenue = revenue;
      if (expenses) parameters.expenses = expenses;
      if (profit) parameters.profit = profit;
      if (newCustomers) parameters.newCustomers = newCustomers;
      if (returns) parameters.returns = returns;
      if (loyaltyPoints) parameters.loyaltyPoints = loyaltyPoints;

      // Use sendDynamic internally
      req.body = { to: toVal.length === 1 ? toVal[0] : toVal, templateName: 'daily_kpi_snapshot', parameters, cc, bcc, attachments };
      return await this.sendDynamic(req, res);
    } catch (error) {
      ErrorHandler.sendErrorResponse(res, error, 'Error in sendDailyKpiSnapshot', 500);
    }
  }

  // POST /api/email/send
  static async sendEmail(req: Request, res: Response): Promise<void> {
    try {
      const { to, subject, htmlContent, textContent, cc, bcc, attachments } = req.body;

      const toVal = to != null ? (Array.isArray(to) ? to : [to]).map((e: unknown) => (e != null ? String(e).trim() : '')).filter(Boolean) : [];
      if (toVal.length === 0) {
        ErrorHandler.sendValidationError(res, 'Missing or empty required field: "to" (recipient email) is required');
        return;
      }
      if (subject == null || (typeof subject !== 'string') || subject.trim().length === 0) {
        ErrorHandler.sendValidationError(res, 'Missing or empty required field: "subject" is required and cannot be whitespace only');
        return;
      }
      if (htmlContent == null || (typeof htmlContent !== 'string') || htmlContent.trim().length === 0) {
        ErrorHandler.sendValidationError(res, 'Missing or empty required field: "htmlContent" is required and cannot be whitespace only');
        return;
      }

      const result = await EmailService.sendEmail(
        toVal.length === 1 ? toVal[0] : toVal,
        subject,
        htmlContent,
        textContent,
        cc,
        bcc,
        attachments
      );

      ErrorHandler.sendServiceResult(res, result);
    } catch (error) {
      ErrorHandler.sendErrorResponse(res, error, 'Error in sendEmail', 500);
    }
  }

  // POST /api/email/preview – Preview template without sending (like WhatsApp send-message-preview)
  // Existing (JSON)
  static async previewTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { templateName, parameters, templateVariables } = req.body;



      if (templateName == null || String(templateName).trim() === "") {
        ErrorHandler.sendValidationError(res, 'Missing or empty required field: "templateName" is required');
        return;
      }

      const params: Record<string, any> =
        parameters != null ? { ...parameters } : templateVariables != null ? { ...templateVariables } : {};

      // Compatibility: handle common payload aliases / key typos for this template
      // (template expects camel/case-specific keys like `Googleadsspend`, but clients may send `GoogleAdsSpend`).
      if (String(templateName).trim() === 'ns_temp_Notification_temp2') {
        if (params.MetaSpend == null && params.MetaAdsSpend != null) params.MetaSpend = params.MetaAdsSpend;
        if (params.Googleadsspend == null && params.GoogleAdsSpend != null) params.Googleadsspend = params.GoogleAdsSpend;
      }

      const result = await EmailService.previewTemplate(String(templateName).trim(), params);
      ErrorHandler.sendServiceResult(res, result);
    } catch (error) {
      ErrorHandler.sendErrorResponse(res, error, "Error in previewTemplate", 500);
    }
  }

  // ✅ NEW (HTML direct render)
  static async previewTemplateHtml(req: Request, res: Response): Promise<void> {
    try {
      // ✅ GET query OR POST body dono support
      const templateName = String(req.query.templateName ?? req.body?.templateName ?? "").trim();
      if (!templateName) {
        res.status(400).send('Missing "templateName"');
        return;
      }

      // parameters (query me JSON string) or body object
      let params: Record<string, any> = {};
      if (req.query.parameters != null) {
        try {
          params = JSON.parse(String(req.query.parameters));
        } catch {
          params = {};
        }
      } else {
        const { parameters, templateVariables } = req.body ?? {};
        params = parameters != null ? { ...parameters } : templateVariables != null ? { ...templateVariables } : {};
      }

      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          params[key] = 'N/A';
        } else if (typeof params[key] === 'string') {
          if (key === 'LTVCACRatio') {
            params[key] = params[key].replace(/\d+\.\d+/g, (match: string) => parseFloat(match).toFixed(1));
          }
          else if (key === 'GrossRevenue') {
            params[key] = params[key].replace(/\d+\.\d{3,}/g, (match: string) => parseFloat(match).toFixed(2));
          }
          else if (key === 'MetaAdsSpend') {
            params[key] = params[key].replace(/\.\d+/g, '');
          }
          else if (key === 'GoogleAdsSpend') {
            params[key] = params[key].replace(/\.\d+/g, '');
          }
          else if (key === 'AOV') {
            params[key] = params[key].replace(/\.\d+/g, '');
          }
          else if (key === 'BlendedROAS') {
            params[key] = params[key].replace(/\d+\.\d+/g, (match: string) => parseFloat(match).toFixed(1));
          }
          else if (key === 'GA4Sessions' || key === 'GA4Users') {
            params[key] = params[key].replace(/\d+/g, (match: string) => {
              return parseInt(match).toLocaleString('en-IN');
            });
          }
          else if (key === 'PositiveChanges' || key === 'RequiresReviews') {
            params[key] = params[key]
              .replace(/\r\n/g, '\n')  // Windows line breaks
              .replace(/\r/g, '\n')    // Old Mac line breaks  
              .replace(/\n/g, '\\n');  // Real newline → \n string (valid JSON ke liye)
          }
          else {
            params[key] = params[key].replace(/\d+\.\d{3,}/g, (match: string) => parseFloat(match).toFixed(2));
          }
        }
      });

      // Compatibility: handle common payload aliases / key typos for this template
      // (template expects `Googleadsspend`, but clients may send `GoogleAdsSpend`).
      if (templateName === 'ns_temp_Notification_temp2') {
        if (params.MetaSpend == null && params.MetaAdsSpend != null) params.MetaSpend = params.MetaAdsSpend;
        if (params.Googleadsspend == null && params.GoogleAdsSpend != null) params.Googleadsspend = params.GoogleAdsSpend;

        // Pre-render metaAccounts array into HTML for the template
        const metaAccounts = params.metaAccounts;
        if (Array.isArray(metaAccounts) && metaAccounts.length > 0) {
          let accountsHtml = `<div style="margin-top:6px;">`;
          accountsHtml += `<div class="layer-header">META AD ACCOUNTS</div>`;
          for (const account of metaAccounts) {
            const id = account.Id || '';
            const last4 = id.slice(-4);
            const name = account.Name || 'N/A';
            const roas = account.Roas != null ? parseFloat(account.Roas).toFixed(2) : 'N/A';
            const revenue = account.Revenue != null ? `₹${parseFloat(account.Revenue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A';
            const spend = account.Spend != null ? `₹${parseFloat(account.Spend).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A';
            accountsHtml += `<table class="metrics-table" cellpadding="0" cellspacing="0">`;
            accountsHtml += `<tr><td colspan="3" style="padding:4px 3px 0 3px;"><div class="metric-value">${name} <span style="font-size:11px;">(XXX${last4})</span></div></td></tr>`;
            accountsHtml += `<tr>`;
            accountsHtml += `<td><div class="metric-label">Spend</div><div class="metric-value">${spend}</div></td>`;
            accountsHtml += `<td><div class="metric-label">ROAS</div><div class="metric-value">${roas}</div></td>`;
            accountsHtml += `<td><div class="metric-label">Revenue</div><div class="metric-value">${revenue}</div></td>`;
            
            accountsHtml += `</tr>`;
            accountsHtml += `</table>`;
          }
          accountsHtml += `</div>`;
          params.metaAccountsHtml = accountsHtml;
        } else {
          params.metaAccountsHtml = '<!-- -->';
        }
        // Clean up array fields so template builder doesn't choke
        delete params.metaAccounts;
        delete params.metaAccounts_count;
      }

      // Handle MetaAccountSummary for ns_temp_Notification_temp1
      if (templateName === 'ns_temp_Notification_temp1' || templateName === 'ns_temp_Notification_temp1_weekly' || templateName === 'ns_temp_Notification_temp1_monthly') {
        const metaAccountSummary = params.MetaAccountSummary;
        if (Array.isArray(metaAccountSummary) && metaAccountSummary.length > 0) {
          let summaryHtml = '';
          for (const line of metaAccountSummary) {
            summaryHtml += `<li><span>•</span> <span>${String(line)}</span></li>`;
          }
          params.metaAccountSummaryHtml = summaryHtml;
        } else {
          params.metaAccountSummaryHtml = '<!-- -->';
        }
        delete params.MetaAccountSummary;

        // GoogleAccountSummary for ns_temp_Notification_temp1
        const googleAccountSummary = params.GoogleAccountSummary;
        if (Array.isArray(googleAccountSummary) && googleAccountSummary.length > 0) {
          let gSummaryHtml = '';
          for (const line of googleAccountSummary) {
            gSummaryHtml += `<li><span>•</span> <span>${String(line)}</span></li>`;
          }
          params.googleAccountSummaryHtml = gSummaryHtml;
        } else {
          params.googleAccountSummaryHtml = '<!-- -->';
        }
        delete params.GoogleAccountSummary;
      }

      // Handle googleAccounts for ns_temp_Notification_temp2
      if (templateName === 'ns_temp_Notification_temp2' || templateName === 'ns_temp_Notification_temp2_weekly' || templateName === 'ns_temp_Notification_temp2_monthly') {
        const googleAccounts = params.googleAccounts;
        if (Array.isArray(googleAccounts) && googleAccounts.length > 0) {
          let gAccountsHtml = `<div style="margin-top:6px;"><div class="layer-header">GOOGLE AD ACCOUNTS</div>`;
          for (const account of googleAccounts) {
            const id = account.Id || '';
            const last4 = id.slice(-4);
            const name = account.Name || 'N/A';
            const roas = account.Roas != null ? parseFloat(account.Roas).toFixed(2) : 'N/A';
            const revenue = account.Revenue != null ? `₹${parseFloat(account.Revenue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A';
            const spend = account.Spend != null ? `₹${parseFloat(account.Spend).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A';
            gAccountsHtml += `<table class="metrics-table" cellpadding="0" cellspacing="0">`;
            gAccountsHtml += `<tr><td colspan="3" style="padding:4px 3px 0 3px;"><div class="metric-value">${name} <span style="font-size:11px;">(XXX${last4})</span></div></td></tr>`;
            gAccountsHtml += `<tr>`;
            gAccountsHtml += `<td><div class="metric-label">ROAS</div><div class="metric-value">${roas}</div></td>`;
            gAccountsHtml += `<td><div class="metric-label">Revenue</div><div class="metric-value">${revenue}</div></td>`;
            gAccountsHtml += `<td><div class="metric-label">Spend</div><div class="metric-value">${spend}</div></td>`;
            gAccountsHtml += `</tr></table>`;
          }
          gAccountsHtml += `</div>`;
          params.googleAccountsHtml = gAccountsHtml;
        } else {
          params.googleAccountsHtml = '<!-- -->';
        }
        delete params.googleAccounts;
        delete params.googleAccounts_count;
      }

      // Handle InventoryHealth for both templates
      if (templateName.startsWith('ns_temp_Notification_temp1') || templateName.startsWith('ns_temp_Notification_temp2')) {
        const inventoryHealth = params.InventoryHealth;
        if (inventoryHealth && String(inventoryHealth).trim() !== '') {
          if (templateName.startsWith('ns_temp_Notification_temp1')) {
            // temp1: heading + bullet points style (same as Marketing section)
            const lines = String(inventoryHealth).split(/\n/).filter(l => l.trim());
            let ihHtml = `<h1>𝗜𝗻𝘃𝗲𝗻𝘁𝗼𝗿𝘆 𝗛𝗲𝗮𝗹𝘁𝗵</h1><ul>`;
            for (const line of lines) {
              ihHtml += `<li><span>•</span> <span>${line.trim()}</span></li>`;
            }
            ihHtml += `</ul>`;
            params.inventoryHealthHtml = ihHtml;
          } else {
            // temp2: amber colored box
            let ihHtml = `<div style="background:#fffbeb; border-left:4px solid #f59e0b; padding:15px; border-radius:12px; margin-top:10px;">`;
            ihHtml += `<div class="layer-header" style="margin-bottom:5px;">INVENTORY HEALTH</div>`;
            ihHtml += `<div style="white-space:pre-line; font-size:14px;">${String(inventoryHealth)}</div>`;
            ihHtml += `</div>`;
            params.inventoryHealthHtml = ihHtml;
          }
        } else {
          params.inventoryHealthHtml = '<!-- -->';
        }
        delete params.InventoryHealth;
      }

      // Handle CancelCount/RefundAmount conditionally for both templates
      if (templateName.startsWith('ns_temp_Notification_temp1') || templateName.startsWith('ns_temp_Notification_temp2')) {
        const cancelCount = params.CancelCount;
        const refundAmount = params.RefundAmount;
        if (cancelCount && String(cancelCount).trim() !== '' && refundAmount && String(refundAmount).trim() !== '') {
          if (templateName.startsWith('ns_temp_Notification_temp2')) {
            // temp2: render as metrics table row
            params.cancelRefundHtml = `<tr><td><div class="metric-label">Cancel Count</div><div class="metric-value">${String(cancelCount)}</div></td><td><div class="metric-label">Refund Amount</div><div class="metric-value">${String(refundAmount)}</div></td><td></td></tr>`;
          }
          if (templateName.startsWith('ns_temp_Notification_temp1')) {
            // temp1: inline text
            params.cancelRefundText = ` A total of ${String(cancelCount)} orders were cancelled, with a refund amount of ${String(refundAmount)}.`;
          }
        } else {
          params.cancelRefundHtml = '<!-- -->';
          params.cancelRefundText = '<!-- -->';
        }
        delete params.CancelCount;
        delete params.RefundAmount;
      }

      const result = await EmailService.previewTemplate(templateName, params);

      if (!result?.ok) {
        // agar error aaya to JSON hi bhej do
        res.status(400).json(result);
        return;
      }

      const html = (result as any)?.meta?.html ?? "";
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.status(200).send(html);
    } catch (error) {
      res.status(500).send("Error in previewTemplateHtml");
    }
  }

  // GET /api/email/templates
  static async getTemplates(_req: Request, res: Response): Promise<void> {
    try {
      const { getAvailableTemplates } = await import('../templates/twilioemailTemplates.js');
      const templates = getAvailableTemplates();
      ErrorHandler.sendSuccess(res, {
        data: { templates, count: templates.length }
      });
    } catch (error) {
      ErrorHandler.sendErrorResponse(res, error, 'Error in getTemplates', 500);
    }
  }

  // use
  // POST /api/email/send-dynamic – template + parameters (e.g. business_performance_summary from templateConfigs)
  // static async sendDynamic(req: Request, res: Response): Promise<void> {
  //   try {
  //     const { to, templateName, parameters, subject, cc, bcc, attachments } = req.body;

  //     const toVal = to != null ? (Array.isArray(to) ? to : [to]).map((e: unknown) => (e != null ? String(e).trim() : '')).filter(Boolean) : [];
  //     if (toVal.length === 0) {
  //       ErrorHandler.sendValidationError(res, 'Missing or empty required field: "to" (recipient email) is required');
  //       return;
  //     }
  //     if (templateName == null || String(templateName).trim() === '') {
  //       ErrorHandler.sendValidationError(res, 'Missing or empty required field: "templateName" is required');
  //       return;
  //     }

  //     // Parameters only (e.g. business_performance_summary). No components.body mapping.
  //     const params: Record<string, any> = parameters != null ? { ...parameters } : {};

  //     const { TemplateBuilder } = await import('../services/templateBuilder.js');
  //     const { getTemplateConfig } = await import('../config/templateConfigs.js');
  //     const { getEmailTemplate } = await import('../templates/emailTemplates.js');

  //     const config = getTemplateConfig(templateName);
  //     if (config) {
  //       const validation = TemplateBuilder.validateParameters(params, config);
  //       if (!validation.valid) {
  //         ErrorHandler.sendValidationError(res, 'Missing required fields', validation.missing);
  //         return;
  //       }
  //     }

  //     const template = getEmailTemplate(templateName);
  //     if (!template) {
  //       ErrorHandler.sendNotFoundError(res, `Template "${templateName}"`);
  //       return;
  //     }

  //     let htmlContent = TemplateBuilder.buildEmailContent(template.html, params);
  //     let emailSubject = subject || TemplateBuilder.buildEmailContent(template.subject, params);
  //     const textContent = template.text ? TemplateBuilder.buildEmailContent(template.text, params) : undefined;

  //     const result = await EmailService.sendEmail(
  //       toVal.length === 1 ? toVal[0] : toVal,
  //       emailSubject,
  //       htmlContent,
  //       textContent,
  //       cc,
  //       bcc,
  //       attachments,
  //       { endpoint: 'send-dynamic', parameters: params }
  //     );
  //     ErrorHandler.sendServiceResult(res, result);
  //   } catch (error) {
  //     const envLabel = process.env.NODE_ENV === 'production' ? 'SERVER' : 'LOCAL';
  //     console.error(`[${envLabel}] Email send-dynamic failed:`, error instanceof Error ? error.message : error);
  //     ErrorHandler.sendErrorResponse(res, error, 'Error in sendDynamic', 500);
  //   }
  // }
  // static async sendDynamic(req: Request, res: Response): Promise<void> {
  //   try {
  //     // ✅ Sabse pehle raw line breaks fix karo
  //     try {
  //       const rawStr = JSON.stringify(req.body)
  //         .replace(/\r\n/g, '\\n')
  //         .replace(/\r/g, '\\n')
  //         .replace(/\n/g, '\\n');  
  //       req.body = JSON.parse(rawStr);
  //     } catch (e) {
  //       console.error('req.body sanitize failed:', e);
  //     }

  //     const { to, templateName, parameters, subject, cc, bcc, attachments } = req.body;

  //     const toVal =
  //       to != null
  //         ? (Array.isArray(to) ? to : [to])
  //           .map((e: unknown) => (e != null ? String(e).trim() : ""))
  //           .filter(Boolean)
  //         : [];
  //     if (toVal.length === 0) {
  //       ErrorHandler.sendValidationError(res, 'Missing or empty required field: "to" (recipient email) is required');
  //       return;
  //     }
  //     if (templateName == null || String(templateName).trim() === "") {
  //       ErrorHandler.sendValidationError(res, 'Missing or empty required field: "templateName" is required');
  //       return;
  //     }

  //     const params: Record<string, any> = parameters != null ? { ...parameters } : {};

  //     Object.assign(params);

  //     Object.keys(params).forEach(key => {
  //       if (params[key] === '' || params[key] === null || params[key] === undefined) {
  //         params[key] = 'N/A';
  //       } else if (typeof params[key] === 'string') {
  //         if (key === 'LTVCACRatio') {
  //           params[key] = params[key].replace(/\d+\.\d+/g, (match: string) => parseFloat(match).toFixed(1));
  //         } else if (key === 'GrossRevenue') {
  //           params[key] = params[key].replace(/\d+\.\d{3,}/g, (match: string) => parseFloat(match).toFixed(2));
  //         } 
  //         else if (key === 'GA4Sessions') {
  //           params[key] = params[key].replace(/\d+\.\d+/g, (match: string) => parseFloat(match).toFixed(0));
  //         } 
  //         else if (key === 'GoogleAdsSpend') {
  //           params[key] = params[key].replace(/\d+\.\d+/g, (match: string) => parseFloat(match).toFixed(0));
  //         } else if (key === 'AOV') {
  //           params[key] = params[key].replace(/\d+\.\d+/g, (match: string) => parseFloat(match).toFixed(0));
  //         } 
  //         else if (key === 'BlendedROAS') {
  //           params[key] = params[key].replace(/\d+\.\d+/g, (match: string) => parseFloat(match).toFixed(1));
  //         }
  //         else if (key === 'MetaROAS') {
  //           params[key] = params[key].replace(/\d+\.\d+/g, (match: string) => parseFloat(match).toFixed(1));
  //         }
  //          else if (key === 'GA4Sessions' || key === 'GA4Users') {
  //           params[key] = params[key].replace(/(?<!\$)\b\d+\b/g, (match: string) => {
  //             return parseInt(match).toLocaleString('en-IN');
  //           });
  //         } else if (key === 'PositiveChanges' || key === 'RequiresReviews') {
  //           params[key] = params[key] 
  //             .replace(/\\n/g, '<br/>')
  //             .replace(/\r\n/g, '<br/>')
  //             .replace(/\r/g, '<br/>')
  //             .replace(/\n/g, '<br/>');
  //         } else {
  //           params[key] = params[key].replace(/\d+\.\d{3,}/g, (match: string) => parseFloat(match).toFixed(2));
  //         }
  //       }
  //     });

  //     const { TemplateBuilder } = await import("../services/twiliotemplateBuilder.js");
  //     const { getTemplateConfig } = await import("../config/twiliotemplateConfigs.js");
  //     const { getEmailTemplate } = await import("../templates/twilioemailTemplates.js");

  //     const config = getTemplateConfig(templateName);
  //     if (config) {
  //       // Compatibility: handle common payload aliases / key typos for this template
  //       // so validation doesn't block sending.
  //       if (config.name === 'ns_temp_Notification_temp2') {
  //         // Alias mapping (client keys -> template expected keys)
  //         if (params.MetaSpend == null && params.MetaAdsSpend != null) params.MetaSpend = params.MetaAdsSpend;
  //         if (params.Googleadsspend == null && params.GoogleAdsSpend != null) params.Googleadsspend = params.GoogleAdsSpend;

  //         // Pre-render metaAccounts array into HTML for the template
  //         const metaAccounts = params.metaAccounts;
  //         if (Array.isArray(metaAccounts) && metaAccounts.length > 0) {
  //           let accountsHtml = `<div style="margin-top:6px;">`;
  //           accountsHtml += `<div class="layer-header">META AD ACCOUNTS</div>`;
  //           for (const account of metaAccounts) {
  //             const id = account.Id || '';
  //             const last4 = id.slice(-4);
  //             const name = account.Name || 'N/A';
  //             const roas = account.Roas != null ? parseFloat(account.Roas).toFixed(2) : 'N/A';
  //             const revenue = account.Revenue != null ? `₹${parseFloat(account.Revenue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A';
  //             const spend = account.Spend != null ? `₹${parseFloat(account.Spend).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A';
  //             accountsHtml += `<table class="metrics-table" cellpadding="0" cellspacing="0">`;
  //             accountsHtml += `<tr><td colspan="3" style="padding:4px 3px 0 3px;"><div class="metric-value">${name} <span style="font-size:11px;">(XXX${last4})</span></div></td></tr>`;
  //             accountsHtml += `<tr>`;
  //             accountsHtml += `<td><div class="metric-label">Spend</div><div class="metric-value">${spend}</div></td>`;
  //             accountsHtml += `<td><div class="metric-label">ROAS</div><div class="metric-value">${roas}</div></td>`;
  //             accountsHtml += `<td><div class="metric-label">Revenue</div><div class="metric-value">${revenue}</div></td>`;
              
  //             accountsHtml += `</tr>`;
  //             accountsHtml += `</table>`;
  //           }
  //           accountsHtml += `</div>`;
  //           params.metaAccountsHtml = accountsHtml;
  //         } else {
  //           params.metaAccountsHtml = '<!-- -->';
  //         }
  //         // Clean up array fields so template builder doesn't choke
  //         delete params.metaAccounts;
  //         delete params.metaAccounts_count;

  //         // Normalize whitespace keys (typos like "PositiveC  hanges")
  //         const paramKeys = Object.keys(params);
  //         for (const required of config.requiredFields) {
  //           if (params[required] != null && params[required] !== '') continue;
  //           const matchedKey = paramKeys.find(k => normalizeKeyWhitespace(k) === required);
  //           if (matchedKey != null) params[required] = params[matchedKey];
  //         }

  //         // Fill still-missing required fields with N/A
  //         for (const required of config.requiredFields) {
  //           if (params[required] == null || params[required] === '') params[required] = 'N/A';
  //         }
  //       }

  //       // Handle MetaAccountSummary for ns_temp_Notification_temp1
  //       if (config.name === 'ns_temp_Notification_temp1') {
  //         const metaAccountSummary = params.MetaAccountSummary;
  //         if (Array.isArray(metaAccountSummary) && metaAccountSummary.length > 0) {
  //           let summaryHtml = '';
  //           for (const line of metaAccountSummary) {
  //             summaryHtml += `<li><span>•</span> <span>${String(line)}</span></li>`;
  //           }
  //           params.metaAccountSummaryHtml = summaryHtml;
  //         } else {
  //           params.metaAccountSummaryHtml = '<!-- -->';
  //         }
  //         delete params.MetaAccountSummary;

  //         // GoogleAccountSummary for ns_temp_Notification_temp1
  //         const googleAccountSummary = params.GoogleAccountSummary;
  //         if (Array.isArray(googleAccountSummary) && googleAccountSummary.length > 0) {
  //           let gSummaryHtml = '';
  //           for (const line of googleAccountSummary) {
  //             gSummaryHtml += `<li><span>•</span> <span>${String(line)}</span></li>`;
  //           }
  //           params.googleAccountSummaryHtml = gSummaryHtml;
  //         } else {
  //           params.googleAccountSummaryHtml = '<!-- -->';
  //         }
  //         delete params.GoogleAccountSummary;
  //       }

  //       // Handle googleAccounts for ns_temp_Notification_temp2
  //       if (config.name === 'ns_temp_Notification_temp2') {
  //         const googleAccounts = params.googleAccounts;
  //         if (Array.isArray(googleAccounts) && googleAccounts.length > 0) {
  //           let gAccountsHtml = `<div style="margin-top:6px;"><div class="layer-header">GOOGLE AD ACCOUNTS</div>`;
  //           for (const account of googleAccounts) {
  //             const id = account.Id || '';
  //             const last4 = id.slice(-4);
  //             const name = account.Name || 'N/A';
  //             const roas = account.Roas != null ? parseFloat(account.Roas).toFixed(2) : 'N/A';
  //             const revenue = account.Revenue != null ? `₹${parseFloat(account.Revenue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A';
  //             const spend = account.Spend != null ? `₹${parseFloat(account.Spend).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A';
  //             gAccountsHtml += `<table class="metrics-table" cellpadding="0" cellspacing="0">`;
  //             gAccountsHtml += `<tr><td colspan="3" style="padding:4px 3px 0 3px;"><div class="metric-value">${name} <span style="font-size:11px;">(XXX${last4})</span></div></td></tr>`;
  //             gAccountsHtml += `<tr>`;
  //             gAccountsHtml += `<td><div class="metric-label">ROAS</div><div class="metric-value">${roas}</div></td>`;
  //             gAccountsHtml += `<td><div class="metric-label">Revenue</div><div class="metric-value">${revenue}</div></td>`;
  //             gAccountsHtml += `<td><div class="metric-label">Spend</div><div class="metric-value">${spend}</div></td>`;
  //             gAccountsHtml += `</tr></table>`;
  //           }
  //           gAccountsHtml += `</div>`;
  //           params.googleAccountsHtml = gAccountsHtml;
  //         } else {
  //           params.googleAccountsHtml = '<!-- -->';
  //         }
  //         delete params.googleAccounts;
  //         delete params.googleAccounts_count;
  //       }

  //       // Handle InventoryHealth for both templates
  //       const inventoryHealth = params.InventoryHealth;
  //       if (inventoryHealth && String(inventoryHealth).trim() !== '') {
  //         if (config.name === 'ns_temp_Notification_temp1') {
  //           // temp1: heading + bullet points style (same as Marketing section)
  //           const lines = String(inventoryHealth).split(/\n/).filter((l: string) => l.trim());
  //           let ihHtml = `<h1>𝗜𝗻𝘃𝗲𝗻𝘁𝗼𝗿𝘆 𝗛𝗲𝗮𝗹𝘁𝗵</h1><ul>`;
  //           for (const line of lines) {
  //             ihHtml += `<li><span>•</span> <span>${line.trim()}</span></li>`;
  //           }
  //           ihHtml += `</ul>`;
  //           params.inventoryHealthHtml = ihHtml;
  //         } else {
  //           // temp2: amber colored box
  //           let ihHtml = `<div style="background:#fffbeb; border-left:4px solid #f59e0b; padding:15px; border-radius:12px; margin-top:10px;">`;
  //           ihHtml += `<div class="layer-header" style="margin-bottom:5px;">INVENTORY HEALTH</div>`;
  //           ihHtml += `<div style="white-space:pre-line; font-size:14px;">${String(inventoryHealth)}</div>`;
  //           ihHtml += `</div>`;
  //           params.inventoryHealthHtml = ihHtml;
  //         }
  //       } else {
  //         params.inventoryHealthHtml = '<!-- -->';
  //       }
  //       delete params.InventoryHealth;

  //       // Handle CancelCount/RefundAmount conditionally
  //       const cancelCount = params.CancelCount;
  //       const refundAmount = params.RefundAmount;
  //       if (cancelCount && String(cancelCount).trim() !== '' && refundAmount && String(refundAmount).trim() !== '') {
  //         if (config.name === 'ns_temp_Notification_temp2') {
  //           params.cancelRefundHtml = `<tr><td><div class="metric-label">Cancel Count</div><div class="metric-value">${String(cancelCount)}</div></td><td><div class="metric-label">Refund Amount</div><div class="metric-value">${String(refundAmount)}</div></td><td></td></tr>`;
  //         }
  //         if (config.name === 'ns_temp_Notification_temp1') {
  //           params.cancelRefundText = ` A total of ${String(cancelCount)} orders were cancelled, with a refund amount of ${String(refundAmount)}.`;
  //         }
  //       } else {
  //         params.cancelRefundHtml = '<!-- -->';
  //         params.cancelRefundText = '<!-- -->';
  //       }
  //       delete params.CancelCount;
  //       delete params.RefundAmount;

  //       const validation = TemplateBuilder.validateParameters(params, config);
  //       if (!validation.valid) {
  //         ErrorHandler.sendValidationError(res, "Missing required fields", validation.missing);
  //         return;
  //       }
  //     }

  //     const template = getEmailTemplate(templateName);
  //     if (!template) {
  //       ErrorHandler.sendNotFoundError(res, `Template "${templateName}"`);
  //       return;
  //     }

  //     const htmlContent = TemplateBuilder.buildEmailContent(template.html, params);
  //     const emailSubject = subject || TemplateBuilder.buildEmailContent(template.subject, params);
  //     const textContent = template.text ? TemplateBuilder.buildEmailContent(template.text, params) : undefined;

  //     const result = await EmailService.sendEmail(
  //       toVal.length === 1 ? toVal[0] : toVal,
  //       emailSubject,
  //       htmlContent,
  //       textContent,
  //       cc,
  //       bcc,
  //       attachments,
  //       { endpoint: "send-dynamic", templateName: String(templateName).trim(), parameters: params }
  //     );

  //     ErrorHandler.sendServiceResult(res, result);
  //   } catch (error) {
  //     const envLabel = process.env.NODE_ENV === "production" ? "SERVER" : "LOCAL";
  //     console.error(`[${envLabel}] Email send-dynamic failed:`, error instanceof Error ? error.message : error);
  //     ErrorHandler.sendErrorResponse(res, error, "Error in sendDynamic", 500);
  //   }
  // }

  static async sendDynamic(req: Request, res: Response): Promise<void> {
    try {
      try {
        const rawStr = JSON.stringify(req.body)
          .replace(/\r\n/g, '\\n')
          .replace(/\r/g, '\\n')
          .replace(/\n/g, '\\n');  
        req.body = JSON.parse(rawStr);
      } catch (e) {
        console.error('req.body sanitize failed:', e);
      }

      const { to, templateName, parameters, subject, cc, bcc, attachments } = req.body;

      const toVal =
        to != null
          ? (Array.isArray(to) ? to : [to])
            .map((e: unknown) => (e != null ? String(e).trim() : ""))
            .filter(Boolean)
          : [];
      if (toVal.length === 0) {
        ErrorHandler.sendValidationError(res, 'Missing or empty required field: "to" (recipient email) is required');
        return;
      }
      if (templateName == null || String(templateName).trim() === "") {
        ErrorHandler.sendValidationError(res, 'Missing or empty required field: "templateName" is required');
        return;
      }

      const params: Record<string, any> = parameters != null ? { ...parameters } : {};

      Object.assign(params);

      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          params[key] = 'N/A';
        } else if (typeof params[key] === 'string') {
          if (key === 'LTVCACRatio') {
            params[key] = params[key].replace(/\d+\.\d+/g, (match: string) => parseFloat(match).toFixed(1));
          } else if (key === 'GrossRevenue') {
            params[key] = params[key].replace(/\d+\.\d{3,}/g, (match: string) => parseFloat(match).toFixed(2));
          } 
          else if (key === 'GoogleAdsSpend' || key === 'MetaAdsSpend') {
            params[key] = params[key].replace(/\.\d+/g, '');
          } else if (key === 'AOV') {
            params[key] = params[key].replace(/\.\d+/g, '');
          } 
          else if (key === 'BlendedROAS') {
            params[key] = params[key].replace(/\d+\.\d+/g, (match: string) => parseFloat(match).toFixed(1));
          }
          else if (key === 'MetaROAS') {
            params[key] = params[key].replace(/\d+\.\d+/g, (match: string) => parseFloat(match).toFixed(1));
          }
          else if (key === 'GA4Sessions' || key === 'GA4Users') {
            params[key] = params[key].replace(/\.\d+/g, '');
            params[key] = params[key].replace(/(?<!\$)\b\d+\b/g, (match: string) => {
              return parseInt(match).toLocaleString('en-IN');
            });
          } else if (key === 'PositiveChanges' || key === 'RequiresReviews') {
            params[key] = params[key] 
              .replace(/\\n/g, '<br/>')
              .replace(/\r\n/g, '<br/>')
              .replace(/\r/g, '<br/>')
              .replace(/\n/g, '<br/>');
          } else {
            params[key] = params[key].replace(/\d+\.\d{3,}/g, (match: string) => parseFloat(match).toFixed(2));
          }
        }
      });

      const { TemplateBuilder } = await import("../services/twiliotemplateBuilder.js");
      const { getTemplateConfig } = await import("../config/twiliotemplateConfigs.js");
      const { getEmailTemplate } = await import("../templates/twilioemailTemplates.js");

      const config = getTemplateConfig(templateName);
      if (config) {

        const isTemp2Variant = [
          'ns_temp_Notification_temp2',
          'ns_temp_Notification_temp2_weekly',
          'ns_temp_Notification_temp2_monthly'
        ].includes(config.name);

        const isTemp1Variant = [
          'ns_temp_Notification_temp1',
          'ns_temp_Notification_temp1_weekly',
          'ns_temp_Notification_temp1_monthly'
        ].includes(config.name);

        if (isTemp2Variant) {
          if (params.MetaSpend == null && params.MetaAdsSpend != null) params.MetaSpend = params.MetaAdsSpend;
          if (params.Googleadsspend == null && params.GoogleAdsSpend != null) params.Googleadsspend = params.GoogleAdsSpend;

          const metaAccounts = params.metaAccounts;
          if (Array.isArray(metaAccounts) && metaAccounts.length > 0) {
            let accountsHtml = `<div style="margin-top:6px;">`;
            accountsHtml += `<div class="layer-header">META AD ACCOUNTS</div>`;
            for (const account of metaAccounts) {
              const id = account.Id || '';
              const last4 = id.slice(-4);
              const name = account.Name || 'N/A';
              const roas = account.Roas != null ? parseFloat(account.Roas).toFixed(2) : 'N/A';
              const revenue = account.Revenue != null ? `₹${parseFloat(account.Revenue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A';
              const spend = account.Spend != null ? `₹${parseFloat(account.Spend).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A';
              accountsHtml += `<table class="metrics-table" cellpadding="0" cellspacing="0">`;
              accountsHtml += `<tr><td colspan="3" style="padding:4px 3px 0 3px;"><div class="metric-value">${name} <span style="font-size:11px;">(XXX${last4})</span></div></td></tr>`;
              accountsHtml += `<tr>`;
              accountsHtml += `<td><div class="metric-label">Spend</div><div class="metric-value">${spend}</div></td>`;
              accountsHtml += `<td><div class="metric-label">ROAS</div><div class="metric-value">${roas}</div></td>`;
              accountsHtml += `<td><div class="metric-label">Revenue</div><div class="metric-value">${revenue}</div></td>`;
              accountsHtml += `</tr>`;
              accountsHtml += `</table>`;
            }
            accountsHtml += `</div>`;
            params.metaAccountsHtml = accountsHtml;
          } else {
            params.metaAccountsHtml = '<!-- -->';
          }
          delete params.metaAccounts;
          delete params.metaAccounts_count;

          const paramKeys = Object.keys(params);
          for (const required of config.requiredFields) {
            if (params[required] != null && params[required] !== '') continue;
            const matchedKey = paramKeys.find(k => normalizeKeyWhitespace(k) === required);
            if (matchedKey != null) params[required] = params[matchedKey];
          }

          for (const required of config.requiredFields) {
            if (params[required] == null || params[required] === '') params[required] = 'N/A';
          }
        }

        // Handle MetaAccountSummary for ns_temp_Notification_temp1 variants
        if (isTemp1Variant) {
          const metaAccountSummary = params.MetaAccountSummary;
          if (Array.isArray(metaAccountSummary) && metaAccountSummary.length > 0) {
            let summaryHtml = '';
            for (const line of metaAccountSummary) {
              summaryHtml += `<li><span>•</span> <span>${String(line)}</span></li>`;
            }
            params.metaAccountSummaryHtml = summaryHtml;
          } else {
            params.metaAccountSummaryHtml = '<!-- -->';
          }
          delete params.MetaAccountSummary;

          const googleAccountSummary = params.GoogleAccountSummary;
          if (Array.isArray(googleAccountSummary) && googleAccountSummary.length > 0) {
            let gSummaryHtml = '';
            for (const line of googleAccountSummary) {
              gSummaryHtml += `<li><span>•</span> <span>${String(line)}</span></li>`;
            }
            params.googleAccountSummaryHtml = gSummaryHtml;
          } else {
            params.googleAccountSummaryHtml = '<!-- -->';
          }
          delete params.GoogleAccountSummary;
        }

        // Handle googleAccounts for temp2 variants
        if (isTemp2Variant) {
          const googleAccounts = params.googleAccounts;
          if (Array.isArray(googleAccounts) && googleAccounts.length > 0) {
            let gAccountsHtml = `<div style="margin-top:6px;"><div class="layer-header">GOOGLE AD ACCOUNTS</div>`;
            for (const account of googleAccounts) {
              const id = account.Id || '';
              const last4 = id.slice(-4);
              const name = account.Name || 'N/A';
              const roas = account.Roas != null ? parseFloat(account.Roas).toFixed(2) : 'N/A';
              const revenue = account.Revenue != null ? `₹${parseFloat(account.Revenue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A';
              const spend = account.Spend != null ? `₹${parseFloat(account.Spend).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A';
              gAccountsHtml += `<table class="metrics-table" cellpadding="0" cellspacing="0">`;
              gAccountsHtml += `<tr><td colspan="3" style="padding:4px 3px 0 3px;"><div class="metric-value">${name} <span style="font-size:11px;">(XXX${last4})</span></div></td></tr>`;
              gAccountsHtml += `<tr>`;
              gAccountsHtml += `<td><div class="metric-label">ROAS</div><div class="metric-value">${roas}</div></td>`;
              gAccountsHtml += `<td><div class="metric-label">Revenue</div><div class="metric-value">${revenue}</div></td>`;
              gAccountsHtml += `<td><div class="metric-label">Spend</div><div class="metric-value">${spend}</div></td>`;
              gAccountsHtml += `</tr></table>`;
            }
            gAccountsHtml += `</div>`;
            params.googleAccountsHtml = gAccountsHtml;
          } else {
            params.googleAccountsHtml = '<!-- -->';
          }
          delete params.googleAccounts;
          delete params.googleAccounts_count;
        }

        // Handle InventoryHealth for both template variants
        const inventoryHealth = params.InventoryHealth;
        if (inventoryHealth && String(inventoryHealth).trim() !== '') {
          if (isTemp1Variant) {
            const lines = String(inventoryHealth).split(/\n/).filter((l: string) => l.trim());
            let ihHtml = `<h1>𝗜𝗻𝘃𝗲𝗻𝘁𝗼𝗿𝘆 𝗛𝗲𝗮𝗹𝘁𝗵</h1><ul>`;
            for (const line of lines) {
              ihHtml += `<li><span>•</span> <span>${line.trim()}</span></li>`;
            }
            ihHtml += `</ul>`;
            params.inventoryHealthHtml = ihHtml;
          } else {
            let ihHtml = `<div style="background:#fffbeb; border-left:4px solid #f59e0b; padding:15px; border-radius:12px; margin-top:10px;">`;
            ihHtml += `<div class="layer-header" style="margin-bottom:5px;">INVENTORY HEALTH</div>`;
            ihHtml += `<div style="white-space:pre-line; font-size:14px;">${String(inventoryHealth)}</div>`;
            ihHtml += `</div>`;
            params.inventoryHealthHtml = ihHtml;
          }
        } else {
          params.inventoryHealthHtml = '<!-- -->';
        }
        delete params.InventoryHealth;

        // Handle CancelCount/RefundAmount conditionally
        const cancelCount = params.CancelCount;
        const refundAmount = params.RefundAmount;
        if (cancelCount && String(cancelCount).trim() !== '' && refundAmount && String(refundAmount).trim() !== '') {
          if (isTemp2Variant) {
            params.cancelRefundHtml = `<tr><td><div class="metric-label">Cancel Count</div><div class="metric-value">${String(cancelCount)}</div></td><td><div class="metric-label">Refund Amount</div><div class="metric-value">${String(refundAmount)}</div></td><td></td></tr>`;
          }
          if (isTemp1Variant) {
            params.cancelRefundText = ` A total of ${String(cancelCount)} orders were cancelled, with a refund amount of ${String(refundAmount)}.`;
          }
        } else {
          params.cancelRefundHtml = '<!-- -->';
          params.cancelRefundText = '<!-- -->';
        }
        delete params.CancelCount;
        delete params.RefundAmount;

        const validation = TemplateBuilder.validateParameters(params, config);
        if (!validation.valid) {
          ErrorHandler.sendValidationError(res, "Missing required fields", validation.missing);
          return;
        }
      }

      const template = getEmailTemplate(templateName);
      if (!template) {
        ErrorHandler.sendNotFoundError(res, `Template "${templateName}"`);
        return;
      }

      const htmlContent = TemplateBuilder.buildEmailContent(template.html, params);
      const emailSubject = subject || TemplateBuilder.buildEmailContent(template.subject, params);
      const textContent = template.text ? TemplateBuilder.buildEmailContent(template.text, params) : undefined;

      if (isRabbitEnabled()) {
        const queued = await publishNotificationJob('email_send_dynamic_twilio', {
          to: toVal.length === 1 ? toVal[0] : toVal,
          subject: emailSubject,
          htmlContent,
          textContent,
          cc,
          bcc,
          attachments,
          logContext: { endpoint: "send-dynamic", templateName: String(templateName).trim(), parameters: params }
        });

        ErrorHandler.sendSuccess(res, {
          message: 'Email request queued',
          data: {
            queued: queued.queued,
            jobId: queued.jobId,
            endpoint: 'api-twilio/email/send-dynamic-twilio'
          }
        }, 202);
        return;
      }

      const result = await EmailService.sendEmail(
        toVal.length === 1 ? toVal[0] : toVal,
        emailSubject,
        htmlContent,
        textContent,
        cc,
        bcc,
        attachments,
        { endpoint: "send-dynamic", templateName: String(templateName).trim(), parameters: params }
      );

      ErrorHandler.sendServiceResult(res, result);
    } catch (error) {
      const envLabel = process.env.NODE_ENV === "production" ? "SERVER" : "LOCAL";
      console.error(`[${envLabel}] Email send-dynamic failed:`, error instanceof Error ? error.message : error);
      ErrorHandler.sendErrorResponse(res, error, "Error in sendDynamic", 500);
    }
  }

  // POST /api-twilio/email/send-user-template
  // Accepts a raw HTML template with {{variable}} placeholders + variable values, then sends the email.
  // No pre-defined template required — user supplies the full template and data.
  static async sendUserTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { to, subject, templateHtml, variables, cc, bcc, attachments } = req.body;

      const toVal =
        to != null
          ? (Array.isArray(to) ? to : [to])
              .map((e: unknown) => (e != null ? String(e).trim() : ''))
              .filter(Boolean)
          : [];

      if (toVal.length === 0) {
        ErrorHandler.sendValidationError(res, 'Missing or empty required field: "to" (recipient email) is required');
        return;
      }

      if (subject == null || typeof subject !== 'string' || subject.trim() === '') {
        ErrorHandler.sendValidationError(res, 'Missing or empty required field: "subject" is required');
        return;
      }

      if (templateHtml == null || typeof templateHtml !== 'string' || templateHtml.trim() === '') {
        ErrorHandler.sendValidationError(res, 'Missing or empty required field: "templateHtml" (HTML string) is required');
        return;
      }

      const vars: Record<string, any> = variables != null && typeof variables === 'object' ? { ...variables } : {};

      const renderedHtml = replacePlaceholders(templateHtml, vars);
      const renderedSubject = replacePlaceholders(subject, vars);

      const result = await EmailService.sendEmail(
        toVal.length === 1 ? toVal[0] : toVal,
        renderedSubject,
        renderedHtml,
        undefined,
        cc,
        bcc,
        attachments,
        { endpoint: 'send-user-template', parameters: vars }
      );

      ErrorHandler.sendServiceResult(res, result);
    } catch (error) {
      ErrorHandler.sendErrorResponse(res, error, 'Error in sendUserTemplate', 500);
    }
  }
}
