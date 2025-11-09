import { normalizeUrl } from './apiUtils';
import { corsProxy } from './corsProxy';

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
    secure: boolean;
    httpOnly: boolean;
    sameSite?: string;
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
    issues: string[];
  };
}

const SECURITY_HEADERS = [
  {
    name: 'Strict-Transport-Security',
    severity: 'critical' as const,
    recommendation: 'Enable HSTS with max-age of at least 31536000 seconds (1 year)',
    check: (value?: string) => {
      if (!value) return false;
      const maxAge = value.match(/max-age=(\d+)/);
      return maxAge && parseInt(maxAge[1]) >= 31536000;
    }
  },
  {
    name: 'Content-Security-Policy',
    severity: 'critical' as const,
    recommendation: 'Implement a strict CSP to prevent XSS attacks',
    check: (value?: string) => !!value && value.length > 20
  },
  {
    name: 'X-Frame-Options',
    severity: 'high' as const,
    recommendation: 'Set to DENY or SAMEORIGIN to prevent clickjacking',
    check: (value?: string) => value === 'DENY' || value === 'SAMEORIGIN'
  },
  {
    name: 'X-Content-Type-Options',
    severity: 'high' as const,
    recommendation: 'Set to nosniff to prevent MIME type sniffing',
    check: (value?: string) => value === 'nosniff'
  },
  {
    name: 'Referrer-Policy',
    severity: 'medium' as const,
    recommendation: 'Set to no-referrer or strict-origin-when-cross-origin',
    check: (value?: string) => value === 'no-referrer' || value === 'strict-origin-when-cross-origin'
  },
  {
    name: 'Permissions-Policy',
    severity: 'medium' as const,
    recommendation: 'Restrict browser features to prevent abuse',
    check: (value?: string) => !!value
  },
  {
    name: 'X-XSS-Protection',
    severity: 'low' as const,
    recommendation: 'Set to 1; mode=block (legacy browsers)',
    check: (value?: string) => value === '1; mode=block'
  },
];

export const performFullHeaderAnalysis = async (
  target: string,
  useProxy: boolean = false
): Promise<HeaderAnalysisResult> => {
  console.log(`[Headers] Starting comprehensive analysis for ${target}`);
  
  try {
    const url = normalizeUrl(target);
    
    const response = await corsProxy.fetch(url);
    
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
      const isSecure = header.check(value);
      
      if (value) {
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
    
    // Detect technologies
    const technologies: string[] = [];
    const server = headers['server'];
    if (server) technologies.push(server);
    
    const poweredBy = headers['x-powered-by'];
    if (poweredBy) technologies.push(poweredBy);
    
    // Analyze cookies
    const cookies: Array<any> = [];
    const setCookie = headers['set-cookie'];
    if (setCookie) {
      const cookieStrings = Array.isArray(setCookie) ? setCookie : [setCookie];
      
      for (const cookieStr of cookieStrings) {
        const parts = cookieStr.split(';');
        const [nameValue] = parts;
        const [name] = nameValue.split('=');
        
        const secure = cookieStr.toLowerCase().includes('secure');
        const httpOnly = cookieStr.toLowerCase().includes('httponly');
        const sameSiteMatch = cookieStr.match(/samesite=(\w+)/i);
        const sameSite = sameSiteMatch ? sameSiteMatch[1] : undefined;
        
        const issues: string[] = [];
        if (!secure) issues.push('Missing Secure flag');
        if (!httpOnly) issues.push('Missing HttpOnly flag');
        if (!sameSite) issues.push('Missing SameSite attribute');
        
        cookies.push({ name, secure, httpOnly, sameSite, issues });
      }
    }
    
    // Analyze cache control
    const cacheControl = headers['cache-control'];
    const cacheAnalysis = cacheControl ? {
      present: true,
      directives: cacheControl.split(',').map(d => d.trim()),
      issues: [] as string[],
    } : {
      present: false,
      directives: [],
      issues: ['Cache-Control header missing'],
    };
    
    // Analyze CORS
    const corsOrigin = headers['access-control-allow-origin'];
    const corsMethods = headers['access-control-allow-methods'];
    const corsAnalysis = {
      enabled: !!corsOrigin,
      allowOrigin: corsOrigin,
      allowMethods: corsMethods,
      issues: [] as string[],
    };
    
    if (corsOrigin === '*') {
      corsAnalysis.issues.push('CORS allows all origins - potential security risk');
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
    };
  } catch (error: any) {
    console.error('[Headers] Error:', error);
    throw new Error(error.message || 'Header analysis failed');
  }
};