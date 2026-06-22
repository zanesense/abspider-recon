import { extractDomain, extractHostname } from './apiUtils';
import { RequestManager } from './requestManager';

const API_KEY_PATTERNS: RegExp[] = [
  /(?:['"`])(?:api[_-]?key|apikey|api_secret|apiSecret|secret|token|access_token|bearer)\s*[:=]\s*['"`]([^'"`]{8,})['"`]/gi,
  /AIza[0-9A-Za-z_-]{35}(?:['"`])?/g,
  /sk-[0-9a-zA-Z]{32,}/g,
  /(?:xox[abpore]-)[a-zA-Z0-9-]{10,}/g,
  /ghp_[a-zA-Z0-9]{36}/g,
  /gho_[a-zA-Z0-9]{36}/g,
  /ghu_[a-zA-Z0-9]{36}/g,
  /AKIA[0-9A-Z]{16}/g,
  /eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/g,
];

const ENDPOINT_PATTERNS: RegExp[] = [
  /['"`](\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.\/-]+(?:\.json|\.xml|\.php)?)['"`]/g,
  /(?:url|path|route|endpoint)\s*[=:]\s*['"`]([^'"`]{2,})['"`]/gi,
];

const INTERNAL_PATH_PATTERNS: RegExp[] = [
  /(?:from|require|import)\s*['"`]\.\.?\/[^'"`]+['"`]/g,
  /['"`](\.\.?\/[^'"`]{2,})['"`]/g,
];

export interface JSFileAnalysis {
  url: string;
  size: number;
  endpoints: string[];
  apiKeys: string[];
  internalPaths: string[];
}

export interface JSInspectionResult {
  files: JSFileAnalysis[];
  totalFiles: number;
  totalEndpoints: number;
  totalApiKeys: number;
}

const extractScriptSrcs = (html: string): string[] => {
  const scriptRegex = /<script[^>]*src\s*=\s*["']([^"']+)["'][^>]*>/gi;
  const srcs: string[] = [];
  let match;
  while ((match = scriptRegex.exec(html)) !== null) {
    srcs.push(match[1]);
  }
  return srcs;
};

const resolveUrl = (base: string, path: string): string => {
  try {
    return new URL(path, base).href;
  } catch {
    return path;
  }
};

const analyzeJS = (content: string, fileName: string): { endpoints: string[]; apiKeys: string[]; internalPaths: string[] } => {
  const endpoints = new Set<string>();
  const apiKeys = new Set<string>();
  const internalPaths = new Set<string>();

  API_KEY_PATTERNS.forEach(pattern => {
    const matches = content.matchAll(pattern);
    for (const m of matches) {
      const key = m[1] || m[0];
      if (key.length < 200) apiKeys.add(key.substring(0, 100));
    }
  });

  ENDPOINT_PATTERNS.forEach(pattern => {
    const matches = content.matchAll(pattern);
    for (const m of matches) {
      const ep = m[1];
      if (ep.length < 100 && !ep.startsWith('//')) endpoints.add(ep);
    }
  });

  INTERNAL_PATH_PATTERNS.forEach(pattern => {
    const matches = content.matchAll(pattern);
    for (const m of matches) {
      const p = m[1];
      if (p.length < 100) internalPaths.add(p);
    }
  });

  return {
    endpoints: Array.from(endpoints).slice(0, 50),
    apiKeys: Array.from(apiKeys).slice(0, 20),
    internalPaths: Array.from(internalPaths).slice(0, 30),
  };
};

export const performJSInspection = async (target: string, requestManager: RequestManager): Promise<JSInspectionResult> => {
  const domain = extractDomain(target);
  console.log(`[JS Analysis] Starting for ${domain}`);

  const url = target.startsWith('http') ? target : `https://${target}`;
  const files: JSFileAnalysis[] = [];

  try {
    const response = await requestManager.fetch(url, { timeout: 15000 });
    const html = await response.text();

    const scriptSrcs = extractScriptSrcs(html);

    // Analyze inline scripts too
    const inlineScriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
    let inlineMatch;
    let inlineContent = '';
    while ((inlineMatch = inlineScriptRegex.exec(html)) !== null) {
      inlineContent += inlineMatch[1] + '\n';
    }

    if (inlineContent.length > 50) {
      const analysis = analyzeJS(inlineContent, 'inline');
      if (analysis.endpoints.length > 0 || analysis.apiKeys.length > 0 || analysis.internalPaths.length > 0) {
        files.push({
          url: 'inline-scripts',
          size: inlineContent.length,
          ...analysis,
        });
      }
    }

    const fetched = new Set<string>();
    for (const src of scriptSrcs.slice(0, 20)) {
      const jsUrl = resolveUrl(url, src);
      if (fetched.has(jsUrl)) continue;
      fetched.add(jsUrl);

      try {
        const jsResponse = await requestManager.fetch(jsUrl, { timeout: 10000 });
        const content = await jsResponse.text();
        const analysis = analyzeJS(content, jsUrl);

        if (analysis.endpoints.length > 0 || analysis.apiKeys.length > 0 || analysis.internalPaths.length > 0) {
          files.push({
            url: jsUrl,
            size: content.length,
            ...analysis,
          });
        }
      } catch {
        // skip failed JS fetches
      }
    }
  } catch (error) {
    console.warn(`[JS Analysis] Failed:`, error);
  }

  return {
    files,
    totalFiles: files.length,
    totalEndpoints: files.reduce((s, f) => s + f.endpoints.length, 0),
    totalApiKeys: files.reduce((s, f) => s + f.apiKeys.length, 0),
  };
};
