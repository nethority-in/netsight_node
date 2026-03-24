import { Request, Response } from 'express';
import axios from 'axios';

const STATIC_META_GRAPH_VERSION = 'v22.0';
const STATIC_FACEBOOK_APP_ID = '2222959544777210';
const STATIC_FACEBOOK_APP_SECRET = '51494072f4efc485ede8319e5419a383';
const STATIC_FACEBOOK_REDIRECT_URI = 'https://bridge.netsights.ai/api/facebook-isight/callback';

function buildIsightOAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: STATIC_FACEBOOK_APP_ID,
    redirect_uri: STATIC_FACEBOOK_REDIRECT_URI,
    scope: 'business_management',
    response_type: 'code',
    state,
  });

  return `https://www.facebook.com/${STATIC_META_GRAPH_VERSION}/dialog/oauth?${params.toString()}`;
}

export async function connect(_req: Request, res: Response): Promise<void> {
  const staticState = 'isight-facebook';
  const oauthUrl = buildIsightOAuthUrl(staticState);

  res.json({
    oauth_url: oauthUrl,
    redirect_uri: STATIC_FACEBOOK_REDIRECT_URI,
  });
}

export async function callback(req: Request, res: Response): Promise<void> {
  const code = req.query.code as string | undefined;
  const state = req.query.state as string | undefined;

  if (!code) {
    res.status(400).send(callbackErrorHtml('Missing code in callback query.'));
    return;
  }

  if (state !== 'isight-facebook') {
    res.status(400).send(callbackErrorHtml('Invalid state for facebook-isight flow.'));
    return;
  }

  try {
    const tokenUrl = `https://graph.facebook.com/${STATIC_META_GRAPH_VERSION}/oauth/access_token`;
    const { data } = await axios.get<{ access_token?: string; expires_in?: number }>(tokenUrl, {
      params: {
        client_id: STATIC_FACEBOOK_APP_ID,
        client_secret: STATIC_FACEBOOK_APP_SECRET,
        redirect_uri: STATIC_FACEBOOK_REDIRECT_URI,
        code,
      },
    });

    res.send(
      callbackSuccessHtml({
        access_token: data?.access_token ?? 'not_received',
        expires_in: data?.expires_in ?? null,
      })
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Token exchange failed';
    res.status(500).send(callbackErrorHtml(message));
  }
}

function callbackSuccessHtml(data: { access_token: string; expires_in: number | null }): string {
  const payloadEscaped = JSON.stringify(JSON.stringify(data));
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Facebook iSight connected</title></head>
<body>
  <h3>facebook-isight callback success</h3>
  <p>Facebook isight connected. You can close this window.</p>
  <script>
    try {
      if (window.opener) {
        window.opener.postMessage({ type: 'facebook_isight_success', data: JSON.parse(JSON.parse(${payloadEscaped})) }, '*');
      }
    } catch (e) {}
  </script>
</body>
</html>`;
}

function callbackErrorHtml(message: string): string {
  const escaped = message.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Facebook iSight failed</title></head>
<body>
  <h3>facebook-isight callback failed</h3>
  <p>${escaped}</p>
</body>
</html>`;
}
