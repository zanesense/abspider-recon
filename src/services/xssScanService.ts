import { normalizeUrl } from './apiUtils';
import { fetchWithBypass, CORSBypassMetadata } from './corsProxy';
import { RequestManager } from './requestManager'; // Import RequestManager
import XSS_PAYLOADS_JSON from '@/payloads/xss.json'; // Import JSON

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

interface XSSPayload {
  payload: string;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  confidence: number;
}

// Use imported JSON payloads
const XSS_PAYLOADS: XSSPayload[] = XSS_PAYLOADS_JSON as XSSPayload[];

// Expanded and more specific dangerous contexts for XSS detection
const XSS_DANGEROUS_CONTEXTS = [
  // 1. Script tag context: direct execution
  /<script[^>]*>[\s\S]*?PAYLOAD[\s\S]*?<\/script>/i,
  // 2. Event handler attribute: e.g., onload, onerror, onclick, onmouseover
  /<[^>]+\s+on\w+\s*=\s*["']?[^"']*?PAYLOAD[^"']*?["']?/i,
  // 3. Unquoted attribute value: can break out with space or /
  /<[^>]+\s+\w+=[^"'][^>\s]*?PAYLOAD/i,
  // 4. href/src attributes with javascript: or data: URI schemes
  /(href|src)\s*=\s*["']?(?:javascript|data):[^"']*?PAYLOAD[^"']*?["']?/i,
  // 5. Style attribute with expression (IE specific, but good to detect)
  /<[^>]+\s+style\s*=\s*["']?[^"']*?expression\s*\([^)]*?PAYLOAD[^)]*\)[^"']*?["']?/i,
  // 6. Inside a <textarea> or <title> tag: can break out with </textarea> or </title>
  /<textarea[^>]*>[\s\S]*?PAYLOAD[\s\S]*?<\/textarea>/i,
  /<title[^>]*>[\s\S]*?PAYLOAD[\s\S]*?<\/title>/i,
  // 7. Inside a comment that is improperly closed: e.g., <!-- PAYLOAD -->
  /<!--[\s\S]*?PAYLOAD[\s\S]*?-->/i,
  // 8. Reflection directly in HTML body, allowing tag injection
  />[^<]*?PAYLOAD[^<]*?</i,
  // 9. Reflection in a <style> tag: can break out with </style>
  /<style[^>]*>[\s\S]*?PAYLOAD[\s\S]*?<\/style>/i,
  // 10. Reflection in a <noscript> tag: can break out with </noscript>
  /<noscript[^>]*>[\s\S]*?PAYLOAD[\s\S]*?<\/noscript>/i,
  // 11. Reflection in a DOM manipulation context (e.g., innerHTML, document.write)
  /document\.(write|innerhtml)\s*=\s*["']?[^"']*?PAYLOAD[^"']*?["']?/i,
  // 12. Reflection in a JSON context (can break out with "})
  /["']:\s*["']?[^"']*?PAYLOAD[^"']*?["']/i,
];

// Helper function to check if a string appears to be encoded
const isEncoded = (str: string): boolean => {
  // Check for common HTML entities
  if (str.includes('&lt;') || str.includes('&gt;') || str.includes('&quot;') || str.includes('&#x27;') || str.includes('&#39;') || str.includes('&#x')) {
    return true;
  }
  // Check for common URL encoding characters
  if (str.includes('%3C') || str.includes('%3E') || str.includes('%22') || str.includes('%27') || str.includes('%2F')) {
    return true;
  }
  // Check for common JavaScript string escapes (e.g., \x3c, \u003c)
  if (str.includes('\\x3c') || str.includes('\\x3e') || str.includes('\\\'') || str.includes('\\"') || str.includes('\\u003c') || str.includes('\\u003e')) {
    return true;
  }
  return false;
};

const checkReflection = (response: string, payload: string): {
  reflected: boolean;
  context: string; // More descriptive context
  evidence: string; // Snippet of where it was found
  exploitable: boolean; // True if unencoded in a dangerous context
  confidence: number; // Calculated confidence
  matchedPayload?: string; // The exact reflected string (could be encoded)
} => {
  const lowerResponse = response.toLowerCase();
  const lowerPayload = payload.toLowerCase();

  // Helper to get a snippet around an index
  const getSnippet = (text: string, index: number, length: number = 300) => {
    const start = Math.max(0, index - length / 2);
    const end = Math.min(text.length, index + payload.length + length / 2);
    return text.substring(start, end);
  };

  // --- 1. Check for direct, unencoded reflection ---
  let directIndex = lowerResponse.indexOf(lowerPayload);
  if (directIndex !== -1) {
    const matchedPayload = response.substring(directIndex, directIndex + payload.length);
    let confidence = 0.7; // Default for direct reflection
    let contextType = 'Direct reflection in HTML';
    let isDangerousContext = false;

    // Check if in dangerous context
    for (const pattern of XSS_DANGEROUS_CONTEXTS) {
      // Create a regex that matches the payload within the pattern
      const testPattern = pattern.source.replace('PAYLOAD', payload.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      if (new RegExp(testPattern, 'i').test(response)) {
        isDangerousContext = true;
        confidence = 0.95; // High confidence if in a dangerous context
        contextType = `Direct reflection in dangerous HTML context (HIGH XSS risk - matched: ${pattern.source.replace(/PAYLOAD/g, '...')})`;
        break;
      }
    }

    return {
      reflected: true,
      context: contextType,
      evidence: getSnippet(response, directIndex),
      exploitable: !isEncoded(matchedPayload), // Check if the matched payload is actually unencoded
      confidence: confidence,
      matchedPayload: matchedPayload,
    };
  }

  // --- 2. Check for encoded reflection (HTML entities, URL encoding, JS string encoding) ---
  const encodedPayloads = [
    payload
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;'), // HTML entities
    encodeURIComponent(payload), // URL encoding
    payload.replace(/'/g, '\\\'').replace(/"/g, '\\"').replace(/\//g, '\\/').replace(/</g, '\\x3c').replace(/>/g, '\\x3e'), // Basic JS string escaping
    payload.replace(/'/g, '\\\'').replace(/"/g, '\\"').replace(/\//g, '\\/').replace(/</g, '\\u003c').replace(/>/g, '\\u003e'), // Unicode JS string escaping
  ];

  for (const encoded of encodedPayloads) {
    let encodedIndex = lowerResponse.indexOf(encoded.toLowerCase());
    if (encodedIndex !== -1) {
      return {
        reflected: true,
        context: 'Payload reflected but safely encoded',
        evidence: getSnippet(response, encodedIndex),
        exploitable: false, // Not exploitable if properly encoded
        confidence: 0,
        matchedPayload: response.substring(encodedIndex, encodedIndex + encoded.length),
      };
    }
  }

  return {
    reflected: false,
    context: 'Not reflected',
    evidence: 'Payload not found in response',
    exploitable: false,
    confidence: 0,
  };
};

export const performXSSScan = async (target: string, requestManager: RequestManager, payloadLimit: number = 20): Promise<XSSScanResult> => {
  
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
      paramKeys.push('q'); // Common search parameter
      urlObj.search = '?q=test'; // Add a default parameter for testing
    }

    const payloadsToTest = XSS_PAYLOADS.slice(0, payloadLimit);

    for (const paramKey of paramKeys) {
      const originalValue = params.get(paramKey) || 'test'; // Use a default value if param is empty

      for (const { payload, severity, type, confidence: baseConfidence } of payloadsToTest) {
        if (requestManager.scanController?.signal.aborted) {
          throw new Error('Scan aborted');
        }

        try {
          const testUrl = new URL(url);
          const testParams = new URLSearchParams(testUrl.search);
          
          testParams.set(paramKey, originalValue + payload);
          testUrl.search = testParams.toString();

          const testResult = await fetchWithBypass(testUrl.toString(), { timeout: 10000, signal: requestManager.scanController?.signal });
          if (!result.corsMetadata) {
            result.corsMetadata = testResult.metadata;
          }
          const response = testResult.response;
          result.testedPayloads++;

          const text = await response.text();
          const reflection = checkReflection(text, payload);

          // Only consider reflections that are exploitable and have a minimum confidence
          if (reflection.reflected && reflection.exploitable && reflection.confidence >= 0.7) {
            
            // Check if this specific vulnerability (payload + parameter + type) has already been recorded
            const isDuplicate = result.vulnerabilities.some(v => 
              v.parameter === paramKey && v.payload === payload && v.type === type
            );

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
          } else if (reflection.reflected && !reflection.exploitable) {
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

    // Filter out low confidence results (e.g., only keep those >= 0.7)
    result.vulnerabilities = result.vulnerabilities.filter(v => v.confidence >= 0.7);
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