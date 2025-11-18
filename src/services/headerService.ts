import { normalizeUrl } from './apiUtils';
import { fetchWithBypass, CORSBypassMetadata } from './corsProxy';
import { RequestManager } from './requestManager'; // Import RequestManager

export interface SecurityHeader {
  name: string;
  value?: string;
  present: boolean;
  secure: boolean;
  recommendation?: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
}

export interface HeaderAnalysisResult {
  headers: Record<string, string>;
  statusCode: number;
  securityHeaders: {
    present: SecurityHeader[];
    missing: SecurityHeader[];
    score: number;
    grade: string;
  };
  technologies: string[];
  cookies: Array<{
    name: string;
    value: string;
    secure: boolean;
    httpOnly: boolean;
    sameSite?: 'Strict' | 'Lax' | 'None';
    domain?: string;
    path?: string;
    expires?: string;
    issues: string[];
  }>;
  cacheControl?: {
    present: boolean;
    directives: string[];
    issues: string[];
  };
  cors?: {
    enabled: boolean;
    allowOrigin?: string;
    allowMethods?: string;
    allowHeaders?: string;
    exposeHeaders?: string;
    allowCredentials?: boolean; // New
    maxAge?: number; // New
    issues: string[];
  };
  corsMetadata?: CORSBypassMetadata;
}

const SECURITY_HEADERS = [
  {
    name: 'Strict-Transport-Security',
    severity: 'critical' as const,
    recommendation: 'Enable HSTS with max-age of at least 31536000 seconds (1 year) and includeSubDomains',
    check: (value?: string) => {
      if (!value) return false;
      const maxAgeMatch = value.match(/max-age=(\d+)/i);
      const includeSubDomains = /includesubdomains/i.test(value);
      return maxAgeMatch && parseInt(maxAgeMatch[1]) >= 31536000 && includeSubDomains;
    }
  },
  {
    name: 'Content-Security-Policy',
    severity: 'critical' as const,
    recommendation: 'Implement a strict CSP to prevent XSS attacks and data injection. Start with a reporting-only policy.',
    check: (value?: string) => !!value && value.length > 20 && !/unsafe-inline|unsafe-eval/i.test(value)
  },
  {
    name: 'X-Frame-Options',
    severity: 'high' as const,
    recommendation: 'Set to DENY or SAMEORIGIN to prevent clickjacking attacks.',
    check: (value?: string) => value === 'DENY' || value === 'SAMEORIGIN'
  },
  {
    name: 'X-Content-Type-Options',
    severity: 'high' as const,
    recommendation: 'Set to nosniff to prevent MIME type sniffing attacks.',
    check: (value?: string) => value === 'nosniff'
  },
  {
    name: 'Referrer-Policy',
    severity: 'medium' as const,
    recommendation: 'Set to no-referrer, same-origin, or strict-origin-when-cross-origin to control referrer information leakage.',
    check: (value?: string) => ['no-referrer', 'same-origin', 'strict-origin-when-cross-origin'].includes(value || '')
  },
  {
    name: 'Permissions-Policy',
    severity: 'medium' as const,
    recommendation: 'Restrict browser features (e.g., camera, microphone) to prevent abuse by third-party content.',
    check: (value?: string) => !!value && value.length > 0
  },
  {
    name: 'X-XSS-Protection',
    severity: 'low' as const,
    recommendation: 'Set to 1; mode=block for legacy browser XSS protection (modern browsers use CSP).',
    check: (value?: string) => value === '1; mode=block'
  },
  {
    name: 'Cross-Origin-Embedder-Policy',
    severity: 'high' as const,
    recommendation: 'Set to require-corp to enable cross-origin isolation and powerful features like SharedArrayBuffer.',
    check: (value?: string) => value === 'require-corp'
  },
  {
    name: 'Cross-Origin-Opener-Policy',
    severity: 'high' as const,
    recommendation: 'Set to same-origin or same-origin-allow-popups to protect against cross-origin attacks.',
    check: (value?: string) => ['same-origin', 'same-origin-allow-popups'].includes(value || '')
  },
  {
    name: 'Cross-Origin-Resource-Policy',
    severity: 'medium' as const,
    recommendation: 'Set to same-origin or same-site to prevent other websites from loading your resources.',
    check: (value?: string) => ['same-origin', 'same-site'].includes(value || '')
  },
];

export const performFullHeaderAnalysis = async (
  target: string,
  requestManager: RequestManager
): Promise<HeaderAnalysisResult> => {
  console.log(`[Headers] Starting comprehensive analysis for ${target}`);
  
  try {
    const url = normalizeUrl(target);
    
    const fetchResult = await fetchWithBypass(url, { signal: requestManager.scanController?.signal }); // Pass signal
    const response = fetchResult.response;
    
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });
    
    console.log(`[Headers] Received ${Object.keys(headers).length} headers`);
    
    // Analyze security headers
    const present: SecurityHeader[] = [];
    const missing: SecurityHeader[] = [];
    let score = 0;
    
    for (const header of SECURITY_HEADERS) {
      const value = headers[header.name.toLowerCase()];
      const isPresent = !!value;
      const isSecure = isPresent ? header.check(value) : false;
      
      if (isPresent) {
        present.push({
          name: header.name,
          value,
          present: true,
          secure: isSecure,
          recommendation: isSecure ? undefined : header.recommendation,
          severity: header.severity,
        });
        
        if (isSecure) {
          score += header.severity === 'critical' ? 20 : header.severity === 'high' ? 15 : header.severity === 'medium' ? 10 : 5;
        } else {
          score += header.severity === 'critical' ? 5 : header.severity === 'high' ? 3 : 2;
        }
      } else {
        missing.push({
          name: header.name,
          present: false,
          secure: false,
          recommendation: header.recommendation,
          severity: header.severity,
        });
      }
    }
    
    const maxScore = SECURITY_HEADERS.reduce((sum, h) => 
      sum + (h.severity === 'critical' ? 20 : h.severity === 'high' ? 15 : h.severity === 'medium' ? 10 : 5), 0
    );
    
    const percentage = (score / maxScore) * 100;
    const grade = percentage >= 90 ? 'A+' : percentage >= 80 ? 'A' : percentage >= 70 ? 'B' : percentage >= 60 ? 'C' : percentage >= 50 ? 'D' : 'F';
    
    // Detect technologies (header-specific)
    const technologies: string[] = [];
    const server = headers['server'];
    if (server) technologies.push(server);
    
    const poweredBy = headers['x-powered-by'];
    if (poweredBy) technologies.push(poweredBy);

    const contentType = headers['content-type'];
    if (contentType?.includes('php')) technologies.push('PHP');
    if (contentType?.includes('asp.net')) technologies.push('ASP.NET');
    if (headers['x-generator']?.includes('WordPress')) technologies.push('WordPress');
    if (headers['x-drupal-cache']) technologies.push('Drupal');
    if (headers['x-shopify-stage']) technologies.push('Shopify');
    
    // Analyze cookies
    const cookies: HeaderAnalysisResult['cookies'] = [];
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      const cookieStrings = setCookieHeader.split(/,(?=\s*[a-zA-Z0-9_]+=)/g); // Split by comma, but not if it's part of a date
      
      for (const cookieStr of cookieStrings) {
        const parts = cookieStr.split(';').map(s => s.trim());
        const [nameValue] = parts;
        const [name, value] = nameValue.split('=');
        
        const secure = parts.some(p => p.toLowerCase() === 'secure');
        const httpOnly = parts.some(p => p.toLowerCase() === 'httponly');
        const sameSiteMatch = parts.find(p => p.toLowerCase().startsWith('samesite='));
        const sameSite = sameSiteMatch ? (sameSiteMatch.split('=')[1] as 'Strict' | 'Lax' | 'None') : undefined;
        const domainMatch = parts.find(p => p.toLowerCase().startsWith('domain='));
        const domain = domainMatch ? domainMatch.split('=')[1] : undefined;
        const pathMatch = parts.find(p => p.toLowerCase().startsWith('path='));
        const path = pathMatch ? pathMatch.split('=')[1] : undefined;
        const expiresMatch = parts.find(p => p.toLowerCase().startsWith('expires='));
        const expires = expiresMatch ? expiresMatch.split('=')[1] : undefined;
        
        const issues: string[] = [];
        if (!secure) issues.push('Missing Secure flag (cookie transmitted over HTTP)');
        if (!httpOnly) issues.push('Missing HttpOnly flag (cookie accessible via JavaScript)');
        if (!sameSite) issues.push('Missing SameSite attribute (vulnerable to CSRF)');
        else if (sameSite.toLowerCase() === 'none' && !secure) issues.push('SameSite=None requires Secure flag');
        
        cookies.push({ name, value, secure, httpOnly, sameSite, domain, path, expires, issues });
      }
    }
    
    // Analyze cache control
    const cacheControlHeader = headers['cache-control'];
    const cacheAnalysis = cacheControlHeader ? {
      present: true,
      directives: cacheControlHeader.split(',').map(d => d.trim()),
      issues: [] as string[],
    } : {
      present: false,
      directives: [],
      issues: ['Cache-Control header missing (may lead to unintended caching)'],
    };

    if (cacheAnalysis.present) {
      const directives = cacheAnalysis.directives.map(d => d.toLowerCase());
      if (directives.includes('no-store')) {
        // Good for sensitive data
      } else if (directives.includes('no-cache')) {
        // Requires revalidation
      } else if (directives.includes('private') && !directives.includes('no-cache') && !directives.includes('no-store')) {
        cacheAnalysis.issues.push('Private cache control without no-cache/no-store may still cache sensitive data in browser cache.');
      }
      if (!directives.includes('max-age') && !directives.includes('s-maxage')) {
        cacheAnalysis.issues.push('Missing max-age or s-maxage directive (cache duration not explicitly set).');
      }
      if (directives.includes('public') && (directives.includes('private') || directives.includes('no-cache') || directives.includes('no-store'))) {
        cacheAnalysis.issues.push('Conflicting public/private cache directives detected.');
      }
      if (directives.includes('must-revalidate') && !directives.includes('no-cache')) {
        cacheAnalysis.issues.push('Must-revalidate without no-cache might still serve stale content if origin is unreachable.');
      }
    }
    
    // Analyze CORS
    const corsOrigin = headers['access-control-allow-origin'];
    const corsMethods = headers['access-control-allow-methods'];
    const corsHeaders = headers['access-control-allow-headers'];
    const corsExposeHeaders = headers['access-control-expose-headers'];
    const corsAllowCredentials = headers['access-control-allow-credentials'] === 'true';
    const corsMaxAge = headers['access-control-max-age'] ? parseInt(headers['access-control-max-age']) : undefined;

    const corsAnalysis = {
      enabled: !!corsOrigin,
      allowOrigin: corsOrigin,
      allowMethods: corsMethods,
      allowHeaders: corsHeaders,
      exposeHeaders: corsExposeHeaders,
      allowCredentials: corsAllowCredentials,
      maxAge: corsMaxAge,
      issues: [] as string[],
    };
    
    if (corsOrigin === '*') {
      corsAnalysis.issues.push('CORS allows all origins (`*`) - potential security risk for sensitive resources.');
    }
    if (corsAllowCredentials && corsOrigin === '*') {
      corsAnalysis.issues.push('CORS allows credentials with wildcard origin (`*`) - CRITICAL security risk.');
    }
    if (corsMethods?.includes('*')) {
      corsAnalysis.issues.push('CORS allows all methods (`*`) - potential security risk.');
    }
    if (corsHeaders?.includes('*')) {
      corsAnalysis.issues.push('CORS allows all headers (`*`) - potential security risk.');
    }
    if (corsMaxAge !== undefined && corsMaxAge > 86400) { // Max-age typically 1 day (86400 seconds)
      corsAnalysis.issues.push(`CORS Max-Age is very high (${corsMaxAge}s) - preflight results cached for a long time.`);
    }
    
    console.log(`[Headers] Analysis complete - Grade: ${grade}, Score: ${score}/${maxScore}`);
    
    return {
      headers,
      statusCode: response.status,
      securityHeaders: {
        present,
        missing,
        score,
        grade,
      },
      technologies,
      cookies,
      cacheControl: cacheAnalysis,
      cors: corsAnalysis,
      corsMetadata: fetchResult.metadata,
    };
  } catch (error: any) {
    console.error('[Headers] Error:', error);
    throw new Error(error.message || 'Header analysis failed');
  }
};