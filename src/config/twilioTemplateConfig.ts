
//   Twilio WhatsApp Template Configuration
//   Maps template names to Twilio template IDs


export interface TwilioTemplateMapping {
  templateName: string;
  templateId: string;
}

export const TWILIO_TEMPLATE_MAPPINGS: Record<string, string> = {
  // Daily reports template
  'netsightsdailyreports1': 'HX76ba66f51b489342b00955c8da29806b',
  'daily_kpi_snapshot': 'HX76ba66f51b489342b00955c8da29806b', // Alias for backward compatibility
  
  // Order templates
  'delivered_order': 'HX9ed6b259230cd86ec5e3a94cbb5c87c8',
  'customer_fulfilled_order': 'HX4d49a6f7c5e40d41b4a6944443a8ae45',
  'customer_new_order': 'HXdc9acb41c43e90c061fc7ef2d5823f36',
  
  // Additional mappings can be added here
};

export function getTwilioTemplateId(templateName: string): string | null {
  return TWILIO_TEMPLATE_MAPPINGS[templateName] || null;
}

export function getAllTwilioTemplateMappings(): Record<string, string> {
  return { ...TWILIO_TEMPLATE_MAPPINGS };
}
