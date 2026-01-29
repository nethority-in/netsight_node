import axios, { AxiosError } from 'axios';
import dotenv from 'dotenv';
import { WhatsAppTemplateDefinition } from '../templates/whatsappTemplates.js';
import { ErrorHandler } from '../utils/errorHandler.js';

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
        
        return ErrorHandler.toServiceError('WhatsApp access token not configured. Please check your .env file and ensure WHATSAPP_ACCESS_TOKEN or SYSTEM_USER_TOKEN is set.', 500) as WhatsAppTemplateServiceResponse;
      }

      const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
      if (!businessAccountId) {
        console.error('❌ WHATSAPP_BUSINESS_ACCOUNT_ID not found in environment');
        return ErrorHandler.toServiceError('WHATSAPP_BUSINESS_ACCOUNT_ID not configured in .env', 500) as WhatsAppTemplateServiceResponse;
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
        return ErrorHandler.toServiceError('WhatsApp access token not configured', 500) as WhatsAppTemplateServiceResponse;
      }

      const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
      if (!businessAccountId) {
        return ErrorHandler.toServiceError('WHATSAPP_BUSINESS_ACCOUNT_ID not configured in .env', 500) as WhatsAppTemplateServiceResponse;
      }

      console.log('📝 Updating WhatsApp template in Meta (Delete + Recreate):', {
        templateId,
        name: template.name,
        category: template.category
      });

      // Meta API doesn't support PUT for updating templates
      // For APPROVED templates, we need to delete and recreate
      // Step 1: Verify template exists and try to delete
      const graphVersion = process.env.META_GRAPH_VERSION || 'v21.0';
      const deleteUrl = `https://graph.facebook.com/${graphVersion}/${templateId}`;

      try {
        // First verify template exists
        const verifyUrl = `https://graph.facebook.com/${graphVersion}/${businessAccountId}/message_templates`;
        const verifyResponse = await axios.get(verifyUrl, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          params: {
            fields: 'id,name,status'
          }
        });

        const templates = verifyResponse.data?.data || [];
        const existingTemplate = templates.find((t: any) => t.id === templateId);
        
        if (existingTemplate) {
          console.log('📋 Found template to update:', {
            id: existingTemplate.id,
            name: existingTemplate.name,
            status: existingTemplate.status
          });
        }

        // Try to delete
        await axios.delete(deleteUrl, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('✅ Old template deleted successfully');
        // Wait a moment for Meta to process deletion (prevents name conflict)
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (deleteError: any) {
        const errorData = deleteError?.response?.data?.error;
        
        // If it's a BSP template or permission issue, return error
        if (errorData?.code === 100 && errorData?.error_subcode === 33) {
          return ErrorHandler.toServiceError(
            'Cannot update template. This template may be created by Business Solution Provider (BSP) and cannot be deleted/updated via API. BSP templates are managed by the provider and cannot be modified.',
            400,
            100,
            errorData
          ) as WhatsAppTemplateServiceResponse;
        }
        
        // If template doesn't exist, that's okay - we'll create new one
        if (errorData?.code === 100 || deleteError?.response?.status === 404) {
          console.warn('⚠️  Template not found or already deleted, proceeding with create:', errorData?.message || deleteError.message);
        } else {
          // Other errors - log but continue (might still be able to create)
          console.warn('⚠️  Could not delete old template, proceeding with create:', errorData || deleteError.message);
        }
      }

      // Step 2: Create new template with updated content
      const createUrl = `https://graph.facebook.com/${graphVersion}/${businessAccountId}/message_templates`;
      const templatePayload = this.buildTemplatePayload(template);

      console.log('📤 Creating updated template in Meta...');

      const response = await axios.post(createUrl, templatePayload, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Template updated successfully (deleted and recreated):', response.data);

      return {
        ok: true,
        data: {
          ...response.data,
          message: 'Template updated by deleting old template and creating new one. New template needs approval.',
          oldTemplateId: templateId,
          newTemplateId: response.data?.id || 'pending'
        } as any
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
        return ErrorHandler.toServiceError('WhatsApp access token not configured', 500) as WhatsAppTemplateServiceResponse;
      }

      const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
      if (!businessAccountId) {
        return ErrorHandler.toServiceError('WHATSAPP_BUSINESS_ACCOUNT_ID not configured in .env', 500) as WhatsAppTemplateServiceResponse;
      }

      const graphVersion = process.env.META_GRAPH_VERSION || 'v21.0';

      // Step 1: Verify template exists and get its details
      let template: any = null;
      try {
        const verifyUrl = `https://graph.facebook.com/${graphVersion}/${businessAccountId}/message_templates`;
        const verifyResponse = await axios.get(verifyUrl, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          params: {
            fields: 'id,name,status,category'
          }
        });

        const templates = verifyResponse.data?.data || [];
        template = templates.find((t: any) => t.id === templateId);
        
        if (!template) {
          return ErrorHandler.toServiceError(
            `Template with ID "${templateId}" not found. The template may have been already deleted, or the ID is incorrect. Use GET /api/whatsapp/templates/meta to see all available templates.`,
            404
          ) as WhatsAppTemplateServiceResponse;
        }

        console.log('📋 Template found:', {
          id: template.id,
          name: template.name,
          status: template.status,
          category: template.category
        });

        // Special handling for REJECTED templates
        // Meta API typically doesn't allow deleting REJECTED templates via API
        // They should be edited and resubmitted instead
        if (template.status === 'REJECTED') {
          console.warn('⚠️  Attempting to delete REJECTED template. Meta may not allow this via API.');
        }
      } catch (verifyError: any) {
        console.warn('⚠️  Could not verify template existence, proceeding with delete attempt');
      }

      // Step 2: Try to delete using business account path format
      // Try multiple endpoint formats as Meta API documentation is unclear
      const deleteUrl1 = `https://graph.facebook.com/${graphVersion}/${businessAccountId}/message_templates/${templateId}`;
      const deleteUrl2 = `https://graph.facebook.com/${graphVersion}/${templateId}`;

      console.log('🗑️ Deleting WhatsApp template from Meta:', {
        templateId,
        templateName: template?.name,
        templateStatus: template?.status,
        tryingUrl1: deleteUrl1,
        tryingUrl2: deleteUrl2
      });

      // Try business account path first (most common format)
      try {
        const response = await axios.delete(deleteUrl1, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('✅ Template deleted successfully:', response.data);

        return {
          ok: true,
          data: { 
            success: true, 
            templateId,
            templateName: template?.name,
            message: 'Template deleted successfully. Template name will be locked for 30 days.'
          } as any
        };
      } catch (deleteError1: any) {
        const errorData1 = deleteError1?.response?.data?.error;
        
        // If first format fails, try direct template ID format
        if (errorData1?.code === 100 || errorData1?.code === 2500) {
          console.log('⚠️  First delete format failed, trying alternative format...');
          
          try {
            const response = await axios.delete(deleteUrl2, {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              }
            });

            console.log('✅ Template deleted successfully (using alternative format):', response.data);

            return {
              ok: true,
              data: { 
                success: true, 
                templateId,
                templateName: template?.name,
                message: 'Template deleted successfully. Template name will be locked for 30 days.'
              } as any
            };
          } catch (deleteError2: any) {
            const errorData2 = deleteError2?.response?.data?.error;
            
            // Check if it's a BSP template or permission issue
            if (errorData2?.code === 100 && errorData2?.error_subcode === 33) {
              // Check if template is REJECTED - REJECTED templates might need special handling
              if (template?.status === 'REJECTED') {
                return ErrorHandler.toServiceError(
                  'Cannot delete REJECTED template. REJECTED templates should be edited and resubmitted rather than deleted. Use PUT /api/whatsapp/templates/create-custom-edit to edit and resubmit the template. If you need to delete it, you may need to do so manually through Meta Business Manager.',
                  400,
                  100,
                  errorData2
                ) as WhatsAppTemplateServiceResponse;
              }

              return ErrorHandler.toServiceError(
                `Cannot delete template. Possible reasons: 1) Template was created by Business Solution Provider (BSP) and cannot be deleted via API, 2) Template status "${template?.status}" may not allow deletion, 3) Insufficient permissions - ensure your access token has 'whatsapp_business_management' permission, 4) Template ID is incorrect. Use GET /api/whatsapp/templates/meta to verify template exists and status.`,
                400,
                100,
                errorData2
              ) as WhatsAppTemplateServiceResponse;
            }
            
            // Re-throw to be handled by handleError
            throw deleteError2;
          }
        }
        
        // Re-throw to be handled by handleError
        throw deleteError1;
      }
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
        return ErrorHandler.toServiceError('WhatsApp access token not configured', 500) as WhatsAppTemplateServiceResponse;
      }

      const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
      if (!businessAccountId) {
        return ErrorHandler.toServiceError('WHATSAPP_BUSINESS_ACCOUNT_ID not configured in .env', 500) as WhatsAppTemplateServiceResponse;
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
        
        // Handle "Unknown path components" error (usually means wrong endpoint format or template doesn't exist)
        if (errorData?.error?.code === 2500 || message.includes('Unknown path components')) {
          message = `Cannot delete/edit template. Possible reasons: 1) Template ID is invalid, 2) Template doesn't exist, 3) Template was created by BSP (Business Solution Provider) and cannot be deleted, 4) Insufficient permissions. Check template ID and try again.`;
        }
        
        // Handle "Unsupported delete request" error (BSP template or permission issue)
        if (errorData?.error?.code === 100 && errorData?.error?.error_subcode === 33) {
          message = `Cannot delete template. This template may be: 1) Created by Business Solution Provider (BSP) - BSP templates cannot be deleted via API, 2) Already deleted, 3) Not accessible due to missing permissions - ensure access token has 'whatsapp_business_management' permission, 4) Invalid template ID. Use GET /api/whatsapp/templates/meta to verify template exists.`;
        }

        console.error('❌ WhatsApp Template API error:', errorData);

        return ErrorHandler.toServiceError(
          message,
          status,
          errorData?.error?.code || status,
          errorData?.error
        ) as WhatsAppTemplateServiceResponse;
      }
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ WhatsApp Template Service error:', errorMessage);
    return ErrorHandler.toServiceError(errorMessage, 500) as WhatsAppTemplateServiceResponse;
  }
}
