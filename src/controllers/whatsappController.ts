import { Request, Response } from 'express';
import { WhatsAppService } from '../services/whatsappService.js';

export class WhatsAppController {
      // POST /api/whatsapp/send-template
  static async sendTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { to, templateName, languageCode, parameters } = req.body;
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
      // Convert parameters array to the format expected by WhatsApp API
      let templateParameters: Array<{ type: string; text?: string }> | undefined;
      if (parameters && Array.isArray(parameters)) {
        templateParameters = parameters.map((param: string) => ({
          type: 'text',
          text: param
        }));
      }
      // Send template message
      const result = await WhatsAppService.sendTemplate(to, templateName, langCode, templateParameters);
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
  // Send daily KPI snapshot template
  static async sendDailyKpiSnapshot(req: Request, res: Response): Promise<void> {
    try {
      const {   
        to, 
        storeName, 
        date, 
        businessOverview, 
        marketingProfitability, 
        operationsCash, 
        keySignals 
      } = req.body;

      // Validate required fields
      if (!to || !storeName || !date || !businessOverview || !marketingProfitability || !operationsCash || !keySignals) {
        res.status(400).json({
          ok: false,
          error: {
            message: 'Missing required fields: "to", "storeName", "date", "businessOverview", "marketingProfitability", "operationsCash", and "keySignals" are required',
            status: 400,
            code: 400
          }
        });
        return;
      }
      // Send daily KPI snapshot template
      const result = await WhatsAppService.sendDailyKpiSnapshot(
        to,
        storeName,
        date,
        businessOverview,
        marketingProfitability,
        operationsCash,
        keySignals
      );

      // Return appropriate status code based on result
      const statusCode = result.ok ? 200 : (result.error?.status || 500);
      res.status(statusCode).json(result);
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
