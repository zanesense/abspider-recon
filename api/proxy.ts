const ALLOWED_HEADERS = new Set([
  'accept',
  'accept-encoding',
  'accept-language',
  'authorization',
  'content-type',
  'user-agent',
]);

const DEFAULT_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Expose-Headers': 'X-ABSpider-Proxy, X-ABSpider-Target-URL',
  'X-ABSpider-Proxy': 'vercel',
};

const sendJson = (response: any, status: number, payload: unknown) => {
  response.status(status);
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    response.setHeader(key, value);
  }
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.send(JSON.stringify(payload));
};

export default async function handler(request: any, response: any) {
  if (request.method === 'OPTIONS') {
    response.status(204);
    for (const [key, value] of Object.entries(CORS_HEADERS)) {
      response.setHeader(key, value);
    }
    response.end();
    return;
  }

  if (request.method !== 'GET' && request.method !== 'POST') {
    sendJson(response, 405, { error: 'Method not allowed' });
    return;
  }

  const rawUrl = Array.isArray(request.query?.url) ? request.query.url[0] : request.query?.url;
  if (!rawUrl || typeof rawUrl !== 'string') {
    sendJson(response, 400, { error: 'Missing url query parameter' });
    return;
  }

  let targetUrl: URL;
  try {
    targetUrl = new URL(rawUrl);
  } catch {
    sendJson(response, 400, { error: 'Invalid URL' });
    return;
  }

  if (targetUrl.protocol !== 'http:' && targetUrl.protocol !== 'https:') {
    sendJson(response, 400, { error: 'Invalid URL. Must start with http:// or https://' });
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
    const upstream = await fetch(targetUrl.toString(), {
      method: request.method,
      headers,
      body: request.method === 'GET' ? undefined : request.body,
      redirect: 'follow',
    });

    response.status(upstream.status);
    upstream.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (lowerKey === 'content-encoding' || lowerKey === 'content-length' || lowerKey === 'transfer-encoding') {
        return;
      }
      response.setHeader(key, value);
    });
    for (const [key, value] of Object.entries(CORS_HEADERS)) {
      response.setHeader(key, value);
    }
    response.setHeader('X-ABSpider-Target-URL', targetUrl.toString());
    response.send(new Uint8Array(await upstream.arrayBuffer()));
  } catch (error: any) {
    sendJson(response, 500, {
      error: 'Failed to fetch target URL',
      details: error?.message || String(error),
    });
  }
}
