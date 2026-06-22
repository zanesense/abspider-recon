import { extractDomain } from './apiUtils';
import { RequestManager } from './requestManager';

export interface CookieInfo {
  name: string;
  domain?: string;
  path?: string;
  secure: boolean;
  httpOnly: boolean;
  sameSite?: string;
  expires?: string;
  issues: string[];
}

export interface CookieAuditResult {
  cookies: CookieInfo[];
  totalCount: number;
  secureCount: number;
  httpOnlyCount: number;
  sameSiteCount: number;
  insecureCookies: number;
}

const parseSetCookie = (headerValue: string): Partial<CookieInfo> => {
  const parts = headerValue.split(';').map(p => p.trim());
  const nameValue = parts[0]?.split('=') || [];
  const name = nameValue[0] || 'unknown';

  const cookie: Partial<CookieInfo> = { name, secure: false, httpOnly: false, issues: [] };

  parts.slice(1).forEach(part => {
    const [key, ...vals] = part.split('=');
    const k = key.trim().toLowerCase();
    const v = vals.join('=').trim();

    if (k === 'secure') cookie.secure = true;
    else if (k === 'httponly') cookie.httpOnly = true;
    else if (k === 'samesite') {
      cookie.sameSite = v;
      if (!['lax', 'strict', 'none'].includes(v.toLowerCase())) {
        cookie.issues!.push(`Invalid SameSite value: ${v}`);
      }
    } else if (k === 'domain') cookie.domain = v;
    else if (k === 'path') cookie.path = v;
    else if (k === 'expires') cookie.expires = v;
  });

  if (!cookie.secure) cookie.issues!.push('Missing Secure flag');
  if (!cookie.httpOnly) cookie.issues!.push('Missing HttpOnly flag');
  if (!cookie.sameSite) cookie.issues!.push('Missing SameSite attribute');

  return cookie;
};

export const performCookieAudit = async (target: string, requestManager: RequestManager): Promise<CookieAuditResult> => {
  const domain = extractDomain(target);
  console.log(`[Cookie Audit] Starting for ${domain}`);

  const cookies: CookieInfo[] = [];

  try {
    const url = target.startsWith('http') ? target : `https://${target}`;
    const response = await requestManager.fetch(url, {
      timeout: 15000,
    });

    const setCookieHeaders: string[] = [];
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'set-cookie') {
        setCookieHeaders.push(value);
      }
    });

    setCookieHeaders.forEach(header => {
      const parsed = parseSetCookie(header);
      cookies.push(parsed as CookieInfo);
    });
  } catch (error) {
    console.warn(`[Cookie Audit] Failed to fetch cookies:`, error);
  }

  const secureCount = cookies.filter(c => c.secure).length;
  const httpOnlyCount = cookies.filter(c => c.httpOnly).length;
  const sameSiteCount = cookies.filter(c => !!c.sameSite).length;
  const insecureCookies = cookies.filter(c => c.issues.length > 0).length;

  return {
    cookies,
    totalCount: cookies.length,
    secureCount,
    httpOnlyCount,
    sameSiteCount,
    insecureCookies,
  };
};
