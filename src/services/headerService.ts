import { normalizeUrl } from './apiUtils';

export interface HeaderScanResult {
  headers: Record<string, string>;
  statusCode: number;
  server?: string;
  securityHeaders: {
    present: string[];
    missing: string[];
  };
  technologies: string[];
}

const SECURITY_HEADERS = [
  'strict-transport-security',
  'x-frame-options',
  'x-content-type-options',
  'content-security-policy',
  'x-xss-protection',
  'referrer-policy',
  'permissions-policy',
];

export const scanHeaders = async (
  target: string,
  useProxy: boolean = false
): Promise<HeaderScanResult> => {
  console.log(`[Header Scan] Starting scan for ${target}`);
  
  try {
    const url = normalizeUrl(target);
    console.log(`[Header Scan] Normalized URL: ${url}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('[Header Scan] Request timeout, aborting...');
      controller.abort();
    }, 15000);

    let response: Response;
    
    try {
      response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        redirect: 'follow',
        mode: 'no-cors',
      });
      clearTimeout(timeoutId);
      
      console.log(`[Header Scan] Response received with status: ${response.status}`);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      console.error('[Header Scan] Fetch error:', fetchError.message);
      
      if (fetchError.name === 'AbortError') {
        throw new Error('Request timeout after 15 seconds');
      }
      
      throw new Error(`Network error - site may block automated requests or have CORS restrictions`);
    }

    const headers: Record<string, string> = {};
    
    if (response.type === 'opaque') {
      console.warn('[Header Scan] Opaque response - CORS blocked, using fallback detection');
      
      headers['access-control-allow-origin'] = 'blocked';
      headers['note'] = 'CORS policy prevented header inspection';
    } else {
      response.headers.forEach((value, key) => {
        headers[key.toLowerCase()] = value;
      });
    }

    console.log(`[Header Scan] Retrieved ${Object.keys(headers).length} headers`);

    const presentHeaders = SECURITY_HEADERS.filter(h => 
      Object.keys(headers).includes(h)
    );
    
    const missingHeaders = SECURITY_HEADERS.filter(h => 
      !Object.keys(headers).includes(h)
    );

    const technologies: string[] = [];
    if (headers['server']) technologies.push(headers['server']);
    if (headers['x-powered-by']) technologies.push(headers['x-powered-by']);
    if (headers['x-aspnet-version']) technologies.push(`ASP.NET ${headers['x-aspnet-version']}`);

    return {
      headers,
      statusCode: response.status || 0,
      server: headers['server'],
      securityHeaders: {
        present: presentHeaders,
        missing: missingHeaders,
      },
      technologies,
    };
  } catch (error: any) {
    console.error('[Header Scan] Critical error:', error);
    throw error;
  }
};

export const performFullHeaderAnalysis = async (
  target: string,
  useProxy: boolean = false
): Promise<HeaderScanResult> => {
  try {
    const headResult = await scanHeaders(target, useProxy);
    
    console.log(`[Header Analysis] Complete for ${target}`);
    console.log(`[Header Analysis] Security Score: ${headResult.securityHeaders.present.length}/${SECURITY_HEADERS.length}`);
    
    return headResult;
  } catch (error: any) {
    console.error('[Header Analysis] Failed:', error);
    throw error;
  }
};