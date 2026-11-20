// Paste the approved Twilio Content SID here (starts with HX, 34 chars total).
// Until it is a valid SID, alerts fall back to plain free-text.
const ALERT_CONTENT_SID = "HX0f04e4c6c1ab288aa482cb268fc71dbb";

const isValidSid = (s: string): boolean => /^HX[0-9a-fA-F]{32}$/.test(s);

const clean = (v: unknown, max: number): string => {
  const s = String(v ?? "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/ {2,}/g, " ")
    .trim();
  return (s === "" ? "N/A" : s).substring(0, max);
};

export interface SystemAlertInput {
  title: string;
  source: string;
  reference: string;
  details: string;
}

export async function sendSystemAlert(input: SystemAlertInput): Promise<void> {
  if (process.env.DRY_RUN_MODE === "true") {
    console.log(
      `[System Alert - DRY RUN] ${input.title} | ${input.source} | ${input.reference} | ${input.details}`,
    );
    return;
  }

  try {
    const to =
      process.env.SYSTEM_ALERT_WHATSAPP ||
      process.env.DLQ_ALERT_WHATSAPP ||
      "+918698673161";
    const from = process.env.TWILIO_WHATSAPP_FROM || "+19785889593";

    const vars = {
      alert_title: clean(input.title, 80),
      alert_source: clean(input.source, 80),
      alert_reference: clean(input.reference, 80),
      alert_details: clean(input.details, 350),
    };

    const twilio = await import("twilio");
    const client = twilio.default(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN,
    );

    if (isValidSid(ALERT_CONTENT_SID)) {
      // Template message: delivered even outside the 24-hour window
      await client.messages.create({
        from: `whatsapp:${from}`,
        to: `whatsapp:${to}`,
        contentSid: ALERT_CONTENT_SID,
        contentVariables: JSON.stringify(vars),
      });
    } else {
      // Fallback (old behaviour): free text, only delivered inside 24h window
      await client.messages.create({
        from: `whatsapp:${from}`,
        to: `whatsapp:${to}`,
        body:
          `[Netsight Alert] ${vars.alert_title} | ${vars.alert_source} | ` +
          `${vars.alert_reference} | ${vars.alert_details}`,
      });
    }
  } catch (alertError) {
    // An alert failure must never crash the caller
    console.error("[System Alert] Failed to send alert:", alertError);
  }
}