import { Request, Response } from 'express';
import { EmailService } from '../services/emailService.js';

export class EmailController {
  // POST /api/email/send-template
  static async sendTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { to, templateName, templateVariables, subject, cc, bcc } = req.body;

      if (!to || !templateName) {
        res.status(400).json({
          ok: false,
          error: {
            message: 'Missing required fields: "to" and "templateName" are required',
            status: 400,
            code: 400
          }
        });
        return;
      }

      // Send template email
      const result = await EmailService.sendTemplate(
        to,
        templateName,
        templateVariables || {},
        subject,
        cc,
        bcc
      );

      const statusCode = result.ok ? 200 : (result.error?.status || 500);
      res.status(statusCode).json(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error in sendTemplate controller:', error);
      res.status(500).json({
        ok: false,
        error: {
          message: errorMessage,
          status: 500,
          code: 500
        }
      });
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
        bcc
      } = req.body;

      // Only validate required fields
      if (!to || !storeName || !date) {
        res.status(400).json({
          ok: false,
          error: {
            message: 'Missing required fields: "to", "storeName", and "date" are required',
            status: 400,
            code: 400
          }
        });
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
      req.body = { to, templateName: 'daily_kpi_snapshot', parameters, cc, bcc };
      return await this.sendDynamic(req, res);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error in sendDailyKpiSnapshot controller:', error);
      res.status(500).json({
        ok: false,
        error: {
          message: errorMessage,
          status: 500,
          code: 500
        }
      });
    }
  }

  // POST /api/email/send
  static async sendEmail(req: Request, res: Response): Promise<void> {
    try {
      const { to, subject, htmlContent, textContent, cc, bcc } = req.body;

      // Validate required fields
      if (!to || !subject || !htmlContent) {
        res.status(400).json({
          ok: false,
          error: {
            message: 'Missing required fields: "to", "subject", and "htmlContent" are required',
            status: 400,
            code: 400
          }
        });
        return;
      }

      // Send email
      const result = await EmailService.sendEmail(
        to,
        subject,
        htmlContent,
        textContent,
        cc,
        bcc
      );

      const statusCode = result.ok ? 200 : (result.error?.status || 500);
      res.status(statusCode).json(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error in sendEmail controller:', error);
      res.status(500).json({
        ok: false,
        error: {
          message: errorMessage,
          status: 500,
          code: 500
        }
      });
    }
  }

  // GET /api/email/templates
  static async getTemplates(_req: Request, res: Response): Promise<void> {
    try {
      const { getAvailableTemplates } = await import('../templates/emailTemplates.js');
      const templates = getAvailableTemplates();

      res.status(200).json({
        ok: true,
        data: {
          templates,
          count: templates.length
        }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error in getTemplates controller:', error);
      res.status(500).json({
        ok: false,
        error: {
          message: errorMessage,
          status: 500,
          code: 500
        }
      });
    }
  }

  // POST /api/email/send-dynamic - Flexible template with dynamic parameters
  static async sendDynamic(req: Request, res: Response): Promise<void> {
    try {
      const { to, templateName, parameters, subject, cc, bcc } = req.body;

      if (!to || !templateName) {
        res.status(400).json({
          ok: false,
          error: {
            message: 'Missing required fields: "to" and "templateName" are required',
            status: 400,
            code: 400
          }
        });
        return;
      }

      const params = parameters || {};

      const { TemplateBuilder } = await import('../services/templateBuilder.js');
      const { getTemplateConfig } = await import('../config/templateConfigs.js');
      const { getEmailTemplate } = await import('../templates/emailTemplates.js');

      const config = getTemplateConfig(templateName);
      if (config) {
        const validation = TemplateBuilder.validateParameters(params, config);
        if (!validation.valid) {
          res.status(400).json({
            ok: false,
            error: {
              message: `Missing required fields: ${validation.missing.join(', ')}`,
              status: 400,
              code: 400
            }
          });
          return;
        }
      }

      const template = getEmailTemplate(templateName);
      if (!template) {
        res.status(404).json({
          ok: false,
          error: {
            message: `Template "${templateName}" not found`,
            status: 404,
            code: 404
          }
        });
        return;
      }

      let htmlContent = TemplateBuilder.buildEmailContent(template.html, params);
      let emailSubject = subject || TemplateBuilder.buildEmailContent(template.subject, params);
      const textContent = template.text ? TemplateBuilder.buildEmailContent(template.text, params) : undefined;

      const result = await EmailService.sendEmail(to, emailSubject, htmlContent, textContent, cc, bcc);
      const statusCode = result.ok ? 200 : (result.error?.status || 500);
      res.status(statusCode).json(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error in sendDynamic controller:', error);
      res.status(500).json({
        ok: false,
        error: {
          message: errorMessage,
          status: 500,
          code: 500
        }
      });
    }
  }
}
