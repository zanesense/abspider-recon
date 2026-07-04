import dns from 'node:dns/promises';

const ALLOWED_HEADERS = new Set([
  'accept',
  'accept-encoding',
  'accept-language',
  'authorization',
  'content-type',
  'user-agent',
]);

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  '169.254.169.254',
  'metadata.google.internal',
  'metadata.internal',
]);

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 120;
const rateLimitBuckets = new Map<string, number[]>();

const isPrivateIP = (ip: string): boolean => {
  if (ip === '::1' || ip === '0:0:0:0:0:0:0:1') return true;
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some(isNaN)) return false;
  const [a, b] = parts;
  if (a === 10 || a === 127 || (a === 169 && b === 254)) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
};

const isPrivateIPv6 = (ip: string): boolean => {
  const lower = ip.toLowerCase();
  if (lower === '::1' || lower === '0:0:0:0:0:0:0:1') return true;
  if (lower.startsWith('fc') || lower.startsWith('fd')) return true;
  if (lower.startsWith('fe80')) return true;
  return false;
};

const isSSRFTarget = async (url: URL): Promise<boolean> => {
  const host = url.hostname;
  if (BLOCKED_HOSTNAMES.has(host)) return true;
  if (isPrivateIP(host) || isPrivateIPv6(host)) return true;
  try {
    const addresses = await dns.resolve(host, 'ANY');
    for (const addr of addresses) {
      if (addr.type === 'A' && isPrivateIP(addr.value)) return true;
      if (addr.type === 'AAAA' && isPrivateIPv6(addr.value)) return true;
    }
  } catch {
    return true;
  }
  return false;
};

const ALLOWED_ORIGINS = new Set([
  'https://abspider.zanesense.dev',
  'http://localhost:5000',
  'http://localhost:3000',
  'http://localhost:5173',
]);

const getCorsHeaders = (origin: string): Record<string, string> => ({
  'Access-Control-Allow-Origin': ALLOWED_ORIGINS.has(origin) ? origin : 'null',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Expose-Headers': 'X-ABSpider-Proxy, X-ABSpider-Target-URL',
  'Vary': 'Origin',
  'X-ABSpider-Proxy': 'vercel',
});

const DEFAULT_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const sendJson = (response: any, status: number, payload: unknown, origin = '') => {
  response.status(status);
  for (const [key, value] of Object.entries(getCorsHeaders(origin))) {
    response.setHeader(key, value);
  }
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.send(JSON.stringify(payload));
};

export default async function handler(request: any, response: any) {
  const origin = String(request.headers['origin'] || '');
  const clientIp = String(request.headers['x-forwarded-for'] || request.socket?.remoteAddress || 'unknown');

  if (request.method === 'OPTIONS') {
    response.status(204);
    for (const [key, value] of Object.entries(getCorsHeaders(origin))) {
      response.setHeader(key, value);
    }
    response.end();
    return;
  }

  if (request.method !== 'GET' && request.method !== 'POST') {
    sendJson(response, 405, { error: 'Method not allowed' }, origin);
    return;
  }

  const now = Date.now();
  const timestamps = rateLimitBuckets.get(clientIp) || [];
  const cutoff = now - RATE_LIMIT_WINDOW_MS;
  while (timestamps.length > 0 && timestamps[0] < cutoff) {
    timestamps.shift();
  }
  if (timestamps.length >= RATE_LIMIT_MAX) {
    sendJson(response, 429, { error: 'Rate limit exceeded. Try again later.' }, origin);
    return;
  }
  timestamps.push(now);
  rateLimitBuckets.set(clientIp, timestamps);

  const rawUrl = Array.isArray(request.query?.url) ? request.query.url[0] : request.query?.url;
  if (!rawUrl || typeof rawUrl !== 'string') {
    sendJson(response, 400, { error: 'Missing url query parameter' }, origin);
    return;
  }

  let targetUrl: URL;
  try {
    targetUrl = new URL(rawUrl);
  } catch {
    sendJson(response, 400, { error: 'Invalid URL' }, origin);
    return;
  }

  if (targetUrl.protocol !== 'http:' && targetUrl.protocol !== 'https:') {
    sendJson(response, 400, { error: 'Invalid URL. Must start with http:// or https://' }, origin);
    return;
  }

  if (await isSSRFTarget(targetUrl)) {
    sendJson(response, 400, { error: 'Target URL is not allowed' }, origin);
    return;
  }

  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(request.headers || {})) {
    const lowerKey = key.toLowerCase();
    if (!ALLOWED_HEADERS.has(lowerKey)) continue;
    headers[key] = Array.isArray(value) ? value.join(', ') : String(value);
  }
  if (!Object.keys(headers).some((key) => key.toLowerCase() === 'user-agent')) {
    headers['User-Agent'] = DEFAULT_UA;
  }

  try {
    let upstream = await fetch(targetUrl.toString(), {
      method: request.method,
      headers,
      body: request.method === 'GET' ? undefined : request.body,
      redirect: 'manual',
    });

    for (let i = 0; i < 5; i++) {
      if (upstream.status >= 300 && upstream.status < 400) {
        const location = upstream.headers.get('location');
        if (!location) break;
        const redirectUrl = new URL(location, targetUrl.toString());
        if (await isSSRFTarget(redirectUrl)) {
          sendJson(response, 400, { error: 'Redirect target URL is not allowed' }, origin);
          return;
        }
        targetUrl = redirectUrl;
        upstream = await fetch(targetUrl.toString(), {
          method: request.method,
          headers,
          redirect: 'manual',
        });
      } else {
        break;
      }
    }

    const corsHeaders = getCorsHeaders(origin);
    response.status(upstream.status);
    upstream.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (lowerKey === 'content-encoding' || lowerKey === 'content-length' || lowerKey === 'transfer-encoding') {
        return;
      }
      response.setHeader(key, value);
    });
    for (const [key, value] of Object.entries(corsHeaders)) {
      response.setHeader(key, value);
    }
    response.setHeader('X-ABSpider-Target-URL', targetUrl.toString());
    response.send(new Uint8Array(await upstream.arrayBuffer()));
  } catch {
    sendJson(response, 500, {
      error: 'Failed to fetch target URL',
    }, origin);
  }
}
