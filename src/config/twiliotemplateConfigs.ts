// config/twiliotemplateConfigs.ts

import { TemplateConfig } from '../services/templateBuilder.js';

export const TEMPLATE_CONFIGS: Record<string, TemplateConfig> = {

  daily_kpi_snapshot: {
    name: 'daily_kpi_snapshot',
    requiredFields: ['storeName', 'date'],
    optionalFields: [
      'businessOverview',
      'marketingProfitability',
      'operationsCash',
      'keySignals',
      'revenue',
      'expenses',
      'profit',
      'newCustomers',
      'returns',
      'loyaltyPoints'
    ],
    fieldOrder: [
      'storeName',
      'date',
      'businessOverview',
      'marketingProfitability',
      'operationsCash',
      'keySignals',
      'revenue',
      'expenses',
      'profit',
      'newCustomers',
      'returns',
      'loyaltyPoints'
    ]
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

  business_performance_summary: {
    name: 'business_performance_summary',
    requiredFields: [
      'StoreName',
      'PrevDate',
      'Revenue',
      'Orders',
      'AOV',
      'RevChgPct',
      'OrdChgPct',
      'MetaSummary',
      'MetaCAC',
      'GoogleSummary',
      'GoogleCAC',
      'day',
      'PositiveChanges',
      'RequiresReviews'
    ],
    optionalFields: [],
    fieldOrder: [
      'StoreName',
      'PrevDate',
      'Revenue',
      'Orders',
      'AOV',
      'RevChgPct',
      'OrdChgPct',
      'MetaSummary',
      'MetaCAC',
      'GoogleSummary',
      'GoogleCAC',
      'day',
      'PositiveChanges',
      'RequiresReviews'
    ]
  },

  // =========================
  // CXO SUMMARY TEMPLATE
  // =========================

  ns_temp_Notification_temp1: {
    name: 'ns_temp_Notification_temp1',

    requiredFields: [
      'StoreName',
      'PrevDate',
      'GrossRevenue',
      'Orders',
      'AOV',
      'RevChgPct',
      'OrdChgPct',

      'Bestseller1',
      'Bestseller2',
      'Bestseller3',

      'MetaSummary',
      'MetaCAC',
      'GoogleSummary',
      'GoogleCAC',
      'Period',
      'PositiveChanges',
      'RequiresReviews',
      'Url',
      'ScaleUrl'
    ],

    optionalFields: [],

    // ✅ ONLY THESE VARIABLES ALLOWED
    allowedFields: [
      'StoreName',
      'PrevDate',
      'GrossRevenue',
      'Orders',
      'AOV',
      'RevChgPct',
      'OrdChgPct',

      'Bestseller1',
      'Bestseller2',
      'Bestseller3',

      'MetaSummary',
      'MetaCAC',
      'GoogleSummary',
      'GoogleCAC',
      'Period',
      'PositiveChanges',
      'RequiresReviews',
      'Url',
      'ScaleUrl'
    ],

    fieldOrder: [
      'StoreName',
      'PrevDate',
      'GrossRevenue',
      'Orders',
      'AOV',
      'RevChgPct',
      'OrdChgPct',

      'Bestseller1',
      'Bestseller2',
      'Bestseller3',

      'MetaSummary',
      'MetaCAC',
      'GoogleSummary',
      'GoogleCAC',
      'Period',
      'PositiveChanges',
      'RequiresReviews',
      'Url',
      'ScaleUrl'
    ]
  },

  // =========================
  // CEO SUMMARY TEMPLATE
  // =========================

  ns_temp_Notification_temp2: {
    name: 'ns_temp_Notification_temp2',

    requiredFields: [
      'StoreName',
      'PrevDate',

      'GrossRevenue',
      'NetSales',
      'Orders',
      'AOV',
      'LTV',
      'LTVCACRatio',

      'NewVsRepeat',
      'OrderFrequency',
      'TotalDiscountRate',
      'OrderFulfillmentRate',
      'GA4Sessions',
      'GA4Users',

      'BlendedSpend',
      'BlendedROAS',
      'BlendedRevenue',
      'Googleadsspend',
      'GoogleROAS',
      'GoogleRevenue',
      'MetaSpend',
      'MetaROAS',
      'MetaRevenue',

      'PositiveChanges',
      'RequiresReviews',
      'Url',
      'ScaleUrl'
    ],

    optionalFields: [],

    // ✅ ONLY THESE VARIABLES ALLOWED
    allowedFields: [
      'StoreName',
      'PrevDate',

      'GrossRevenue',
      'NetSales',
      'Orders',
      'AOV',
      'LTV',
      'LTVCACRatio',

      'NewVsRepeat',
      'OrderFrequency',
      'TotalDiscountRate',
      'OrderFulfillmentRate',
      'GA4Sessions',
      'GA4Users',

      'BlendedSpend',
      'BlendedROAS',
      'BlendedRevenue',
      'Googleadsspend',
      'GoogleROAS',
      'GoogleRevenue',
      'MetaSpend',
      'MetaROAS',
      'MetaRevenue',

      'PositiveChanges',
      'RequiresReviews',
      'Url',
      'ScaleUrl'
    ],

    fieldOrder: [
      'StoreName',
      'PrevDate',

      'GrossRevenue',
      'NetSales',
      'Orders',
      'AOV',
      'LTV',
      'LTVCACRatio',

      'NewVsRepeat',
      'OrderFrequency',
      'TotalDiscountRate',
      'OrderFulfillmentRate',
      'GA4Sessions',
      'GA4Users',

      'BlendedSpend',
      'BlendedROAS',
      'BlendedRevenue',
      'Googleadsspend',
      'GoogleROAS',
      'GoogleRevenue',
      'MetaSpend',
      'MetaROAS',
      'MetaRevenue',

      'PositiveChanges',
      'RequiresReviews',
      'Url',
      'ScaleUrl'
    ]
  },

  ns_temp_OTP: {
    name: 'ns_temp_OTP',
    requiredFields: ['StoreName', 'OTP'],
    optionalFields: [],
    fieldOrder: ['StoreName', 'OTP']
  },

  daily_store_performance_summary: {
    name: 'daily_store_performance_summary',
    requiredFields: [
      'recipientName',
      'storeName',
      'date'
    ],
    optionalFields: [
      'revenue',
      'orders',
      'avgOrderValue',
      'revenueChange',
      'ordersChange',
      'conversionRate',
      'revenuePerVisitor',
      'crChange',
      'rpvChange',
      'roas',
      'cac',
      'roasChange',
      'cacChange',
      'contributionMargin',
      'contributionMarginChange',
      'returns',
      'rto',
      'returnsChange',
      'rtoChange',
      'slaAdherence',
      'slaChange',
      'positiveMetric1',
      'positiveChange1',
      'positiveMetric2',
      'positiveChange2',
      'monitorMetric1',
      'monitorChange1',
      'monitorMetric2',
      'monitorChange2'
    ],
    fieldOrder: [
      'recipientName',
      'storeName',
      'date',
      'revenue',
      'orders',
      'avgOrderValue',
      'revenueChange',
      'ordersChange',
      'conversionRate',
      'revenuePerVisitor',
      'crChange',
      'rpvChange',
      'roas',
      'cac',
      'roasChange',
      'cacChange',
      'contributionMargin',
      'contributionMarginChange',
      'returns',
      'rto',
      'returnsChange',
      'rtoChange',
      'slaAdherence',
      'slaChange',
      'positiveMetric1',
      'positiveChange1',
      'positiveMetric2',
      'positiveChange2',
      'monitorMetric1',
      'monitorChange1',
      'monitorMetric2',
      'monitorChange2'
    ]
  }
};

export function getTemplateConfig(templateName: string): TemplateConfig | null {
  return TEMPLATE_CONFIGS[templateName] || null;
}

export function getAllTemplateConfigs(): Record<string, TemplateConfig> {
  return TEMPLATE_CONFIGS;
}
