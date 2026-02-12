import { Request, Response } from 'express';
import crypto from 'crypto';
import { getOAuthUrl, exchangeCodeForToken, getLongLivedToken } from '../services/facebookService.js';
import { ErrorHandler } from '../utils/errorHandler.js';

const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const stateStore = new Map<string, number>();

function pruneExpiredStates(): void {
  const now = Date.now();
  for (const [key, expiresAt] of stateStore.entries()) {
    if (expiresAt < now) stateStore.delete(key);
  }
}


  // Initiate Facebook OAuth flow. Returns URL to redirect user to.
  // Requires Authorization: Bearer <CUSTOM_TOKEN>.

export async function connect(_req: Request, res: Response): Promise<void> {
  try {
    const state = crypto.randomBytes(16).toString('hex');
    stateStore.set(state, Date.now() + STATE_TTL_MS);
    pruneExpiredStates();

    const oauthUrl = getOAuthUrl(state);
    res.json({ oauth_url: oauthUrl });
  } catch (e) {
    console.error('Facebook connect error', e);
    ErrorHandler.sendErrorResponse(res, e, 'Failed to initiate OAuth', 500);
  }
}

  // Handle Facebook OAuth callback (GET with ?code=...&state=...).
  // Public route; validates state then exchanges code for token and returns success/error HTML for popup flow.

export async function callback(req: Request, res: Response): Promise<void> {
  try {
    const code = req.query.code as string | undefined;
    const state = req.query.state as string | undefined;

    if (!code || typeof code !== 'string') {
      res.status(400).send(callbackErrorHtml('Invalid OAuth callback: missing code.'));
      return;
    }

    const now = Date.now();
    const stateValid = state && stateStore.has(state) && (stateStore.get(state) ?? 0) > now;
    if (!stateValid) {
      res.status(400).send(callbackErrorHtml('Invalid or missing OAuth state. Please try connecting again.'));
      return;
    }
    stateStore.delete(state!);
    pruneExpiredStates();

    const tokenData = await exchangeCodeForToken(code);
    if (!tokenData.access_token) {
      res.status(500).send(callbackErrorHtml('Failed to get access token.'));
      return;
    }

    const longLived = await getLongLivedToken(tokenData.access_token);

    res.send(
      callbackSuccessHtml({
        access_token: longLived.access_token,
        expires_in: longLived.expires_in ?? null,
      })
    );
  } catch (e) {
    console.error('Facebook callback error', e);
    const msg = e instanceof Error ? e.message : 'OAuth callback failed.';
    res.status(500).send(callbackErrorHtml(msg));
  }
}

function callbackSuccessHtml(data: { access_token: string; expires_in: number | null }): string {
  const payloadEscaped = JSON.stringify(JSON.stringify(data));
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Facebook connected</title></head>
<body>
  <p>Facebook connected successfully. You can close this window.</p>
  <script>
    try {
      if (window.opener) {
        window.opener.postMessage({ type: 'facebook_oauth_success', data: JSON.parse(JSON.parse(${payloadEscaped})) }, '*');
      }
    } catch (e) {}
    setTimeout(function() { window.close(); }, 500);
  </script>
</body>
</html>`;
}

function callbackErrorHtml(message: string): string {
  const escaped = message.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Facebook connection failed</title></head>
<body>
  <p>Connection failed: ${escaped}</p>
  <script>
    try {
      if (window.opener) {
        window.opener.postMessage({ type: 'facebook_oauth_error', error: ${JSON.stringify(message)} }, '*');
      }
    } catch (e) {}
    setTimeout(function() { window.close(); }, 3000);
  </script>
</body>
</html>`;
}
