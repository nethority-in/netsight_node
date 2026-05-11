import fs from 'fs/promises';
import path from 'path';
import { persistEmailLogInMySql, persistWhatsAppLogInMySql } from './mysqlLogStore.js';

// Use project root (cwd) so logs go to src/ even when running from dist/
const projectRoot = process.cwd();
const WHATSAPP_LOG_PATH = process.env.NODE_ENV === 'production' ? path.join(projectRoot, 'logs', 'logs-whatsapp.json') : path.join(projectRoot, 'src', 'logs-whatsapp.json');
const EMAIL_LOG_PATH = process.env.NODE_ENV === 'production' ? path.join(projectRoot, 'logs', 'logs-email.json') : path.join(projectRoot, 'src', 'logs-email.json');
const Meta_API_LOG_PATH = process.env.NODE_ENV === 'production' ? path.join(projectRoot, 'logs', 'logs-meta-api.json') : path.join(projectRoot, 'src', 'logs-meta-api.json');
const NOTIFICATION_LOG_PATH = process.env.NODE_ENV === 'production' ? path.join(projectRoot, 'logs', 'logs-notification.json') : path.join(projectRoot, 'src', 'logs-notification.json');
const NOTIFICATION_SETTING_LOG_PATH = process.env.NODE_ENV === 'production' ? path.join(projectRoot, 'logs', 'logs-notification-setting.json') : path.join(projectRoot, 'src', 'logs-notification-setting.json');
const WIDGET_LOG_PATH = process.env.NODE_ENV === 'production' ? path.join(projectRoot, 'logs', 'logs-widget.json') : path.join(projectRoot, 'src', 'logs-widget.json');
const FROM_NUMBERS_LOG_PATH = process.env.NODE_ENV === 'production' ? path.join(projectRoot, "logs", "logs-from-numbers.json") : path.join(projectRoot, "src", "logs-from-numbers.json");
const CREATE_CUSTOM_TEMPLATE_LOG_PATH = process.env.NODE_ENV === 'production' ? path.join(projectRoot, "logs", "logs-create-custom-template.json") : path.join(projectRoot, "src", "logs-create-custom-template.json");
const AUTH_LOG_PATH = process.env.NODE_ENV === 'production' ? path.join(projectRoot, 'logs', 'logs-auth.json') : path.join(projectRoot, 'src', 'logs-auth.json');

/** Resolved paths for the active NODE_ENV (same files appendWhatsAppLog / appendEmailLog write to). */
export function getResolvedWhatsAppLogPath(): string {
  return WHATSAPP_LOG_PATH;
}

export function getResolvedEmailLogPath(): string {
  return EMAIL_LOG_PATH;
}

let whatsappLogPromise: Promise<void> = Promise.resolve();
let emailLogPromise: Promise<void> = Promise.resolve();
let metaApiLogPromise: Promise<void> = Promise.resolve();
let notificationLogPromise: Promise<void> = Promise.resolve();
let notificationSettingLogPromise: Promise<void> = Promise.resolve();
let widgetLogPromise: Promise<void> = Promise.resolve();
let fromNumbersLogsPromise: Promise<void> = Promise.resolve();
let createCustomTemplateLogsPromise: Promise<void> = Promise.resolve();
let authLogPromise: Promise<void> = Promise.resolve();

 //Get current timestamp in Indian Standard Time (IST) 
function getISTTimestamp(): string {
  return new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour12: false
  });
}

//Append to JSON file
async function appendToJsonFile(
  filePath: string,
  entry: object,
  chain: Promise<void>
): Promise<void> {
  await chain;
  try {
    let data: unknown[] = [];

    try {
      const raw = await fs.readFile(filePath, 'utf-8');
      const parsed = JSON.parse(raw || '[]');
      if (Array.isArray(parsed)) data = parsed;
    } catch {
      data = [];
    }

    data.push(entry);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write API log:', err);
  }
}


//Append WhatsApp API request/response to src/logs-whatsapp.json
export function appendWhatsAppLog(request: object, response: object): void {
  const timestamp = getISTTimestamp();
  const entry = {
    timestamp,
    request,
    response
  };

  whatsappLogPromise = appendToJsonFile(
    WHATSAPP_LOG_PATH,
    entry,
    whatsappLogPromise
  );

  void persistWhatsAppLogInMySql(
    timestamp,
    request as Record<string, unknown>,
    response as Record<string, unknown>
  );
}

//Append Email API request/response to src/logs-email.json
export function appendEmailLog(request: object, response: object): void {
  const timestamp = getISTTimestamp();
  const entry = {
    timestamp,
    request,
    response
  };

  emailLogPromise = appendToJsonFile(
    EMAIL_LOG_PATH,
    entry,
    emailLogPromise
  );

  void persistEmailLogInMySql(
    timestamp,
    request as Record<string, unknown>,
    response as Record<string, unknown>
  );
}

//Append Meta API request/response to src/logs-meta-api.json
export function appendMetaApiLog(request: object, response: object): void {
  const entry = {
    timestamp: getISTTimestamp(),
    request,
    response
  };

  metaApiLogPromise = appendToJsonFile(
    Meta_API_LOG_PATH,
    entry,
    metaApiLogPromise
  );
}

//Append Notification API request/response to src/logs-notification.json
export function appendNotificationLog(request: object, response: object): void {
  const entry = {
    timestamp: getISTTimestamp(),
    request,
    response
  };

  notificationLogPromise = appendToJsonFile(
    NOTIFICATION_LOG_PATH,
    entry,
    notificationLogPromise
  );
}

//Append Notification Setting API request/response to src/logs-notification-setting.json
export function appendNotificationSettingLog(request: object, response: object): void {
  const entry = {
    timestamp: getISTTimestamp(),
    request,
    response
  };

  notificationSettingLogPromise = appendToJsonFile(
    NOTIFICATION_SETTING_LOG_PATH,
    entry,
    notificationSettingLogPromise
  );
}

//Append Widget API request/response to src/logs-widget.json
export function appendWidgetLog(request: object, response: object): void {
  const entry = {
    timestamp: getISTTimestamp(),
    request,
    response
  };

  widgetLogPromise = appendToJsonFile(
    WIDGET_LOG_PATH,
    entry,
    widgetLogPromise
  );
}

export function appendFromNumbersLog(request: object, response: object):void{
  const entry = {
    timestamp: getISTTimestamp(),
    request,
    response
  };
  fromNumbersLogsPromise = appendToJsonFile(
    FROM_NUMBERS_LOG_PATH,
    entry,
    fromNumbersLogsPromise
  )
}

export function appendCreateCustomTemplateLog(request: object, response: object):void{
  const entry = {
    timestamp: getISTTimestamp(),
    request,
    response
  };
  createCustomTemplateLogsPromise = appendToJsonFile(
    CREATE_CUSTOM_TEMPLATE_LOG_PATH,
    entry,
    createCustomTemplateLogsPromise
  );
}

export function appendAuthLog(entry: { event: string; username?: string; success?: boolean; message?: string; [key: string]: unknown }): void {
  const fullEntry = { timestamp: getISTTimestamp(), ...entry };
  authLogPromise = appendToJsonFile(AUTH_LOG_PATH, fullEntry, authLogPromise);
}