import { Request, Response } from 'express';
import { TwilioTemplateService } from '../services/twilioTemplateService.js';
import { getWhatsAppTemplate, getAllWhatsAppTemplates, registerWhatsAppTemplate, WhatsAppTemplateDefinition } from '../templates/whatsappTemplates.js';
import { ErrorHandler } from '../utils/errorHandler.js';
import { appendMetaApiLog, appendCreateCustomTemplateLog} from '../utils/logApiResponse.js';

export class WhatsAppTemplateController {
  // POST /api/whatsapp/templates/create - Create template in Twilio
  static async createTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { templateName } = req.body;

      if (!templateName) {
        ErrorHandler.sendValidationError(res, 'Missing required field: "templateName" is required');
        return;
      }

      const template = getWhatsAppTemplate(templateName);
      if (!template) {
        ErrorHandler.sendNotFoundError(res, `Template "${templateName}" not found in code. Please define it first.`);
        return;
      }

      // Convert WhatsApp template format to Twilio format
      const bodyComponent = template.components.find(c => c.type === 'BODY');
      const bodyText = bodyComponent?.text || '';

      const twilioTemplate = {
        friendlyName: template.name,
        language: template.language || 'en',
        body: bodyText,
        category: template.category
      };

      const result = await TwilioTemplateService.createTemplate(twilioTemplate);
      appendCreateCustomTemplateLog(req.body, result);
      ErrorHandler.sendServiceResult(res, result);
    } catch (error) {
      appendCreateCustomTemplateLog(req.body, { error: error });
      ErrorHandler.sendErrorResponse(res, error, 'Error in createTemplate', 500);
    }
  }

  // POST /api/whatsapp/templates/create-custom - Create custom template from request body (saves in code AND creates in Twilio)
  static async createCustomTemplate(req: Request, res: Response): Promise<void> {
    try {
      // Support both old format (WhatsAppTemplateDefinition) and new format (direct Twilio format)
      if (req.body.friendlyName || req.body.body) {
        // Direct Twilio format
        const { friendlyName, body, language, category } = req.body;

        if (!friendlyName || !body) {
          ErrorHandler.sendValidationError(res, 'Missing required fields: "friendlyName" and "body" are required');
          return;
        }

        const result = await TwilioTemplateService.createTemplate({
          friendlyName,
          body,
          language: language || 'en',
          category
        });

        appendCreateCustomTemplateLog(req.body, result);
        ErrorHandler.sendServiceResult(res, result);
      } else {
        // Old WhatsApp template format (for backward compatibility)
        const templateData = req.body as WhatsAppTemplateDefinition;

        if (!templateData.name || !templateData.category || !templateData.language || !templateData.components) {
          appendCreateCustomTemplateLog(req.body, { error: 'Missing required fields: "name", "category", "language", and "components" are required' });
          ErrorHandler.sendValidationError(res, 'Missing required fields: "name", "category", "language", and "components" are required');
          return;
        }

        registerWhatsAppTemplate(templateData);
        console.log(`✅ Template "${templateData.name}" registered in code`);

        // Convert to Twilio format
        const bodyComponent = templateData.components.find(c => c.type === 'BODY');
        const bodyText = bodyComponent?.text || '';

        const twilioTemplate = {
          friendlyName: templateData.name,
          language: templateData.language || 'en',
          body: bodyText,
          category: templateData.category
        };

        const result = await TwilioTemplateService.createTemplate(twilioTemplate);

        if (result.ok) {
          appendCreateCustomTemplateLog(req.body, result);
          ErrorHandler.sendSuccess(res, {
            message: `Template "${templateData.name}" saved in code and created in Twilio successfully.`,
            data: { ...result.data, codeRegistered: true }
          });
        } else {
          const statusCode = result.error?.status || 500;
          appendCreateCustomTemplateLog(req.body, { error: result.error });
          res.status(statusCode).json({
            ok: false,
            message: `Template "${templateData.name}" saved in code but failed to create in Twilio.`,
            error: result.error,
            codeRegistered: true
          });
        }
      }
    } catch (error) {
      appendCreateCustomTemplateLog(req.body, { error: error });
      ErrorHandler.sendErrorResponse(res, error, 'Error in createCustomTemplate', 500);
    }
  }

  // GET /api/whatsapp/templates - Fetch Twilio template names and merge with code definitions when available
  static async getTemplates(_req: Request, res: Response): Promise<void> {
    try {
      const result = await TwilioTemplateService.getTemplatesFromTwilio();

      if (!result.ok) {
        ErrorHandler.sendServiceResult(res, result);
        return;
      }

      const twilioTemplates = result.data?.templates || [];
      const allCodeTemplates = getAllWhatsAppTemplates();

      // Build list from Twilio template names; add code definition fields when available
      const templates = twilioTemplates.map((tpl: any) => {
        const name = tpl.friendlyName || tpl.name;
        if (!name) return null;
        const codeTemplate = allCodeTemplates[name];
        return {
          name,
          sid: tpl.sid,
          ...(codeTemplate && {
            category: codeTemplate.category,
            language: codeTemplate.language,
            description: codeTemplate.description
          })
        };
      }).filter(Boolean);

      ErrorHandler.sendSuccess(res, {
        data: { templates, count: templates.length }
      });
    } catch (error) {
      ErrorHandler.sendErrorResponse(res, error, 'Error in getTemplates', 500);
    }
  }

  // GET /api/whatsapp/templates/:templateName - Get that template's body only
  static async getTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { templateName } = req.params;
      const template = getWhatsAppTemplate(templateName);

      if (!template) {
        ErrorHandler.sendNotFoundError(res, `Template "${templateName}"`);
        return;
      }

      const bodyComponent = template.components.find(c => c.type === 'BODY');
      
      const body = bodyComponent?.text ?? '';

      ErrorHandler.sendSuccess(res, {
        data: { templateName: template.name, body }
      });
    } catch (error) {
      ErrorHandler.sendErrorResponse(res, error, 'Error in getTemplate', 500);
    }
  }

  // POST /api/whatsapp/templates/register - Register a new template in code
  static async registerTemplate(req: Request, res: Response): Promise<void> {
    try {
      const templateData = req.body as WhatsAppTemplateDefinition;

      if (!templateData.name || !templateData.category || !templateData.language || !templateData.components) {
        ErrorHandler.sendValidationError(res, 'Missing required fields: "name", "category", "language", and "components" are required');
        return;
      }

      registerWhatsAppTemplate(templateData);

      ErrorHandler.sendSuccess(res, {
        message: `Template "${templateData.name}" registered successfully. Use /api/whatsapp/templates/create to create it in Meta.`,
        data: { template: templateData }
      });
    } catch (error) {
      ErrorHandler.sendErrorResponse(res, error, 'Error in registerTemplate', 500);
    }
  }

  // GET /api/whatsapp/templates/meta - Get all templates from Twilio (kept route name for backward compatibility)
  static async getTemplatesFromMeta(_req: Request, res: Response): Promise<void> {
    try {
      const result = await TwilioTemplateService.getTemplatesFromTwilio();
      appendMetaApiLog(_req.body, result);
      ErrorHandler.sendServiceResult(res, result);
    } catch (error) {
      appendMetaApiLog(_req.body, { error: error });
      ErrorHandler.sendErrorResponse(res, error, 'Error in getTemplatesFromTwilio', 500);
    }
  }

  // PUT /api/whatsapp/templates/create-custom-edit
  static async editTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { contentSid, friendlyName, body } = req.body;

      if (!contentSid) {
        ErrorHandler.sendValidationError(res, 'Missing required field: "contentSid" is required (Twilio template SID)');
        return;
      }

      if (!friendlyName && !body) {
        ErrorHandler.sendValidationError(res, 'At least one of "friendlyName" or "body" is required');
        return;
      }

      const result = await TwilioTemplateService.updateTemplate(contentSid, {
        friendlyName,
        body
      });

      if (result.ok) {
        ErrorHandler.sendSuccess(res, {
          message: `Template updated in Twilio successfully.`,
          data: { ...result.data }
        });
      } else {
        const statusCode = result.error?.status || 500;
        res.status(statusCode).json({
          ok: false,
          message: `Failed to update template in Twilio.`,
          error: result.error
        });
      }
    } catch (error) {
      ErrorHandler.sendErrorResponse(res, error, 'Error in editTemplate', 500);
    }
  }

  // DELETE /api/whatsapp/templates/create-custom-delete
  static async deleteTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { contentSid } = req.body;

      if (!contentSid) {
        ErrorHandler.sendValidationError(res, 'Missing required field: "contentSid" is required (Twilio template SID)');
        return;
      }

      const result = await TwilioTemplateService.deleteTemplate(contentSid);
      ErrorHandler.sendServiceResult(res, result);
    } catch (error) {
      ErrorHandler.sendErrorResponse(res, error, 'Error in deleteTemplate', 500);
    }
  }
}
