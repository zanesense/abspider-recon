import http from 'node:http';
import https from 'node:https';
import zlib from 'node:zlib';
import { URL } from 'node:url';

let cachedProxyUrl = null;
let cachedProxyParsed = null;

function getProxyConfig() {
  const val = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.https_proxy || process.env.http_proxy;
  if (!val) return null;
  if (cachedProxyUrl === val) return cachedProxyParsed;
  cachedProxyUrl = val;
  try {
    cachedProxyParsed = new URL(val);
    return cachedProxyParsed;
  } catch {
    cachedProxyParsed = null;
    return null;
  }
}

function shouldBypassProxy(hostname) {
  const noProxy = process.env.NO_PROXY || process.env.no_proxy || '';
  return noProxy.split(',').some(pattern => {
    pattern = pattern.trim().toLowerCase();
    if (!pattern) return false;
    if (pattern === '*') return true;
    if (hostname === pattern) return true;
    if (pattern.startsWith('.') && hostname.endsWith(pattern)) return true;
    return false;
  });
}

function decompressBuffer(buffer, encoding) {
  if (!encoding) return buffer;
  const enc = encoding.toLowerCase().trim();
  try {
    if (enc === 'gzip' || enc === 'x-gzip') return zlib.gunzipSync(buffer);
    if (enc === 'deflate') return zlib.inflateSync(buffer);
    if (enc === 'br') return zlib.brotliDecompressSync(buffer);
  } catch {
  }
  return buffer;
}

function createResponse(incomingMessage, bodyBuffer) {
  const status = incomingMessage.statusCode || 0;
  const statusText = incomingMessage.statusMessage || '';
  const headersRaw = incomingMessage.headers || {};
  const decoded = decompressBuffer(bodyBuffer, headersRaw['content-encoding']);

  return {
    ok: status >= 200 && status < 300,
    status,
    statusText,
    headers: headersRaw,
    headersMap: new Map(Object.entries(headersRaw)),
    json: async () => JSON.parse(decoded.toString()),
    text: async () => decoded.toString(),
    buffer: decoded,
  };
}

function buildRequestHeaders(options = {}) {
  return {
    'User-Agent': 'ABSpider-CLI/2.1.1 (Authorized Security Scanner)',
    Accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
    'Accept-Encoding': 'gzip, deflate',
    ...(options.headers || {}),
  };
}

function createTunnel(proxyParsed, targetHost, targetPort, timeoutMs) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: proxyParsed.hostname,
      port: proxyParsed.port || 3128,
      method: 'CONNECT',
      path: `${targetHost}:${targetPort}`,
      headers: { Host: `${targetHost}:${targetPort}` },
      timeout: timeoutMs,
    });

    req.on('connect', (res, socket) => {
      if (res.statusCode === 200) {
        socket.setKeepAlive(true);
        socket.setNoDelay(true);
        resolve(socket);
      } else {
        socket.destroy();
        reject(new Error(`Proxy CONNECT refused: ${res.statusCode}`));
      }
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Proxy CONNECT timed out'));
    });
    req.end();
  });
}

function directRequest(urlStr, options = {}) {
  const parsed = new URL(urlStr);
  const isHttps = parsed.protocol === 'https:';
  const mod = isHttps ? https : http;

  return new Promise((resolve, reject) => {
    const req = mod.request(
      urlStr,
      {
        method: options.method || 'GET',
        headers: buildRequestHeaders(options),
        timeout: options.timeout || 30000,
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(createResponse(res, Buffer.concat(chunks))));
      },
    );
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });
    if (options.body) req.write(options.body);
    req.end();
  });
}

function proxyRequest(urlStr, options = {}) {
  const proxyParsed = getProxyConfig();
  const parsed = new URL(urlStr);
  const isHttps = parsed.protocol === 'https:';
  const timeoutMs = options.timeout || 30000;

  if (isHttps) {
    return (async () => {
      const socket = await createTunnel(proxyParsed, parsed.hostname, parsed.port || 443, timeoutMs);
      return new Promise((resolve, reject) => {
        const req = https.request({
          hostname: parsed.hostname,
          port: parsed.port || 443,
          path: parsed.pathname + parsed.search,
          method: options.method || 'GET',
          headers: buildRequestHeaders(options),
          socket,
          createConnection: () => socket,
          timeout: timeoutMs,
        }, (res) => {
          const chunks = [];
          res.on('data', (c) => chunks.push(c));
          res.on('end', () => resolve(createResponse(res, Buffer.concat(chunks))));
        });
        req.on('error', reject);
        req.on('timeout', () => {
          req.destroy();
          reject(new Error('Request timed out'));
        });
        if (options.body) req.write(options.body);
        req.end();
      });
    })();
  }

  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: proxyParsed.hostname,
      port: proxyParsed.port || 3128,
      path: urlStr,
      method: options.method || 'GET',
      headers: {
        ...buildRequestHeaders(options),
        Host: parsed.host,
        'Proxy-Connection': 'keep-alive',
      },
      timeout: timeoutMs,
    }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(createResponse(res, Buffer.concat(chunks))));
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });
    if (options.body) req.write(options.body);
    req.end();
  });
}

export async function httpFetch(urlStr, options = {}) {
  const proxyParsed = getProxyConfig();
  const parsed = new URL(urlStr);

  if (!proxyParsed || shouldBypassProxy(parsed.hostname)) {
    return directRequest(urlStr, options);
  }
  return proxyRequest(urlStr, options);
}

export async function httpFetchWithRetry(urlStr, options = {}) {
  const retries = options.retries ?? 2;
  const retryDelay = options.retryDelay ?? 1000;
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await httpFetch(urlStr, options);
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        const delay = retryDelay * (attempt + 1);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  const error = lastError || new Error('Request failed after retries');
  error.code = error.code || 'EREQUEST';
  error.statusCode = error.statusCode || 0;
  throw error;
}
