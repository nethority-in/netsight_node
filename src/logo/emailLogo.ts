/**
 * Netsights logo as PNG base64 data URI for email templates.
 * Extracted from src/img/nights-logo 1.png - PNG format for maximum email client compatibility.
 * Uses process.cwd() so it works from both src/ (dev) and dist/ (prod) when src exists.
 */
import { readFileSync } from 'fs';
import { join } from 'path';

function loadLogo(): string {
  const cwd = process.cwd();
  const path = join(cwd, 'src/img/nights-logo_base64.txt');
  console.log(path);
  return readFileSync(path, 'utf-8').trim();
}

export const EMAIL_LOGO_DATA_URI: string = loadLogo();
