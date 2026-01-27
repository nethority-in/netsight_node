import { Request, Response } from 'express';
import { WhatsAppService } from '../services/whatsappService.js';

export class WhatsAppController {
      // POST /api/whatsapp/send-template
  static async sendTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { to, templateName, languageCode, components } = req.body;
      // Validate required fields
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
      // Use default language code if not provided
      const langCode = languageCode || 'en';
      
      // Support both old format (parameters array) and new format (components object)
      let templateComponents: Array<{
        type: string;
        parameters?: Array<{ type: string; text?: string; payload?: string }>;
        sub_type?: string;
        index?: number;
      }> | undefined = undefined;

      // New dynamic format: components object with header, body, buttons
      if (components) {
        templateComponents = [];
        
        // Header component
        if (components.header && Array.isArray(components.header)) {
          templateComponents.push({
            type: 'header',
            parameters: components.header.map((param: string | { type: string; text?: string; payload?: string }) => 
              typeof param === 'string' ? { type: 'text', text: param } : param
            )
          });
        }
        
        // Body component
        if (components.body && Array.isArray(components.body)) {
          templateComponents.push({
            type: 'body',
            parameters: components.body.map((param: string | { type: string; text?: string }) => 
              typeof param === 'string' ? { type: 'text', text: param } : param
            )
          });
        }
        
        // Button components
        if (components.buttons && Array.isArray(components.buttons) && templateComponents) {
          const componentsArray = templateComponents; // Store reference for TypeScript
          components.buttons.forEach((button: { type: string; text?: string; payload?: string; index?: number }, idx: number) => {
            if (button.type === 'quick_reply' || button.type === 'url') {
              componentsArray.push({
                type: 'button',
                sub_type: button.type,
                index: button.index !== undefined ? button.index : idx,
                parameters: button.payload ? [{ type: 'payload', payload: button.payload }] : 
                           button.text ? [{ type: 'text', text: button.text }] : []
              });
            }
          });
        }
      } 
      // Legacy format: simple parameters array (for backward compatibility)
      else if (req.body.parameters && Array.isArray(req.body.parameters)) {
        templateComponents = [{
          type: 'body',
          parameters: req.body.parameters.map((param: string) => ({
            type: 'text',
            text: param
          }))
        }];
      }

      // Send template message
      const result = await WhatsAppService.sendTemplate(to, templateName, langCode, templateComponents || undefined);
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
  // Send daily KPI snapshot template - Now flexible with optional parameters (uses sendDynamic internally)
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
        loyaltyPoints
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
      req.body = { to, templateName: 'daily_kpi_snapshot', languageCode: 'en', parameters };
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

  // POST /api/whatsapp/send-dynamic - Flexible template with dynamic parameters
  // Accepts either:
  // - components: { body: string[], header?: array, buttons?: array } — passed through to WhatsApp (e.g. for templates with {{1}}..{{32}})
  // - parameters: object — used with TemplateBuilder + template config (named fields)
  static async sendDynamic(req: Request, res: Response): Promise<void> {
    try {
      const { to, templateName, languageCode, parameters, components } = req.body;

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

      const langCode = languageCode || 'en';

      // When components is provided (body/header/buttons arrays), build WhatsApp components and send directly.
      // This supports templates like daily_store_performance_summary with many positional params.
      if (components && (components.body ?? components.header ?? components.buttons)) {
        const templateComponents: Array<{
          type: string;
          parameters?: Array<{ type: string; text?: string; payload?: string }>;
          sub_type?: string;
          index?: number;
        }> = [];

        if (components.header && Array.isArray(components.header)) {
          templateComponents.push({
            type: 'header',
            parameters: components.header.map((param: string | { type: string; text?: string; payload?: string }) =>
              typeof param === 'string' ? { type: 'text', text: param } : param
            )
          });
        }
        if (components.body && Array.isArray(components.body)) {
          templateComponents.push({
            type: 'body',
            parameters: components.body.map((param: string | { type: string; text?: string }) =>
              typeof param === 'string' ? { type: 'text', text: param } : param
            )
          });
        }
        if (components.buttons && Array.isArray(components.buttons)) {
          components.buttons.forEach((button: { type: string; text?: string; payload?: string; index?: number }, idx: number) => {
            if (button.type === 'quick_reply' || button.type === 'url') {
              templateComponents.push({
                type: 'button',
                sub_type: button.type,
                index: button.index !== undefined ? button.index : idx,
                parameters: button.payload ? [{ type: 'payload', payload: button.payload }] :
                  button.text ? [{ type: 'text', text: button.text }] : []
              });
            }
          });
        }

        const result = await WhatsAppService.sendTemplate(to, templateName, langCode, templateComponents);
        const statusCode = result.ok ? 200 : (result.error?.status || 500);
        res.status(statusCode).json(result);
        return;
      }

      // Legacy: parameters object + TemplateBuilder (uses template config / fieldOrder)
      const params = parameters || {};
      const { TemplateBuilder } = await import('../services/templateBuilder.js');
      const { getTemplateConfig } = await import('../config/templateConfigs.js');

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

      const builtComponents = TemplateBuilder.buildWhatsAppComponents(params, config || {
        name: templateName,
        requiredFields: [],
        optionalFields: [],
        fieldOrder: Object.keys(params)
      });

      const result = await WhatsAppService.sendTemplate(to, templateName, langCode, builtComponents);
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
    // POST /api/whatsapp/send-text
  static async sendText(req: Request, res: Response): Promise<void> {
    try {
      const { to, text } = req.body;

      if (!to || !text) {
        res.status(400).json({
          ok: false,
          error: {
            message: 'Missing required fields: "to" and "text" are required',
            status: 400,
            code: 400
          }
        });
        return;
      }
      // Send text message
      const result = await WhatsAppService.sendText(to, text);
      // Return appropriate status code based on result
      const statusCode = result.ok ? 200 : (result.error?.status || 500);
      res.status(statusCode).json(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error in sendText controller:', error);
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
