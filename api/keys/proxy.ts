import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const adminClient = supabaseUrl && serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey)
  : null;

const PROVIDER_AUTH: Record<string, { type: string; header?: string; param?: string; prefix?: string }> = {
  shodan: { type: 'query', param: 'key' },
  virustotal: { type: 'query', param: 'apikey' },
  securitytrails: { type: 'header', header: 'APIKEY', prefix: '' },
  builtwith: { type: 'query', param: 'KEY' },
  opencage: { type: 'query', param: 'key' },
  hunterio: { type: 'query', param: 'api_key' },
  clearbit: { type: 'header', header: 'Authorization', prefix: 'Bearer ' },
};

const PROVIDER_HOSTS: Record<string, string> = {
  shodan: 'api.shodan.io',
  virustotal: 'www.virustotal.com',
  securitytrails: 'api.securitytrails.com',
  builtwith: 'api.builtwith.com',
  opencage: 'api.opencagedata.com',
  hunterio: 'api.hunter.io',
  clearbit: 'company.clearbit.com',
};

export const parseProviderUrl = (provider: string, value: string): URL => {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.hostname !== PROVIDER_HOSTS[provider]) throw new Error('Provider URL is not allowed');
  return url;
};

function attachAuth(url: string, headers: Record<string, string>, provider: string, apiKey: string) {
  const config = PROVIDER_AUTH[provider];
  if (!config) return { url, headers };
  if (config.type === 'header') {
    const prefix = config.prefix || '';
    headers[config.header!] = `${prefix}${apiKey}`;
  } else if (config.type === 'query') {
    const sep = url.includes('?') ? '&' : '?';
    url = `${url}${sep}${config.param}=${encodeURIComponent(apiKey)}`;
  }
  return { url, headers };
}

const ALLOWED_ORIGINS = new Set([
  'https://abspider.zanesense.dev',
  'http://localhost:5000',
  'http://localhost:3000',
  'http://localhost:5173',
]);

export default async function handler(request: any, response: any) {
  const origin = String(request.headers.origin || '');
  const setCors = () => {
    // Never fall back to '*' on an authenticated endpoint — reflect only known origins
    response.setHeader(
      'Access-Control-Allow-Origin',
      ALLOWED_ORIGINS.has(origin) ? origin : 'null',
    );
    response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.setHeader('Access-Control-Allow-Credentials', 'true');
    if (ALLOWED_ORIGINS.has(origin)) response.setHeader('Vary', 'Origin');
  };
  setCors();

  if (request.method === 'OPTIONS') {
    response.status(204).end();
    return;
  }

  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const auth = request.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) {
    response.status(401).json({ error: 'Missing Authorization header' });
    return;
  }
  const token = auth.slice(7);

  if (!adminClient) {
    response.status(500).json({ error: 'Server misconfigured' });
    return;
  }

  const { data: { user }, error: authError } = await adminClient.auth.getUser(token);
  if (authError || !user) {
    response.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  let body: any;
  try {
    body = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;
  } catch {
    response.status(400).json({ error: 'Invalid JSON body' });
    return;
  }
  if (!body || !body.provider || !body.url) {
    response.status(400).json({ error: 'provider and url are required' });
    return;
  }

  if (!PROVIDER_AUTH[body.provider]) {
    response.status(400).json({ error: `Unknown provider: ${body.provider}` });
    return;
  }

  let apiKey = body.api_key;
  if (!apiKey) {
    const { data } = await adminClient
      .from('user_api_keys')
      .select('api_keys')
      .eq('user_id', user.id)
      .single();
    apiKey = data?.api_keys?.[body.provider];
    if (!apiKey) {
      response.status(400).json({ error: `API key not configured for ${body.provider}` });
      return;
    }
  }

  let targetUrl: URL;
  try {
    targetUrl = parseProviderUrl(body.provider, body.url);
  } catch {
    response.status(400).json({ error: 'Provider URL is not allowed' });
    return;
  }
  const method = body.method || 'GET';
  const reqHeaders: Record<string, string> = {};
  if (body.headers) Object.assign(reqHeaders, body.headers);
  reqHeaders['User-Agent'] = 'ABSpider/2.0';

  const { url: finalUrl, headers: finalHeaders } = attachAuth(targetUrl.toString(), reqHeaders, body.provider, apiKey);

  try {
    const resp = await fetch(finalUrl, {
      method,
      headers: finalHeaders,
      body: body.body || undefined,
      redirect: 'error',
    });

    const respHeaders: Record<string, string> = {};
    resp.headers.forEach((v, k) => {
      if (!['content-encoding', 'transfer-encoding', 'content-length'].includes(k)) {
        respHeaders[k] = v;
      }
    });

    const buf = await resp.arrayBuffer();
    response.status(resp.status);
    for (const [k, v] of Object.entries(respHeaders)) response.setHeader(k, v);
    response.end(Buffer.from(buf));
  } catch (e: any) {
    response.status(502).json({ error: 'Upstream request failed' });
  }
}
