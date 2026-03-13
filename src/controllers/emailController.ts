import { Request, Response } from 'express';
import { EmailService } from '../services/emailService.js';
import { ErrorHandler } from '../utils/errorHandler.js';

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
            params[key] = params[key].replace(/\d+\.\d+/g, (match: string) => parseFloat(match).toFixed(0));
          }
          else if (key === 'GoogleAdsSpend') {
            params[key] = params[key].replace(/\d+\.\d+/g, (match: string) => parseFloat(match).toFixed(0));
          }
          else if (key === 'AOV') {
            params[key] = params[key].replace(/\d+\.\d+/g, (match: string) => parseFloat(match).toFixed(0));
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
            params[key] = params[key].replace(/\\n/g, '\n').replace(/\n/g, '<br/>');
          }
          else {
            params[key] = params[key].replace(/\d+\.\d{3,}/g, (match: string) => parseFloat(match).toFixed(2));
          }
        }
      });

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
      const { getAvailableTemplates } = await import('../templates/emailTemplates.js');
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
  static async sendDynamic(req: Request, res: Response): Promise<void> {
    try {
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

      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          params[key] = 'N/A';
        } else if (typeof params[key] === 'string') {
          params[key] = params[key].replace(/\d+\.\d{3,}/g, (match: string) => parseFloat(match).toFixed(2));
        }
      });

      const { TemplateBuilder } = await import("../services/templateBuilder.js");
      const { getTemplateConfig } = await import("../config/templateConfigs.js");
      const { getEmailTemplate } = await import("../templates/emailTemplates.js");

      const config = getTemplateConfig(templateName);
      if (config) {
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

      const result = await EmailService.sendEmail(
        toVal.length === 1 ? toVal[0] : toVal,
        emailSubject,
        htmlContent,
        textContent,
        cc,
        bcc,
        attachments,
        { endpoint: "send-dynamic", parameters: params } // ✅ this triggers logo only for this flow
      );

      ErrorHandler.sendServiceResult(res, result);
    } catch (error) {
      const envLabel = process.env.NODE_ENV === "production" ? "SERVER" : "LOCAL";
      console.error(`[${envLabel}] Email send-dynamic failed:`, error instanceof Error ? error.message : error);
      ErrorHandler.sendErrorResponse(res, error, "Error in sendDynamic", 500);
    }
  }
}
