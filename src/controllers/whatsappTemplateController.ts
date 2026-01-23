import { Request, Response } from 'express';
import { WhatsAppTemplateService } from '../services/whatsappTemplateService.js';
import { getWhatsAppTemplate, getAllWhatsAppTemplates, registerWhatsAppTemplate, WhatsAppTemplateDefinition } from '../templates/whatsappTemplates.js';

export class WhatsAppTemplateController {
  // POST /api/whatsapp/templates/create - Create template in Meta Business Manager
  static async createTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { templateName } = req.body;

      if (!templateName) {
        res.status(400).json({
          ok: false,
          error: {
            message: 'Missing required field: "templateName" is required',
            status: 400,
            code: 400
          }
        });
        return;
      }

      const template = getWhatsAppTemplate(templateName);
      if (!template) {
        res.status(404).json({
          ok: false,
          error: {
            message: `Template "${templateName}" not found in code. Please define it first.`,
            status: 404,
            code: 404
          }
        });
        return;
      }

      const result = await WhatsAppTemplateService.createTemplate(template);
      const statusCode = result.ok ? 200 : (result.error?.status || 500);
      res.status(statusCode).json(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error in createTemplate controller:', error);
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

  // POST /api/whatsapp/templates/create-custom - Create custom template from request body (saves in code AND creates in Meta)
  static async createCustomTemplate(req: Request, res: Response): Promise<void> {
    try {
      const templateData = req.body as WhatsAppTemplateDefinition;

      if (!templateData.name || !templateData.category || !templateData.language || !templateData.components) {
        res.status(400).json({
          ok: false,
          error: {
            message: 'Missing required fields: "name", "category", "language", and "components" are required',
            status: 400,
            code: 400
          }
        });
        return;
      }

      // Step 1: Save template in code
      registerWhatsAppTemplate(templateData);
      console.log(`✅ Template "${templateData.name}" registered in code`);

      // Step 2: Create template in Meta
      const result = await WhatsAppTemplateService.createTemplate(templateData);
      
      if (result.ok) {
        res.status(200).json({
          ok: true,
          message: `Template "${templateData.name}" saved in code and created in Meta successfully. Waiting for approval.`,
          data: {
            ...result.data,
            codeRegistered: true
          }
        });
      } else {
        // Even if Meta creation fails, template is saved in code
        const statusCode = result.error?.status || 500;
        res.status(statusCode).json({
          ok: false,
          message: `Template "${templateData.name}" saved in code but failed to create in Meta.`,
          error: result.error,
          codeRegistered: true
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error in createCustomTemplate controller:', error);
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

      res.status(200).json({
        ok: true,
        data: {
          templates: templateList,
          count: templateList.length
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

  // GET /api/whatsapp/templates/:templateName - Get specific template definition
  static async getTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { templateName } = req.params;
      const template = getWhatsAppTemplate(templateName);

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

      // Get the payload that will be sent to Meta
      const payload = WhatsAppTemplateService.getTemplatePayload(template);

      res.status(200).json({
        ok: true,
        data: {
          template,
          metaPayload: payload
        }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error in getTemplate controller:', error);
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

  // POST /api/whatsapp/templates/register - Register a new template in code
  static async registerTemplate(req: Request, res: Response): Promise<void> {
    try {
      const templateData = req.body as WhatsAppTemplateDefinition;

      if (!templateData.name || !templateData.category || !templateData.language || !templateData.components) {
        res.status(400).json({
          ok: false,
          error: {
            message: 'Missing required fields: "name", "category", "language", and "components" are required',
            status: 400,
            code: 400
          }
        });
        return;
      }

      registerWhatsAppTemplate(templateData);

      res.status(200).json({
        ok: true,
        message: `Template "${templateData.name}" registered successfully. Use /api/whatsapp/templates/create to create it in Meta.`,
        data: {
          template: templateData
        }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error in registerTemplate controller:', error);
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

  // GET /api/whatsapp/templates/meta - Get all templates from Meta Business Manager
  static async getTemplatesFromMeta(_req: Request, res: Response): Promise<void> {
    try {
      const result = await WhatsAppTemplateService.getTemplatesFromMeta();
      const statusCode = result.ok ? 200 : (result.error?.status || 500);
      res.status(statusCode).json(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error in getTemplatesFromMeta controller:', error);
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

  // PUT /api/whatsapp/templates/create-custom-edit
  static async editTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { templateId, template } = req.body;

      if (!templateId) {
        res.status(400).json({
          ok: false,
          error: {
            message: 'Missing required field: "templateId" is required',
            status: 400,
            code: 400
          }
        });
        return;
      }

      if (!template || !template.name || !template.category || !template.language || !template.components) {
        res.status(400).json({
          ok: false,
          error: {
            message: 'Missing required fields: "template" object with "name", "category", "language", and "components" is required',
            status: 400,
            code: 400
          }
        });
        return;
      }

      // Step 1: Update template in code
      registerWhatsAppTemplate(template);
      console.log(`✅ Template "${template.name}" updated in code`);

      // Step 2: Update template in Meta
      const result = await WhatsAppTemplateService.updateTemplate(templateId, template);
      
      if (result.ok) {
        res.status(200).json({
          ok: true,
          message: `Template "${template.name}" updated in code and Meta successfully.`,
          data: {
            ...result.data,
            codeUpdated: true
          }
        });
      } else {
        // Even if Meta update fails, template is updated in code
        const statusCode = result.error?.status || 500;
        res.status(statusCode).json({
          ok: false,
          message: `Template "${template.name}" updated in code but failed to update in Meta.`,
          error: result.error,
          codeUpdated: true
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error in editTemplate controller:', error);
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

  // DELETE /api/whatsapp/templates/create-custom-delete
  static async deleteTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { templateId } = req.body;

      if (!templateId) {
        res.status(400).json({
          ok: false,
          error: {
            message: 'Missing required field: "templateId" is required',
            status: 400,
            code: 400
          }
        });
        return;
      }

      const result = await WhatsAppTemplateService.deleteTemplate(templateId);
      const statusCode = result.ok ? 200 : (result.error?.status || 500);
      res.status(statusCode).json(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error in deleteTemplate controller:', error);
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
