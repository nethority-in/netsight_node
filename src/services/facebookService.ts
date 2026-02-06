import axios from 'axios';

const apiVersion = process.env.FACEBOOK_API_VERSION || process.env.META_GRAPH_VERSION || 'v22.0';

function ensureConfig(): void {
  if (!process.env.FACEBOOK_APP_ID || !process.env.FACEBOOK_APP_SECRET || !process.env.FACEBOOK_REDIRECT_URI) {
    throw new Error(
      'Facebook OAuth not configured. Set FACEBOOK_APP_ID, FACEBOOK_APP_SECRET, and FACEBOOK_REDIRECT_URI in .env'
    );
  }
}


//  Build Facebook OAuth authorization URL with optional state for CSRF.

export function getOAuthUrl(state: string | null): string {
  ensureConfig();
  const params = new URLSearchParams({
    client_id: process.env.FACEBOOK_APP_ID!,
    redirect_uri: process.env.FACEBOOK_REDIRECT_URI! || "http://localhost:3002/api/facebook/callback",
    scope: 'ads_read,business_management,pages_show_list,pages_read_engagement,public_profile,ads_management',
    response_type: 'code',
  });
  if (state) params.set('state', state);
  return `https://www.facebook.com/${apiVersion}/dialog/oauth?${params.toString()}`;
}


  // Exchange authorization code for short-lived access token.

export async function exchangeCodeForToken(code: string): Promise<{ access_token: string; expires_in?: number }> {
  ensureConfig();
  const url = `https://graph.facebook.com/${apiVersion}/oauth/access_token`;
  const { data } = await axios.get<{ access_token?: string; expires_in?: number }>(url, {
    params: {
      client_id: process.env.FACEBOOK_APP_ID,
      client_secret: process.env.FACEBOOK_APP_SECRET,
      redirect_uri: process.env.FACEBOOK_REDIRECT_URI,
      code,
    },
  });
  if (!data?.access_token) {
    throw new Error('Failed to exchange code for token: no access_token in response');
  }
  return {
    access_token: data.access_token,
    expires_in: data.expires_in,
  };
}


  // Exchange short-lived token for long-lived token.

export async function getLongLivedToken(shortLivedToken: string): Promise<{ access_token: string; expires_in?: number }> {
  ensureConfig();
  const url = `https://graph.facebook.com/${apiVersion}/oauth/access_token`;
  const { data } = await axios.get<{ access_token?: string; expires_in?: number }>(url, {
    params: {
      grant_type: 'fb_exchange_token',
      client_id: process.env.FACEBOOK_APP_ID,
      client_secret: process.env.FACEBOOK_APP_SECRET,
      fb_exchange_token: shortLivedToken,
    },
  });
  if (!data?.access_token) {
    throw new Error('Failed to get long-lived token: no access_token in response');
  }
  return {
    access_token: data.access_token,
    expires_in: data.expires_in,
  };
}
