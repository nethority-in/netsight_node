import { Request, Response } from 'express';
import { WhatsAppService } from '../services/whatsappService.js';
import { ErrorHandler } from '../utils/errorHandler.js';
import { appendWhatsAppLog, appendFromNumbersLog } from '../utils/logApiResponse.js';

export class WhatsAppController {
      // POST /api/whatsapp/send-template
  static async sendTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { to, templateName, languageCode, components, fromNumberId } = req.body;
      if (to == null || to === '') {
        ErrorHandler.sendValidationError(res, 'Missing or empty required field: "to" (recipient phone number) is required');
        return;
      }
      const toStr = String(to).trim();
      if (toStr.length === 0) {
        ErrorHandler.sendValidationError(res, 'Recipient "to" cannot be empty or whitespace only.');
        return;
      }
      if (templateName == null || String(templateName).trim() === '') {
        ErrorHandler.sendValidationError(res, 'Missing or empty required field: "templateName" is required');
        return;
      }
      // Use default language code if not provided
      const langCode = (languageCode != null && String(languageCode).trim() !== '') ? String(languageCode).trim() : 'en';
      
      // Support both old format (parameters array) and new format (components object with body or bodyNamed)
      let templateComponents: Array<{
        type: string;
        parameters?: Array<{ type: string; text?: string; payload?: string; parameter_name?: string }>;
        sub_type?: string;
        index?: number;
      }> | undefined = undefined;

      // New dynamic format: components object with header, body (positional or named), buttons
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
        
        // Body: named parameters (object) or positional (array)
        if (components.bodyNamed && typeof components.bodyNamed === 'object' && !Array.isArray(components.bodyNamed)) {
          templateComponents.push({
            type: 'body',
            parameters: Object.entries(components.bodyNamed).map(([parameter_name, value]) => ({
              type: 'text',
              parameter_name,
              text: String(value ?? '')
            }))
          });
        } else if (components.body && Array.isArray(components.body)) {
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

      const fromCredentials = resolveFromNumber(fromNumberId);
      const result = await WhatsAppService.sendTemplate(toStr, String(templateName).trim(), langCode, templateComponents || undefined, fromCredentials);
      appendWhatsAppLog(req.body, result);
      ErrorHandler.sendServiceResult(res, result);
    } catch (error) {
      appendWhatsAppLog(req.body, { error: error });
      ErrorHandler.sendErrorResponse(res, error, 'Error in sendTemplate', 500);
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

      const toStr = to != null ? String(to).trim() : '';
      if (!toStr || !storeName || !date) {
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

      // Use sendDynamic internally (call by class so "this" is correct when used as Express handler)
      req.body = { to: toStr, templateName: 'daily_kpi_snapshot', languageCode: 'en', parameters };
      appendWhatsAppLog(req.body, req.body); 
      return await WhatsAppController.sendDynamic(req, res);
    } catch (error) {
      appendWhatsAppLog(req.body, { error: error });
      ErrorHandler.sendErrorResponse(res, error, 'Error in sendDailyKpiSnapshot', 500);
    }
  }

  // POST /api/whatsapp/send-dynamic - Flexible template with dynamic parameters
  static async sendDynamic(req: Request, res: Response): Promise<void> {
    try {
      const { to, templateName, languageCode, parameters, components, fromNumberId } = req.body;

      const toStr = to != null ? String(to).trim() : '';
      if (!toStr) {
        appendWhatsAppLog(req.body, { error: 'Missing or empty required field: "to" (recipient phone number) is required' });
        ErrorHandler.sendValidationError(res, 'Missing or empty required field: "to" (recipient phone number) is required');
        return;
      }
      if (templateName == null || String(templateName).trim() === '') {
        appendWhatsAppLog(req.body, { error: 'Missing or empty required field: "templateName" is required' });
        ErrorHandler.sendValidationError(res, 'Missing or empty required field: "templateName" is required');
        return;
      }

      const langCode = (languageCode != null && String(languageCode).trim() !== '') ? String(languageCode).trim() : 'en';

      // When components is provided (body/bodyNamed/header/buttons), build WhatsApp components and send directly.
      // Supports positional (components.body array) and named (components.bodyNamed object) parameters.
      if (components && (components.body ?? components.bodyNamed ?? components.header ?? components.buttons)) {
        const templateComponents: Array<{
          type: string;
          parameters?: Array<{ type: string; text?: string; payload?: string; parameter_name?: string }>;
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
        if (components.bodyNamed && typeof components.bodyNamed === 'object' && !Array.isArray(components.bodyNamed)) {
          templateComponents.push({
            type: 'body',
            parameters: Object.entries(components.bodyNamed).map(([parameter_name, value]) => ({
              type: 'text',
              parameter_name,
              text: String(value ?? '')
            }))
          });
        } else if (components.body && Array.isArray(components.body)) {
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

        const fromCredentials = resolveFromNumber(fromNumberId);
        const result = await WhatsAppService.sendTemplate(toStr, String(templateName).trim(), langCode, templateComponents, fromCredentials);
        appendWhatsAppLog(req.body, result);
        ErrorHandler.sendServiceResult(res, result);
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
          ErrorHandler.sendValidationError(res, 'Missing required fields', validation.missing);
          return;
        }
      }

      const builtComponents = TemplateBuilder.buildWhatsAppComponents(params, config || {
        name: templateName,
        requiredFields: [],
        optionalFields: [],
        fieldOrder: Object.keys(params)
      });

      const fromCredentials = resolveFromNumber(fromNumberId);
      const result = await WhatsAppService.sendTemplate(toStr, String(templateName).trim(), langCode, builtComponents, fromCredentials);
      appendWhatsAppLog(req.body, result);
      ErrorHandler.sendServiceResult(res, result);
    } catch (error) {
      appendWhatsAppLog(req.body, { error: error });
      ErrorHandler.sendErrorResponse(res, error, 'Error in sendDynamic', 500);
    }
  }
    // POST /api/whatsapp/send-text
    static async sendText(req: Request, res: Response): Promise<void> {
    try {
      const { to, text, fromNumberId } = req.body;

      const toStr = to != null ? String(to).trim() : '';
      if (!toStr) {
        ErrorHandler.sendValidationError(res, 'Missing or empty required field: "to" (recipient phone number) is required');
        return;
      }
      if (text == null) {
        ErrorHandler.sendValidationError(res, 'Missing required field: "text" (message body) is required');
        return;
      }
      if (typeof text !== 'string') {
        ErrorHandler.sendValidationError(res, 'Field "text" must be a string.');
        return;
      }
      if (text.trim().length === 0) {
        ErrorHandler.sendValidationError(res, 'Message "text" cannot be empty or whitespace only.');
        return;
      }
      const fromCredentials = resolveFromNumber(fromNumberId);
      const result = await WhatsAppService.sendText(toStr, text, fromCredentials);
      appendWhatsAppLog(req.body, result);
      ErrorHandler.sendServiceResult(res, result);
    } catch (error) {
      appendWhatsAppLog(req.body, { error: error });
      ErrorHandler.sendErrorResponse(res, error, 'Error in sendText', 500);
    }
  }

  // From Numbers (fetched from Meta) 

  // GET /api/whatsapp/from-numbers - List all "From" numbers from Meta (WABA phone_numbers). Uses .env WHATSAPP_BUSINESS_ACCOUNT_ID and token. 
  static async listFromNumbers(_req: Request, res: Response): Promise<void> {
    try {
      const result = await WhatsAppService.getFromNumbersFromMeta();
      if (!result.ok) {
        res.status(result.error?.status ?? 500).json({ ok: false, error: result.error });
        return;
      }
      appendFromNumbersLog(_req.body, result);
      
      ErrorHandler.sendSuccess(res, {
        message: 'From numbers retrieved from Meta successfully',
        count: result.data?.length ?? 0,
        data: result.data ?? []
      });
    } catch (error) {
      appendFromNumbersLog(_req.body, { error: error });
      ErrorHandler.sendErrorResponse(res, error, 'Error in listFromNumbers', 500);
    }
  }

  // POST /api/whatsapp/from-numbers - Add a From number in Meta
  static async addFromNumberInMeta(req: Request, res: Response): Promise<void> {
    try {
      const { cc, phone_number, verified_name } = req.body;
      if (cc == null || String(cc).trim() === '') {
        ErrorHandler.sendValidationError(res, 'Missing or empty required field: "cc" (country calling code, e.g. 91 for India) is required');
        return;
      }
      if (phone_number == null || String(phone_number).trim() === '') {
        ErrorHandler.sendValidationError(res, 'Missing or empty required field: "phone_number" is required');
        return;
      }
      const result = await WhatsAppService.addFromNumberInMeta(String(cc).trim(), String(phone_number).trim(), verified_name != null ? String(verified_name).trim() : undefined);
      if (!result.ok) {
        res.status(result.error?.status ?? 500).json({ ok: false, error: result.error });
        return;
      }
      appendFromNumbersLog(req.body, result);
      ErrorHandler.sendSuccess(res, {
        message: 'From number added in Meta successfully. Use the returned "id" (phone_number_id) as fromNumberId when sending messages.',
        data: result.data
      }, 201);
    } catch (error) {
      appendFromNumbersLog(req.body, { error: error });
      ErrorHandler.sendErrorResponse(res, error, 'Error in addFromNumberInMeta', 500);
    }
  }
}

// Resolve fromNumberId (Meta phone_number_id string) to { phoneNumberId, accessToken } using env token. 
function resolveFromNumber(fromNumberId: unknown): { phoneNumberId: string; accessToken: string } | undefined {
  if (fromNumberId == null || fromNumberId === '') return undefined;
  const id = String(fromNumberId).trim();
  if (id.length === 0) return undefined;
  return WhatsAppService.getCredentialsForPhoneNumberId(id) ?? undefined;
}