import { Request, Response } from 'express';
import { WhatsAppTemplateService } from '../services/whatsappTemplateService.js';
import { getWhatsAppTemplate, getAllWhatsAppTemplates, registerWhatsAppTemplate, WhatsAppTemplateDefinition } from '../templates/whatsappTemplates.js';
import { ErrorHandler } from '../utils/errorHandler.js';

export class WhatsAppTemplateController {
  // POST /api/whatsapp/templates/create - Create template in Meta Business Manager
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

      const result = await WhatsAppTemplateService.createTemplate(template);
      ErrorHandler.sendServiceResult(res, result);
    } catch (error) {
      ErrorHandler.sendErrorResponse(res, error, 'Error in createTemplate', 500);
    }
  }

  // POST /api/whatsapp/templates/create-custom - Create custom template from request body (saves in code AND creates in Meta)
  static async createCustomTemplate(req: Request, res: Response): Promise<void> {
    try {
      const templateData = req.body as WhatsAppTemplateDefinition;

      if (!templateData.name || !templateData.category || !templateData.language || !templateData.components) {
        ErrorHandler.sendValidationError(res, 'Missing required fields: "name", "category", "language", and "components" are required');
        return;
      }

      registerWhatsAppTemplate(templateData);
      console.log(`✅ Template "${templateData.name}" registered in code`);

      const result = await WhatsAppTemplateService.createTemplate(templateData);

      if (result.ok) {
        ErrorHandler.sendSuccess(res, {
          message: `Template "${templateData.name}" saved in code and created in Meta successfully. Waiting for approval.`,
          data: { ...result.data, codeRegistered: true }
        });
      } else {
        const statusCode = result.error?.status || 500;
        res.status(statusCode).json({
          ok: false,
          message: `Template "${templateData.name}" saved in code but failed to create in Meta.`,
          error: result.error,
          codeRegistered: true
        });
      }
    } catch (error) {
      ErrorHandler.sendErrorResponse(res, error, 'Error in createCustomTemplate', 500);
    }
  }

  // GET /api/whatsapp/templates - Get all templates defined in code
  static async getTemplates(_req: Request, res: Response): Promise<void> {
    try {
      const templates = getAllWhatsAppTemplates();
      const templateList = Object.keys(templates).map(name => ({
        name: templates[name].name,
        category: templates[name].category,
        language: templates[name].language,
        description: templates[name].description
      }));

      ErrorHandler.sendSuccess(res, {
        data: { templates: templateList, count: templateList.length }
      });
    } catch (error) {
      ErrorHandler.sendErrorResponse(res, error, 'Error in getTemplates', 500);
    }
  }

  // GET /api/whatsapp/templates/:templateName - Get specific template definition
  static async getTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { templateName } = req.params;
      const template = getWhatsAppTemplate(templateName);

      if (!template) {
        ErrorHandler.sendNotFoundError(res, `Template "${templateName}"`);
        return;
      }

      const payload = WhatsAppTemplateService.getTemplatePayload(template);

      ErrorHandler.sendSuccess(res, {
        data: { template, metaPayload: payload }
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

  // GET /api/whatsapp/templates/meta - Get all templates from Meta Business Manager
  static async getTemplatesFromMeta(_req: Request, res: Response): Promise<void> {
    try {
      const result = await WhatsAppTemplateService.getTemplatesFromMeta();
      ErrorHandler.sendServiceResult(res, result);
    } catch (error) {
      ErrorHandler.sendErrorResponse(res, error, 'Error in getTemplatesFromMeta', 500);
    }
  }

  // PUT /api/whatsapp/templates/create-custom-edit
  static async editTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { templateId, template } = req.body;

      if (!templateId) {
        ErrorHandler.sendValidationError(res, 'Missing required field: "templateId" is required');
        return;
      }

      if (!template || !template.name || !template.category || !template.language || !template.components) {
        ErrorHandler.sendValidationError(res, 'Missing required fields: "template" object with "name", "category", "language", and "components" is required');
        return;
      }

      registerWhatsAppTemplate(template);
      console.log(`✅ Template "${template.name}" updated in code`);

      const result = await WhatsAppTemplateService.updateTemplate(templateId, template);

      if (result.ok) {
        ErrorHandler.sendSuccess(res, {
          message: `Template "${template.name}" updated in code and Meta successfully.`,
          data: { ...result.data, codeUpdated: true }
        });
      } else {
        const statusCode = result.error?.status || 500;
        res.status(statusCode).json({
          ok: false,
          message: `Template "${template.name}" updated in code but failed to update in Meta.`,
          error: result.error,
          codeUpdated: true
        });
      }
    } catch (error) {
      ErrorHandler.sendErrorResponse(res, error, 'Error in editTemplate', 500);
    }
  }

  // DELETE /api/whatsapp/templates/create-custom-delete
  static async deleteTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { templateId } = req.body;

      if (!templateId) {
        ErrorHandler.sendValidationError(res, 'Missing required field: "templateId" is required');
        return;
      }

      const result = await WhatsAppTemplateService.deleteTemplate(templateId);
      ErrorHandler.sendServiceResult(res, result);
    } catch (error) {
      ErrorHandler.sendErrorResponse(res, error, 'Error in deleteTemplate', 500);
    }
  }
}
