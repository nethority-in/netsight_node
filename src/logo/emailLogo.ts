/**
 * Netsights logo as base64 data URI for email templates.
 * Extracted from src/img/logo-dark.svg.
 * Uses process.cwd() so it works from both src/ (dev) and dist/ (prod) when src exists.
 */
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function loadLogo(): string {
  const cwd = process.cwd();
  const paths = [
    join(cwd, 'src/img/logo-dark_base64.txt'),
    join(cwd, 'img/logo-dark_base64.txt'),
  ];
  for (const p of paths) {
    if (existsSync(p)) {
      return readFileSync(p, 'utf-8').trim();
    }
  }
  // Fallback: inline SVG-based logo (works when file missing)
  return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDI0MCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHRleHQgeD0iMTUiIHk9IjcwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iNjAiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSIjMDAwMDAwIj5uZXRzaTwvdGV4dD48Y2lyY2xlIGN4PSIxMzAiIGN5PSI0MCIgcj0iMjAiIGZpbGw9IiM1REJCQjgiLz48Y2lyY2xlIGN4PSIxMzAiIGN5PSI0MCIgcj0iMTAiIGZpbGw9IiNmZmZmZmYiLz48Y2lyY2xlIGN4PSIxNTAiIGN5PSIzMiIgcj0iOCIgZmlsbD0iIzVEQkJCOCIvPjx0ZXh0IHg9IjE2MCIgeT0iNzAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSI2MCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiMwMDAwMDAiPmh0czwvdGV4dD48cmVjdCB4PSIxMjUiIHk9IjY4IiB3aWR0aD0iMzAiIGhlaWdodD0iMjAiIGZpbGw9IiM1REJCQjgiIHJ4PSI1Ii8+PC9zdmc+';
}

export const EMAIL_LOGO_DATA_URI: string = loadLogo();
