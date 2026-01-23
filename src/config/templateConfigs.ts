import { TemplateConfig } from '../services/templateBuilder.js';

export const TEMPLATE_CONFIGS: Record<string, TemplateConfig> = {
  daily_kpi_snapshot: {
    name: 'daily_kpi_snapshot',
    requiredFields: ['storeName', 'date'],
    optionalFields: ['businessOverview', 'marketingProfitability', 'operationsCash', 'keySignals', 'revenue', 'expenses', 'profit', 'newCustomers', 'returns', 'loyaltyPoints'],
    fieldOrder: ['storeName', 'date', 'businessOverview', 'marketingProfitability', 'operationsCash', 'keySignals', 'revenue', 'expenses', 'profit', 'newCustomers', 'returns', 'loyaltyPoints']
  },
  simple_message: {
    name: 'simple_message',
    requiredFields: ['message'],
    optionalFields: ['subject', 'senderName', 'footer'],
    fieldOrder: ['subject', 'message', 'senderName', 'footer']
  },
  custom: {
    name: 'custom',
    requiredFields: ['content'],
    optionalFields: ['subject', 'title', 'footer'],
    fieldOrder: ['subject', 'title', 'content', 'footer']
  }
};

export function getTemplateConfig(templateName: string): TemplateConfig | null {
  return TEMPLATE_CONFIGS[templateName] || null;
}

export function getAllTemplateConfigs(): Record<string, TemplateConfig> {
  return TEMPLATE_CONFIGS;
}
