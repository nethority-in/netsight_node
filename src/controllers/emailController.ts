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
  static async sendDynamic(req: Request, res: Response): Promise<void> {
    try {
      const { to, templateName, parameters, subject, cc, bcc, attachments } = req.body;

      const toVal = to != null ? (Array.isArray(to) ? to : [to]).map((e: unknown) => (e != null ? String(e).trim() : '')).filter(Boolean) : [];
      if (toVal.length === 0) {
        ErrorHandler.sendValidationError(res, 'Missing or empty required field: "to" (recipient email) is required');
        return;
      }
      if (templateName == null || String(templateName).trim() === '') {
        ErrorHandler.sendValidationError(res, 'Missing or empty required field: "templateName" is required');
        return;
      }

      // Parameters only (e.g. business_performance_summary). No components.body mapping.
      const params: Record<string, any> = parameters != null ? { ...parameters } : {};

      const { TemplateBuilder } = await import('../services/templateBuilder.js');
      const { getTemplateConfig } = await import('../config/templateConfigs.js');
      const { getEmailTemplate } = await import('../templates/emailTemplates.js');

      const config = getTemplateConfig(templateName);
      if (config) {
        const validation = TemplateBuilder.validateParameters(params, config);
        if (!validation.valid) {
          ErrorHandler.sendValidationError(res, 'Missing required fields', validation.missing);
          return;
        }
      }

      const template = getEmailTemplate(templateName);
      if (!template) {
        ErrorHandler.sendNotFoundError(res, `Template "${templateName}"`);
        return;
      }

      let htmlContent = TemplateBuilder.buildEmailContent(template.html, params);
      let emailSubject = subject || TemplateBuilder.buildEmailContent(template.subject, params);
      const textContent = template.text ? TemplateBuilder.buildEmailContent(template.text, params) : undefined;

      const result = await EmailService.sendEmail(
        toVal.length === 1 ? toVal[0] : toVal,
        emailSubject,
        htmlContent,
        textContent,
        cc,
        bcc,
        attachments,
        { endpoint: 'send-dynamic' }
      );
      ErrorHandler.sendServiceResult(res, result);
    } catch (error) {
      const envLabel = process.env.NODE_ENV === 'production' ? 'SERVER' : 'LOCAL';
      console.error(`[${envLabel}] Email send-dynamic failed:`, error instanceof Error ? error.message : error);
      ErrorHandler.sendErrorResponse(res, error, 'Error in sendDynamic', 500);
    }
  }
}
