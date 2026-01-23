import axios, { AxiosError } from 'axios';
import dotenv from 'dotenv';
import { WhatsAppTemplateDefinition } from '../templates/whatsappTemplates.js';

// Ensure dotenv is loaded
dotenv.config();

export interface CreateTemplateResponse {
  id: string;
  status: string;
  category: string;
}

export interface WhatsAppTemplateServiceResponse {
  ok: boolean;
  data?: CreateTemplateResponse;
  error?: {
    message: string;
    status: number;
    code: number;
    details?: unknown;
  };
}

export class WhatsAppTemplateService {

    //Build template payload for Meta API (shared by create, update, and getTemplatePayload)
 
  private static buildTemplatePayload(template: WhatsAppTemplateDefinition): any {
    return {
      name: template.name,
      category: template.category,
      language: template.language,
      components: template.components.map(comp => {
        const component: any = { type: comp.type };
        
        if (comp.type === 'HEADER' && comp.format) {
          component.format = comp.format;
          if (comp.text) component.text = comp.text;
          if (comp.example?.header_text) {
            component.example = { header_text: comp.example.header_text };
          }
        }
        
        if (comp.type === 'BODY') {
          if (comp.text) component.text = comp.text;
          if (comp.example?.body_text) {
            component.example = { body_text: comp.example.body_text };
          }
        }
        
        if (comp.type === 'FOOTER' && comp.text) {
          component.text = comp.text;
        }
        
        if (comp.type === 'BUTTONS' && comp.buttons) {
          component.buttons = comp.buttons.map(btn => {
            const button: any = {
              type: btn.type,
              text: btn.text
            };
            if (btn.type === 'URL' && btn.url) {
              button.url = btn.url;
            }
            if (btn.type === 'PHONE_NUMBER' && btn.phone_number) {
              button.phone_number = btn.phone_number;
            }
            return button;
          });
        }
        
        return component;
      })
    };
  }

  private static getAccessToken(): string | null {
    // Reload env to ensure fresh values
    dotenv.config();
    
    const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
    const SYSTEM_USER_TOKEN = process.env.SYSTEM_USER_TOKEN;
    const NODE_ENV = process.env.NODE_ENV || 'development';
    const IS_PRODUCTION = NODE_ENV === 'production';

    // Debug: Log what we're getting from env
    console.log('🔍 Checking tokens:', {
      hasAccessToken: !!WHATSAPP_ACCESS_TOKEN,
      hasSystemToken: !!SYSTEM_USER_TOKEN,
      accessTokenLength: WHATSAPP_ACCESS_TOKEN?.length || 0,
      systemTokenLength: SYSTEM_USER_TOKEN?.length || 0,
      isProduction: IS_PRODUCTION,
      nodeEnv: NODE_ENV
    });

    if (IS_PRODUCTION) {
      if (SYSTEM_USER_TOKEN) {
        console.log('✅ Using SYSTEM_USER_TOKEN for production');
        return SYSTEM_USER_TOKEN;
      }
      if (WHATSAPP_ACCESS_TOKEN) {
        console.log('✅ Using WHATSAPP_ACCESS_TOKEN for production (fallback)');
        return WHATSAPP_ACCESS_TOKEN;
      }
    } else {
      if (WHATSAPP_ACCESS_TOKEN) {
        console.log('✅ Using WHATSAPP_ACCESS_TOKEN for development');
        return WHATSAPP_ACCESS_TOKEN;
      }
      if (SYSTEM_USER_TOKEN) {
        console.log('✅ Using SYSTEM_USER_TOKEN for development (fallback)');
        return SYSTEM_USER_TOKEN;
      }
    }
    
    console.error('❌ No access token found!');
    return null;
  }

    //Create WhatsApp template in Meta Business Manager
    //This will submit the template for approval
  static async createTemplate(template: WhatsAppTemplateDefinition): Promise<WhatsAppTemplateServiceResponse> {
    try {
      // Reload env to ensure fresh values
      dotenv.config();
      
      const accessToken = this.getAccessToken();
      if (!accessToken) {
        console.error('❌ Token check failed. Environment variables:', {
          WHATSAPP_ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN ? 'SET' : 'NOT SET',
          SYSTEM_USER_TOKEN: process.env.SYSTEM_USER_TOKEN ? 'SET' : 'NOT SET',
          WHATSAPP_BUSINESS_ACCOUNT_ID: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID ? 'SET' : 'NOT SET'
        });
        
        return {
          ok: false,
          error: {
            message: 'WhatsApp access token not configured. Please check your .env file and ensure WHATSAPP_ACCESS_TOKEN or SYSTEM_USER_TOKEN is set.',
            status: 500,
            code: 500
          }
        };
      }

      const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
      if (!businessAccountId) {
        console.error('❌ WHATSAPP_BUSINESS_ACCOUNT_ID not found in environment');
        return {
          ok: false,
          error: {
            message: 'WHATSAPP_BUSINESS_ACCOUNT_ID not configured in .env',
            status: 500,
            code: 500
          }
        };
      }

      // Prepare template payload for Meta API
      const templatePayload: any = {
        name: template.name,
        category: template.category,
        language: template.language,
        components: template.components.map(comp => {
          const component: any = { type: comp.type };
          
          if (comp.type === 'HEADER' && comp.format) {
            component.format = comp.format;
            if (comp.text) component.text = comp.text;
            if (comp.example?.header_text) {
              component.example = { header_text: comp.example.header_text };
            }
          }
          
          if (comp.type === 'BODY') {
            if (comp.text) component.text = comp.text;
            if (comp.example?.body_text) {
              component.example = { body_text: comp.example.body_text };
            }
          }
          
          if (comp.type === 'FOOTER' && comp.text) {
            component.text = comp.text;
          }
          
          if (comp.type === 'BUTTONS' && comp.buttons) {
            component.buttons = comp.buttons.map(btn => {
              const button: any = {
                type: btn.type,
                text: btn.text
              };
              if (btn.type === 'URL' && btn.url) {
                button.url = btn.url;
              }
              if (btn.type === 'PHONE_NUMBER' && btn.phone_number) {
                button.phone_number = btn.phone_number;
              }
              return button;
            });
          }
          
          return component;
        })
      };

      const graphVersion = process.env.META_GRAPH_VERSION || 'v21.0';
      const url = `https://graph.facebook.com/${graphVersion}/${businessAccountId}/message_templates`;

      console.log('📤 Creating WhatsApp template in Meta:', {
        name: template.name,
        category: template.category,
        language: template.language
      });

      const response = await axios.post(url, templatePayload, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Template created successfully:', response.data);

      return {
        ok: true,
        data: response.data
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

    //Get template creation payload (for manual submission or preview)
  
  static getTemplatePayload(template: WhatsAppTemplateDefinition): any {
    return this.buildTemplatePayload(template);
  }


    // Update/Edit existing template in Meta Business Manager

  static async updateTemplate(templateId: string, template: WhatsAppTemplateDefinition): Promise<WhatsAppTemplateServiceResponse> {
    try {
      dotenv.config();
      
      const accessToken = this.getAccessToken();
      if (!accessToken) {
        return {
          ok: false,
          error: {
            message: 'WhatsApp access token not configured',
            status: 500,
            code: 500
          }
        };
      }

      const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
      if (!businessAccountId) {
        return {
          ok: false,
          error: {
            message: 'WHATSAPP_BUSINESS_ACCOUNT_ID not configured in .env',
            status: 500,
            code: 500
          }
        };
      }

      // Build template payload using shared method
      const templatePayload = this.buildTemplatePayload(template);

      const graphVersion = process.env.META_GRAPH_VERSION || 'v21.0';
      const url = `https://graph.facebook.com/${graphVersion}/${businessAccountId}/message_templates`;

      console.log('📝 Updating WhatsApp template in Meta:', {
        templateId,
        name: template.name,
        category: template.category
      });

      const response = await axios.put(`${url}/${templateId}`, templatePayload, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Template updated successfully:', response.data);

      return {
        ok: true,
        data: response.data as any
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

    // Delete template from Meta Business Manager
  static async deleteTemplate(templateId: string): Promise<WhatsAppTemplateServiceResponse> {
    try {
      dotenv.config();
      
      const accessToken = this.getAccessToken();
      if (!accessToken) {
        return {
          ok: false,
          error: {
            message: 'WhatsApp access token not configured',
            status: 500,
            code: 500
          }
        };
      }

      const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
      if (!businessAccountId) {
        return {
          ok: false,
          error: {
            message: 'WHATSAPP_BUSINESS_ACCOUNT_ID not configured in .env',
            status: 500,
            code: 500
          }
        };
      }

      const graphVersion = process.env.META_GRAPH_VERSION || 'v21.0';
      const url = `https://graph.facebook.com/${graphVersion}/${businessAccountId}/message_templates/${templateId}`;

      console.log('🗑️ Deleting WhatsApp template from Meta:', {
        templateId
      });

      const response = await axios.delete(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Template deleted successfully:', response.data);

      return {
        ok: true,
        data: { success: true, templateId } as any
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

    // Get all templates from Meta Business Manager
  static async getTemplatesFromMeta(): Promise<WhatsAppTemplateServiceResponse> {
    try {
      dotenv.config();
      
      const accessToken = this.getAccessToken();
      if (!accessToken) {
        return {
          ok: false,
          error: {
            message: 'WhatsApp access token not configured',
            status: 500,
            code: 500
          }
        };
      }

      const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
      if (!businessAccountId) {
        return {
          ok: false,
          error: {
            message: 'WHATSAPP_BUSINESS_ACCOUNT_ID not configured in .env',
            status: 500,
            code: 500
          }
        };
      }

      const graphVersion = process.env.META_GRAPH_VERSION || 'v21.0';
      const url = `https://graph.facebook.com/${graphVersion}/${businessAccountId}/message_templates`;

      console.log('📤 Fetching templates from Meta...');

      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        params: {
          fields: 'name,status,category,language,components'
        }
      });

      console.log('✅ Templates fetched successfully');

      return {
        ok: true,
        data: response.data as any
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  private static handleError(error: unknown): WhatsAppTemplateServiceResponse {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<any>;
      
      if (axiosError.response) {
        const status = axiosError.response.status;
        const errorData = axiosError.response.data;
        let message = errorData?.error?.message || 'Unknown error from Meta API';

        // Provide helpful error messages
        if (errorData?.error?.error_subcode === 2388024) {
          message = `Template already exists! The template "${errorData?.error?.error_user_title || 'this template'}" already exists in Meta Business Manager. You can either: 1) Use a different template name, 2) Delete the existing template from Meta Business Manager, or 3) Use the existing template to send messages. Use GET /api/whatsapp/templates/meta to see all existing templates.`;
        }

        console.error('❌ WhatsApp Template API error:', errorData);

        return {
          ok: false,
          error: {
            message,
            status,
            code: errorData?.error?.code || status,
            details: errorData?.error
          }
        };
      }
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ WhatsApp Template Service error:', errorMessage);
    return {
      ok: false,
      error: {
        message: errorMessage,
        status: 500,
        code: 500
      }
    };
  }
}
