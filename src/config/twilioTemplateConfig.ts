
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
  'delivered': 'HX14df1fb125270b547f85a598947f0f25',
  'fulfilled': 'HX13ca3ad806735481e0b6deae183ff4da',
  'new_order': 'HX6eec80a39c157cbce668ae712dcc3276',
  // Daily report (Store Name, Previous Date, Revenue, Orders, AOV, % changes, ROAS, CAC, CM, Metrics)
  'copy_netsightsdailyreports_13feb': 'HXd3e6b94d9b76a3ec28be26827b64319f',
  'netsightsdailyreportsv2':'HX27ed4797a3fa27a27dc7b6fdae359149'

  // Additional mappings can be added here
};

export function getTwilioTemplateId(templateName: string): string | null {
  return TWILIO_TEMPLATE_MAPPINGS[templateName] || null;
}

export function getAllTwilioTemplateMappings(): Record<string, string> {
  return { ...TWILIO_TEMPLATE_MAPPINGS };
}
