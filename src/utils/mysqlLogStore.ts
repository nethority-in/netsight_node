import { PrismaClient } from '@prisma/logs-client';

type JsonObject = Record<string, unknown>;
const logsPrisma = new PrismaClient();
let ensureLogsTablesPromise: Promise<void> | null = null;

function isMySqlLoggingConfigured(): boolean {
  return Boolean(process.env.LOGS_DATABASE_URL);
}

function shouldEnableMySqlLogging(): boolean {
  const explicit = process.env.MYSQL_LOGGING_ENABLED;
  if (explicit != null) {
    return explicit === '1' || explicit.toLowerCase() === 'true';
  }
  return isMySqlLoggingConfigured();
}

function getString(value: unknown): string | null {
  if (value == null) return null;
  const s = String(value).trim();
  return s.length > 0 ? s : null;
}

function safeJsonStringify(value: unknown): string {
  try {
    return JSON.stringify(value ?? {});
  } catch {
    return JSON.stringify({ fallback: 'serialization_failed' });
  }
}

async function ensureLogsTables(): Promise<void> {
  if (!ensureLogsTablesPromise) {
    ensureLogsTablesPromise = (async () => {
      await logsPrisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS email_logs (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          timestamp_ist VARCHAR(64) NULL,
          endpoint VARCHAR(120) NULL,
          env VARCHAR(32) NULL,
          recipient LONGTEXT NULL,
          sender VARCHAR(190) NULL,
          subject VARCHAR(255) NULL,
          template_name VARCHAR(190) NULL,
          provider_message_id VARCHAR(190) NULL,
          status VARCHAR(80) NULL,
          is_error TINYINT(1) NOT NULL DEFAULT 0,
          request_payload LONGTEXT NOT NULL,
          response_payload LONGTEXT NOT NULL,
          full_payload LONGTEXT NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await logsPrisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS whatsapp_logs (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          timestamp_ist VARCHAR(64) NULL,
          endpoint VARCHAR(120) NULL,
          env VARCHAR(32) NULL,
          recipient VARCHAR(128) NULL,
          sender VARCHAR(128) NULL,
          template_name VARCHAR(190) NULL,
          provider_message_id VARCHAR(190) NULL,
          status VARCHAR(80) NULL,
          is_error TINYINT(1) NOT NULL DEFAULT 0,
          request_payload LONGTEXT NOT NULL,
          response_payload LONGTEXT NOT NULL,
          full_payload LONGTEXT NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);
    })().catch((error) => {
      ensureLogsTablesPromise = null;
      throw error;
    });
  }

  await ensureLogsTablesPromise;
}

function extractEmailProviderMessageId(response: JsonObject): string | null {
  const data = (response as { data?: unknown }).data;
  if (!data || typeof data !== 'object') return null;

  const messages = (data as { Messages?: unknown }).Messages;
  if (!Array.isArray(messages) || messages.length === 0) return null;

  const first = messages[0] as { To?: Array<{ MessageID?: number }>; Status?: string };
  const firstTo = Array.isArray(first?.To) ? first.To[0] : undefined;
  if (typeof firstTo?.MessageID === 'number') return String(firstTo.MessageID);
  return null;
}

function extractEmailStatus(response: JsonObject): string | null {
  const data = (response as { data?: unknown }).data;
  if (!data || typeof data !== 'object') return null;
  const messages = (data as { Messages?: unknown }).Messages;
  if (!Array.isArray(messages) || messages.length === 0) return null;
  const first = messages[0] as { Status?: string };
  return getString(first?.Status);
}

export async function persistWhatsAppLogInMySql(
  timestamp: string,
  request: JsonObject,
  response: JsonObject
): Promise<void> {
  try {
    if (!shouldEnableMySqlLogging()) return;
    await ensureLogsTables();

    const responseAny = response as { sid?: unknown; status?: unknown };
    const requestAny = request as { endpoint?: unknown; env?: unknown; to?: unknown; from?: unknown; templateName?: unknown; error?: unknown };
    const status = getString(responseAny.status);
    const providerMessageId = getString(responseAny.sid);
    const isError = Boolean(requestAny.error);

    await logsPrisma.whatsAppLog.create({
      data: {
        timestamp_ist: timestamp,
        endpoint: getString(requestAny.endpoint),
        env: getString(requestAny.env),
        recipient: getString(requestAny.to),
        sender: getString(requestAny.from),
        template_name: getString(requestAny.templateName),
        provider_message_id: providerMessageId,
        status,
        is_error: isError,
        request_payload: safeJsonStringify(request),
        response_payload: safeJsonStringify(response),
        full_payload: safeJsonStringify({ timestamp, request, response })
      }
    });
  } catch (error) {
    console.error('Prisma whatsapp_logs insert failed:', error);
  }
}

export async function persistEmailLogInMySql(
  timestamp: string,
  request: JsonObject,
  response: JsonObject
): Promise<void> {
  try {
    if (!shouldEnableMySqlLogging()) return;
    await ensureLogsTables();

    const requestAny = request as {
      endpoint?: unknown;
      env?: unknown;
      to?: unknown;
      from?: unknown;
      subject?: unknown;
      templateName?: unknown;
      error?: unknown;
    };
    const isError = Boolean(requestAny.error);

    await logsPrisma.emailLog.create({
      data: {
        timestamp_ist: timestamp,
        endpoint: getString(requestAny.endpoint),
        env: getString(requestAny.env),
        recipient: Array.isArray(requestAny.to) ? requestAny.to.map((v) => String(v)).join(', ') : getString(requestAny.to),
        sender: getString(requestAny.from),
        subject: getString(requestAny.subject),
        template_name: getString(requestAny.templateName),
        provider_message_id: extractEmailProviderMessageId(response),
        status: extractEmailStatus(response),
        is_error: isError,
        request_payload: safeJsonStringify(request),
        response_payload: safeJsonStringify(response),
        full_payload: safeJsonStringify({ timestamp, request, response })
      }
    });
  } catch (error) {
    console.error('Prisma email_logs insert failed:', error);
  }
}
