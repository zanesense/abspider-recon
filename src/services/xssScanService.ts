import { normalizeUrl } from './apiUtils';
import { fetchWithBypass, CORSBypassMetadata } from './corsProxy';
import { RequestManager } from './requestManager'; // Import RequestManager

export interface XSSScanResult {
  vulnerable: boolean;
  testedPayloads: number;
  vulnerabilities: Array<{
    payload: string;
    location: string;
    severity: 'critical' | 'high' | 'medium' | 'low'; // Added 'critical'
    type: string;
    evidence?: string;
    parameter?: string;
    confidence: number;
  }>;
  tested: boolean;
  corsMetadata?: CORSBypassMetadata;
}

const XSS_PAYLOADS = [
  // --- Critical Execution Payloads ---
  { payload: '<script>alert(1)</script>', type: 'Script Tag', severity: 'critical' as const, confidence: 0.98 },
  { payload: '<img src=x onerror=alert(1)>', type: 'Event Handler (Img)', severity: 'critical' as const, confidence: 0.98 },
  { payload: '<svg onload=alert(1)>', type: 'SVG Event', severity: 'critical' as const, confidence: 0.98 },
  { payload: '"><script>alert(1)</script>', type: 'Attribute Break (Double Quote)', severity: 'critical' as const, confidence: 0.95 },
  { payload: '\'><script>alert(1)</script>', type: 'Attribute Break (Single Quote)', severity: 'critical' as const, confidence: 0.95 },
  { payload: '<iframe src="javascript:alert(1)">', type: 'Iframe Injection', severity: 'critical' as const, confidence: 0.95 },
  { payload: '<input autofocus onfocus=alert(1)>', type: 'Autofocus/Onfocus', severity: 'critical' as const, confidence: 0.95 },
  { payload: '<body onload=alert(1)>', type: 'Body Onload', severity: 'critical' as const, confidence: 0.95 },
  { payload: '";alert(1);//', type: 'JS Context Break (DOM)', severity: 'critical' as const, confidence: 0.95 },
  { payload: "';alert(1);//", type: 'JS Context Break (DOM)', severity: 'critical' as const, confidence: 0.95 },
  { payload: '<iframe srcdoc="<script>alert(1)</script>"></iframe>', type: 'Iframe srcdoc', severity: 'critical' as const, confidence: 0.95 },

  // --- High Evasion/Protocol Payloads ---
  { payload: 'javascript:alert(1)', type: 'JavaScript Protocol', severity: 'high' as const, confidence: 0.9 },
  { payload: '<a href="javascript:alert(1)">click</a>', type: 'Link JS Protocol', severity: 'high' as const, confidence: 0.9 },
  { payload: '<meta http-equiv="refresh" content="0;url=javascript:alert(1)">', type: 'Meta Refresh', severity: 'high' as const, confidence: 0.85 },
  { payload: '<video onerror=alert(1)><source src=1></video>', type: 'Media Onerror', severity: 'high' as const, confidence: 0.85 },
  { payload: '%3Cscript%3Ealert(1)%3C%2Fscript%3E', type: 'URL-encoded Script', severity: 'medium' as const, confidence: 0.75 },
  { payload: '&#x3C;script&#x3E;alert(1)&#x3C;/script&#x3E;', type: 'HTML Entity Encoded', severity: 'medium' as const, confidence: 0.75 },
];

const XSS_DANGEROUS_CONTEXTS = [
  // Inside a script tag where it could execute directly
  /<script[^>]*>[\s\S]*?PAYLOAD[\s\S]*?<\/script>/i,
  // Unquoted attribute value where payload can break out
  /<[^>]+\s+\w+=[^"'][^>\s]*?PAYLOAD/i,
  // Within an event handler attribute
  /on\w+\s*=\s*["']?[^"']*?PAYLOAD/i,
  // Within href/src attributes that support javascript: scheme
  /(href|src)\s*=\s*["']?(?:javascript|data):[^"']*?PAYLOAD/i,
  // Directly in HTML body where it can create new tags
  />[^<]*?PAYLOAD[^<]*?</i, // Matches payload between tags
  // Inside a comment that is improperly closed
  /<!--[\s\S]*?PAYLOAD[\s\S]*?-->/i,
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
  
  // 1. Check for direct reflection (unencoded)
  if (lowerResponse.includes(lowerPayload)) {
    const index = lowerResponse.indexOf(lowerPayload);
    const contextSnippet = response.substring(Math.max(0, index - 150), Math.min(response.length, index + payload.length + 150));
    
    let confidence = 0.7; // Default confidence for direct reflection (Raised from 0.5 to 0.7 for better detection)
    let contextType = 'Direct reflection in HTML (potential XSS)';
    
    // Check if in dangerous context
    let isDangerousContext = false;
    for (const pattern of XSS_DANGEROUS_CONTEXTS) {
      // Create a regex that matches the payload within the pattern
      const testPattern = pattern.source.replace('PAYLOAD', payload.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      if (new RegExp(testPattern, 'i').test(response)) {
        isDangerousContext = true;
        confidence = 0.95; // High confidence if in a dangerous context
        contextType = 'Direct reflection in dangerous HTML context (HIGH XSS risk)';
        break;
      }
    }
    
    return {
      reflected: true,
      context: contextType,
      evidence: contextSnippet.substring(0, 300),
      encoded: false,
      confidence: isDangerousContext ? 0.95 : 0.7, // Use 0.7 for general unencoded reflection
    };
  }

  // 2. Check for HTML encoded reflection (safe)
  const htmlEncodedPayload = payload
    .replace(/&/g, '&amp;') // Must be first
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
  
  if (response.includes(htmlEncodedPayload)) {
    return {
      reflected: true,
      context: 'HTML encoded (safe)',
      evidence: 'Payload properly HTML encoded',
      encoded: true,
      confidence: 0, // Not exploitable XSS
    };
  }

  // 3. Check for URL encoded reflection (safe)
  const urlEncodedPayload = encodeURIComponent(payload);
  if (response.includes(urlEncodedPayload)) {
    return {
      reflected: true,
      context: 'URL encoded (safe)',
      evidence: 'Payload URL encoded',
      encoded: true,
      confidence: 0, // Not exploitable XSS
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

export const performXSSScan = async (target: string, requestManager: RequestManager, payloadLimit: number = 20): Promise<XSSScanResult> => {
  console.log(`[XSS Scan] Starting REAL vulnerability scan for ${target} with ${payloadLimit} payloads`);
  
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
      paramKeys.push('q'); // Common search parameter
      urlObj.search = '?q=test'; // Add a default parameter for testing
    }

    const payloadsToTest = XSS_PAYLOADS.slice(0, payloadLimit);

    for (const paramKey of paramKeys) {
      for (const { payload, severity, type, confidence: baseConfidence } of payloadsToTest) {
        if (requestManager.scanController?.signal.aborted) {
          throw new Error('Scan aborted');
        }

        try {
          const testUrl = new URL(url);
          const testParams = new URLSearchParams(testUrl.search);
          const originalValue = testParams.get(paramKey) || 'test'; // Use a default value if param is empty
          
          testParams.set(paramKey, originalValue + payload);
          testUrl.search = testParams.toString();

          console.log(`[XSS Scan] Testing ${type} on '${paramKey}': ${payload.substring(0, 40)}...`);

          const testResult = await fetchWithBypass(testUrl.toString(), { timeout: 10000, signal: requestManager.scanController?.signal });
          if (!result.corsMetadata) {
            result.corsMetadata = testResult.metadata;
          }
          const response = testResult.response;
          result.testedPayloads++;

          const text = await response.text();
          const reflection = checkReflection(text, payload);

          if (reflection.reflected && !reflection.encoded && reflection.confidence >= 0.7) { // Only consider high confidence unencoded reflections
            console.log(`[XSS Scan] ⚠️ ${severity.toUpperCase()}: XSS vulnerability detected! Confidence: ${(reflection.confidence * 100).toFixed(0)}%`);
            
            // Check if this specific vulnerability (payload + parameter) has already been recorded
            const isDuplicate = result.vulnerabilities.some(v => v.parameter === paramKey && v.payload === payload);

            if (!isDuplicate) {
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
            }
          } else if (reflection.reflected && reflection.encoded) {
            console.log(`[XSS Scan] ℹ️ Payload reflected but safely encoded: ${paramKey}`);
          }

          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error: any) {
          if (error.message === 'Scan aborted') {
            throw error; // Re-throw if scan was aborted
          }
          console.warn(`[XSS Scan] Payload test failed for ${paramKey} with ${payload.substring(0, 20)}...: ${error.message}`);
        }
      }
    }

    // Filter out low confidence results
    result.vulnerabilities = result.vulnerabilities.filter(v => v.confidence >= 0.7);

    console.log(`[XSS Scan] Complete: ${result.vulnerabilities.length} high-confidence vulnerabilities from ${result.testedPayloads} tests`);
    return result;
  } catch (error: any) {
    if (error.message === 'Scan aborted') {
      throw error;
    }
    console.error('[XSS Scan] Critical error:', error);
    return {
      vulnerable: false,
      testedPayloads: 0,
      vulnerabilities: [],
      tested: false,
    };
  }
};