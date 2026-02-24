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
  },
  // Business performance summary – daily report (image-style email)
  business_performance_summary: {
    name: 'business_performance_summary',
    requiredFields: ['reportDate', 'revenue', 'orders', 'aov', 'revenueChange', 'ordersChange', 'metaRevenue', 'metaRoas', 'metaRevenueChange', 'metaRoasChange', 'metaCac', 'googleRevenue', 'googleRoas', 'googleRevenueChange', 'googleRoasChange', 'googleCac', 'positiveChange1', 'positiveChange2', 'reviewChange1', 'reviewChange2'],
    optionalFields: [],
    fieldOrder: ['reportDate', 'revenue', 'orders', 'aov', 'revenueChange', 'ordersChange', 'metaRevenue', 'metaRoas', 'metaRevenueChange', 'metaRoasChange', 'metaCac', 'googleRevenue', 'googleRoas', 'googleRevenueChange', 'googleRoasChange', 'googleCac', 'positiveChange1', 'positiveChange2', 'reviewChange1', 'reviewChange2']
  },

  // Matches WhatsApp daily_store_performance_summary – 32 body params in order
  daily_store_performance_summary: {
    name: 'daily_store_performance_summary',
    requiredFields: ['recipientName', 'storeName', 'date'],
    optionalFields: [
      'revenue', 'orders', 'avgOrderValue', 'revenueChange', 'ordersChange', 'conversionRate',
      'revenuePerVisitor', 'crChange', 'rpvChange', 'roas', 'cac', 'roasChange', 'cacChange',
      'contributionMargin', 'contributionMarginChange', 'returns', 'rto', 'returnsChange', 'rtoChange',
      'slaAdherence', 'slaChange', 'positiveMetric1', 'positiveChange1', 'positiveMetric2', 'positiveChange2',
      'monitorMetric1', 'monitorChange1', 'monitorMetric2', 'monitorChange2'
    ],
    fieldOrder: [
      'recipientName', 'storeName', 'date', 'revenue', 'orders', 'avgOrderValue', 'revenueChange', 'ordersChange',
      'conversionRate', 'revenuePerVisitor', 'crChange', 'rpvChange', 'roas', 'cac', 'roasChange', 'cacChange',
      'contributionMargin', 'contributionMarginChange', 'returns', 'rto', 'returnsChange', 'rtoChange',
      'slaAdherence', 'slaChange', 'positiveMetric1', 'positiveChange1', 'positiveMetric2', 'positiveChange2',
      'monitorMetric1', 'monitorChange1', 'monitorMetric2', 'monitorChange2'
    ]
  }
};

export function getTemplateConfig(templateName: string): TemplateConfig | null {
  return TEMPLATE_CONFIGS[templateName] || null;
}

export function getAllTemplateConfigs(): Record<string, TemplateConfig> {
  return TEMPLATE_CONFIGS;
}
