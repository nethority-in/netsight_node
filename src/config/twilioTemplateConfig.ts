
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
  'netsightsdailyreportsv2':'HX27ed4797a3fa27a27dc7b6fdae359149',
  // copy_netsightsdailyreportsv2: body params (Twilio: no spaces in names) → Store_Name, Previous_Date, Revenue, Orders, AOV, Revenue_Percent_Change, Orders_Percent_Change, Fb_ROAS, GoogleAds_ROAS
  'copy_netsightsdailyreportsv2':'HXfc65d48b6c59b6a83934b1620cbe45aa',
  'new_order_1': 'HX58c582e386bba2b32d315ac1c944d983',
  'new_order_2': 'HXd95c79e63775b1e352e4faca22238a77',
  'copy_new_order_2':'HXe983efd49b2124c574b391d9595838d0'
  // Additional mappings can be added here
};

export function getTwilioTemplateId(templateName: string): string | null {
  return TWILIO_TEMPLATE_MAPPINGS[templateName] || null;
}

export function getAllTwilioTemplateMappings(): Record<string, string> {
  return { ...TWILIO_TEMPLATE_MAPPINGS };
}


