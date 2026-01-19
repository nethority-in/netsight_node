import { Request, Response } from 'express';
import { WhatsAppService } from '../services/whatsappService.js';

export class WhatsAppController {
    
      // Send template message
      // POST /api/whatsapp/send-template
  
  static async sendTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { to, templateName, languageCode } = req.body;

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
      const langCode = languageCode || 'en_US';

      // Send template message
      const result = await WhatsAppService.sendTemplate(to, templateName, langCode);

      // Return appropriate status code based on result
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

    // Send text message
    // POST /api/whatsapp/send-text
  
  static async sendText(req: Request, res: Response): Promise<void> {
    try {
      const { to, text } = req.body;

      // Validate required fields
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
