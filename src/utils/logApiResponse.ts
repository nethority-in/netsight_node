import fs from 'fs/promises';
import path from 'path';

// Use project root (cwd) so logs go to src/ even when running from dist/
const projectRoot = process.cwd();
const WHATSAPP_LOG_PATH = process.env.NODE_ENV === 'production' ? path.join(projectRoot, 'logs', 'logs-whatsapp.json') : path.join(projectRoot, 'src', 'logs-whatsapp.json');
const EMAIL_LOG_PATH = process.env.NODE_ENV === 'production' ? path.join(projectRoot, 'logs', 'logs-email.json') : path.join(projectRoot, 'src', 'logs-email.json');

let whatsappLogPromise: Promise<void> = Promise.resolve();
let emailLogPromise: Promise<void> = Promise.resolve();

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
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write API log:', err);
  }
}

//Append WhatsApp API request/response to src/logs-whatsapp.json
export function appendWhatsAppLog(request: object, response: object): void {
  const entry = {
    timestamp: getISTTimestamp(), // IST time
    request,
    response
  };

  whatsappLogPromise = appendToJsonFile(
    WHATSAPP_LOG_PATH,
    entry,
    whatsappLogPromise
  );
}

//Append Email API request/response to src/logs-email.json
export function appendEmailLog(request: object, response: object): void {
  const entry = {
    timestamp: getISTTimestamp(), // IST time
    request,
    response
  };

  emailLogPromise = appendToJsonFile(
    EMAIL_LOG_PATH,
    entry,
    emailLogPromise
  );
}
