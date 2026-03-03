
  // Netsights logo as PNG base64 data URI for email templates.
  // Extracted from src/img/nights-logo 1.png - PNG format for maximum email client compatibility.

// import { readFileSync } from 'fs';
// import { join } from 'path';

// function loadLogo(): string {
//   const cwd = process.cwd();
//   const path = join(cwd, 'src/img/nights-logo_base64.txt');
//   console.log(path);
//   return readFileSync(path, 'utf-8').trim();
// }

// export const EMAIL_LOGO_DATA_URI: string = loadLogo();

import { readFileSync } from "fs";
import { join } from "path";

export const LOGO_CID = "netsights-logo"; // html me cid:netsights-logo

function loadLogoBase64(): string {
  const cwd = process.cwd();

  // Best: directly read the PNG cwd = current working directory
  const logoPath = join(cwd, "src/img/netsights-logo.png");
  return readFileSync(logoPath).toString("base64"); // only base64 string
}

export const EMAIL_LOGO_BASE64: string = loadLogoBase64();