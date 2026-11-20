// Paste the approved Twilio Content SID here (starts with HX, 34 chars total).
// Until it is a valid SID, alerts fall back to plain free-text.
const ALERT_CONTENT_SID = "HX0f04e4c6c1ab288aa482cb268fc71dbb";

// Alert emails — always notified on DLQ failures regardless of dry-run.
const ALERT_EMAILS = (process.env.DLQ_ALERT_EMAILS || "sarangc.nethority@gmail.com,tejasg@nethority.com")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

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
  source: string;        // job type
  reference: string;     // job id
  details: string;       // formatted one-liner (for WhatsApp)
  // Extended fields for the detailed email (all optional — alert still sends without them)
  raw?: {
    jobId?: string;
    jobType?: string;
    attempts?: number;
    to?: string | string[];          // full WhatsApp number(s) — NOT masked in email
    templateName?: string;
    errorCode?: string | number;
    errorHttpStatus?: string | number;
    errorMessage?: string;
    errorHint?: string;
    createdAt?: string;
    endpoint?: string;
  };
}

// --- Email alert helper ---
async function sendAlertEmail(input: SystemAlertInput): Promise<void> {
  if (!ALERT_EMAILS.length) return;

  const r = input.raw ?? {};
  const now = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

  // Build recipient display (full, unmasked)
  const toDisplay = r.to
    ? Array.isArray(r.to)
      ? r.to.join(", ")
      : String(r.to)
    : "N/A";

  const rows = [
    ["Job ID",       r.jobId       ?? input.reference],
    ["Job Type",     r.jobType     ?? input.source],
    ["Endpoint",     r.endpoint    ?? "N/A"],
    ["WhatsApp To",  toDisplay],
    ["Template",     r.templateName ?? "N/A"],
    ["Attempts",     String(r.attempts ?? "N/A")],
    ["Error Code",   r.errorCode !== undefined ? String(r.errorCode) : "N/A"],
    ["HTTP Status",  r.errorHttpStatus !== undefined ? String(r.errorHttpStatus) : "N/A"],
    ["Error",        r.errorMessage ?? "N/A"],
    ["Hint",         r.errorHint   ?? "N/A"],
    ["Last try failed At",    r.createdAt   ? new Date(r.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : now],
    ["Alert Sent At", now],
  ];

  const tableRows = rows
    .map(([label, val]) =>
      `<tr>
        <td style="padding:6px 12px;font-weight:600;color:#374151;background:#f9fafb;white-space:nowrap;border:1px solid #e5e7eb;">${label}</td>
        <td style="padding:6px 12px;color:#111827;border:1px solid #e5e7eb;word-break:break-all;">${val}</td>
      </tr>`)
    .join("");

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f3f4f6;margin:0;padding:24px;">
  <div style="max-width:620px;margin:auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
    <div style="background:#ef4444;padding:20px 24px;">
      <h1 style="margin:0;color:#fff;font-size:18px;">🚨 Neo DLQ Alert — Notification Failed</h1>
    </div>
    <div style="padding:24px;">
      <p style="margin:0 0 16px 0;color:#374151;font-size:14px;">
        A notification job has permanently failed after exhausting all retry attempts and has been moved to the Dead Letter Queue (DLQ).
      </p>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        ${tableRows}
      </table>
    </div>
    <div style="background:#f9fafb;padding:12px 24px;border-top:1px solid #e5e7eb;text-align:center;">
      <p style="margin:0;font-size:12px;color:#6b7280;">This is an automated alert from Neo Notification Service.</p>
    </div>
  </div>
</body>
</html>`;

  try {
    // Use Mailjet directly (same as EmailService but without the full service layer)
    const Mailjet = (await import("node-mailjet")).default;
    const apiKey = process.env.MAILJET_API_KEY;
    const secretKey = process.env.MAILJET_SECRET_KEY;
    const fromAddress = process.env.MAIL_FROM_ADDRESS || "no-reply@netsights.ai";
    const fromName = process.env.MAIL_FROM_NAME || "Neo";

    if (!apiKey || !secretKey) {
      console.error("[Alert Email] MAILJET_API_KEY / MAILJET_SECRET_KEY not set");
      return;
    }

    const client = Mailjet.Client.apiConnect(apiKey, secretKey);
    await client.post("send", { version: "v3.1" }).request({
      Messages: ALERT_EMAILS.map((email) => ({
        From: { Email: fromAddress, Name: fromName },
        To: [{ Email: email }],
        Subject: `🚨 DLQ Alert: ${clean(r.jobType ?? input.source, 60)} failed (Job ${clean(r.jobId ?? input.reference, 20)})`,
        HTMLPart: html,
        TextPart: `DLQ ALERT\n\n${rows.map(([l, v]) => `${l}: ${v}`).join("\n")}`,
      })),
    });

    console.log(`[Alert Email] Sent to ${ALERT_EMAILS.join(", ")}`);
  } catch (emailError) {
    // Email alert failure must never crash the caller
    console.error("[Alert Email] Failed to send:", emailError);
  }
}

// --- Main export ---
export async function sendSystemAlert(input: SystemAlertInput): Promise<void> {
  // Email alert always fires (even in dry-run — so you know something hit DLQ during testing)
  sendAlertEmail(input).catch(() => {});

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
      await client.messages.create({
        from: `whatsapp:${from}`,
        to: `whatsapp:${to}`,
        contentSid: ALERT_CONTENT_SID,
        contentVariables: JSON.stringify(vars),
      });
    } else {
      await client.messages.create({
        from: `whatsapp:${from}`,
        to: `whatsapp:${to}`,
        body:
          `[Netsight Alert] ${vars.alert_title} | ${vars.alert_source} | ` +
          `${vars.alert_reference} | ${vars.alert_details}`,
      });
    }
  } catch (alertError) {
    console.error("[System Alert] Failed to send WhatsApp alert:", alertError);
  }
}

