
export const config = {
  runtime: 'edge', // Use Edge Runtime for better performance
};

const ALLOWED_METHODS = new Set(['GET', 'HEAD', 'POST']);
const MAX_REDIRECTS = 3;
const FETCH_TIMEOUT_MS = 15_000;

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
]);

const BLOCKED_HOSTNAME_SUFFIXES = ['.localhost', '.local', '.internal'];

class ProxyError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = 'ProxyError';
    this.status = status;
  }
}

function isIPv4Literal(hostname: string): boolean {
  return /^(?:\d{1,3}\.){3}\d{1,3}$/.test(hostname);
}

function isPrivateIPv4(hostname: string): boolean {
  if (!isIPv4Literal(hostname)) return false;

  const octets = hostname.split('.').map((part) => Number(part));
  if (octets.some((octet) => Number.isNaN(octet) || octet < 0 || octet > 255)) return false;

  const [a, b] = octets;

  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a >= 224
  );
}

function normalizeIPv6(hostname: string): string {
  return hostname.replace(/^\[|\]$/g, '').toLowerCase();
}

function isPrivateIPv6(hostname: string): boolean {
  if (!hostname.includes(':')) return false;
  const normalized = normalizeIPv6(hostname);

  if (normalized === '::1' || normalized === '::') return true;
  if (normalized.startsWith('fe8') || normalized.startsWith('fe9') || normalized.startsWith('fea') || normalized.startsWith('feb')) return true;
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;
  if (normalized.startsWith('ff')) return true;
  if (normalized.startsWith('::ffff:')) {
    const mappedIPv4 = normalized.slice('::ffff:'.length);
    return isPrivateIPv4(mappedIPv4);
  }

  return false;
}

function isBlockedHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(normalized)) return true;
  if (BLOCKED_HOSTNAME_SUFFIXES.some((suffix) => normalized.endsWith(suffix))) return true;
  if (isPrivateIPv4(normalized)) return true;
  if (isPrivateIPv6(normalized)) return true;
  return false;
}

function validateTargetUrl(rawUrl: string): URL {
  const parsed = new URL(rawUrl);

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new ProxyError('Only HTTP(S) target URLs are allowed');
  }

  if (parsed.username || parsed.password) {
    throw new ProxyError('Target URL must not include credentials');
  }

  if (isBlockedHostname(parsed.hostname)) {
    throw new ProxyError('Target URL points to a disallowed host');
  }

  return parsed;
}

function jsonResponse(payload: Record<string, string>, status: number, headers: HeadersInit = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const targetUrl = url.searchParams.get('url');
  const method = req.method.toUpperCase();

  // CORS headers for the proxy functionality itself
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (!targetUrl) {
    return jsonResponse({ error: 'Missing "url" query parameter' }, 400, corsHeaders);
  }

  if (!ALLOWED_METHODS.has(method)) {
    return jsonResponse({ error: `Method "${method}" is not allowed` }, 405, corsHeaders);
  }

  try {
    let currentUrl = validateTargetUrl(targetUrl).toString();

    // Prepare headers for the target request
    const headers = new Headers();
    
    // Copy relevant headers from the original request
    // We strictly filter what we pass to avoid issues
    // Do not forward Authorization/Cookie headers to avoid leaking caller credentials.
    const allowedHeaders = ['accept', 'accept-encoding', 'accept-language', 'cache-control', 'content-type', 'user-agent'];
    
    req.headers.forEach((value, key) => {
      if (allowedHeaders.includes(key.toLowerCase())) {
        headers.set(key, value);
      }
    });

    // Ensure we have a valid User-Agent if one wasn't provided
    if (!headers.get('user-agent')) {
      headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    let response: Response | null = null;

    try {
      for (let redirectCount = 0; ; redirectCount++) {
        response = await fetch(currentUrl, {
          method,
          headers,
          body: method === 'GET' || method === 'HEAD' ? undefined : req.body,
          redirect: 'manual',
          signal: controller.signal,
        });

        if (response.status < 300 || response.status >= 400) {
          break;
        }

        if (redirectCount >= MAX_REDIRECTS) {
          throw new ProxyError('Too many redirects', 502);
        }

        const location = response.headers.get('location');
        if (!location) {
          throw new ProxyError('Received redirect without a Location header', 502);
        }

        const nextUrl = new URL(location, currentUrl).toString();
        currentUrl = validateTargetUrl(nextUrl).toString();
      }
    } finally {
      clearTimeout(timeout);
    }

    // Create a new response with CORS headers and the target's body
    if (!response) {
      throw new Error('No upstream response received');
    }

    const responseHeaders = new Headers(response.headers);
    responseHeaders.delete('set-cookie');
    responseHeaders.delete('set-cookie2');

    // Add our CORS headers to the response
    Object.entries(corsHeaders).forEach(([key, value]) => {
      responseHeaders.set(key, value);
    });

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error: any) {
    const status =
      error?.name === 'AbortError'
        ? 504
        : error instanceof ProxyError
          ? error.status
          : 502;

    return jsonResponse(
      { error: 'Failed to fetch target URL', details: error.message ?? 'Unknown error' },
      status,
      corsHeaders
    );
  }
}
