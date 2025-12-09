import { normalizeUrl } from './apiUtils';
import { fetchWithBypass, CORSBypassMetadata } from './corsProxy';
import { RequestManager } from './requestManager';
import SQL_PAYLOADS_JSON from '@/payloads/sqli.json'; // Import JSON

export interface SQLScanResult {
  vulnerable: boolean;
  testedPayloads: number;
  vulnerabilities: Array<{
    payload: string;
    indicator: string;
    severity: 'critical' | 'high' | 'medium' | 'low' | 'catastrophic';
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
  { pattern: /you have an error in your sql syntax/i, type: 'MySQL Error', confidence: 0.98 },
  { pattern: /warning.*mysql/i, type: 'MySQL Warning', confidence: 0.9 },
  { pattern: /valid mysql result/i, type: 'MySQL Result', confidence: 0.8 },
  { pattern: /mysqlclient\./i, type: 'MySQL Client', confidence: 0.8 },
  { pattern: /mysql_fetch/i, type: 'MySQL Function', confidence: 0.8 },
  { pattern: /mysql_num_rows/i, type: 'MySQL Function', confidence: 0.8 },
  { pattern: /mysqli/i, type: 'MySQLi Error', confidence: 0.9 },
  { pattern: /mysql_connect/i, type: 'MySQL Function', confidence: 0.8 },
  { pattern: /mysql_query/i, type: 'MySQL Function', confidence: 0.8 },
  
  // PostgreSQL
  { pattern: /postgresql.*error/i, type: 'PostgreSQL Error', confidence: 0.98 },
  { pattern: /pg_query/i, type: 'PostgreSQL Function', confidence: 0.8 },
  { pattern: /pg_exec/i, type: 'PostgreSQL Function', confidence: 0.8 },
  { pattern: /unterminated quoted string/i, type: 'PostgreSQL Syntax Error', confidence: 0.95 },
  { pattern: /syntax error at or near/i, type: 'PostgreSQL Syntax Error', confidence: 0.95 },
  { pattern: /pg_connect/i, type: 'PostgreSQL Function', confidence: 0.8 },
  
  // MSSQL
  { pattern: /microsoft sql server/i, type: 'MSSQL Error', confidence: 0.98 },
  { pattern: /odbc sql server driver/i, type: 'MSSQL Driver Error', confidence: 0.9 },
  { pattern: /sqlserver jdbc driver/i, type: 'MSSQL Driver Error', confidence: 0.9 },
  { pattern: /microsoft ole db provider for sql server/i, type: 'MSSQL Provider Error', confidence: 0.9 },
  { pattern: /unclosed quotation mark after the character string/i, type: 'MSSQL Syntax Error', confidence: 0.95 },
  { pattern: /incorrect syntax near/i, type: 'MSSQL Syntax Error', confidence: 0.95 },
  
  // Oracle
  { pattern: /ora-\d{5}/i, type: 'Oracle Error Code', confidence: 0.98 },
  { pattern: /oracle error/i, type: 'Oracle Error', confidence: 0.95 },
  { pattern: /quoted string not properly terminated/i, type: 'Oracle Syntax Error', confidence: 0.95 },
  { pattern: /missing expression/i, type: 'Oracle Syntax Error', confidence: 0.95 },
  
  // SQLite
  { pattern: /sqlite.*error/i, type: 'SQLite Error', confidence: 0.98 },
  { pattern: /sqlite3::/i, type: 'SQLite Function', confidence: 0.8 },
  { pattern: /unrecognized token/i, type: 'SQLite Syntax Error', confidence: 0.95 },
  { pattern: /syntax error near/i, type: 'SQLite Syntax Error', confidence: 0.95 },
  
  // Generic
  { pattern: /sql syntax.*error/i, type: 'Generic SQL Syntax Error', confidence: 0.9 },
  { pattern: /syntax error.*sql/i, type: 'Generic SQL Syntax Error', confidence: 0.9 },
  { pattern: /unclosed quotation mark/i, type: 'Generic Syntax Error', confidence: 0.85 },
  { pattern: /quoted identifier/i, type: 'Generic Syntax Error', confidence: 0.8 },
  { pattern: /database error/i, type: 'Generic Database Error', confidence: 0.8 },
  { pattern: /query failed/i, type: 'Generic Query Failure', confidence: 0.8 },
  { pattern: /driver error/i, type: 'Generic Driver Error', confidence: 0.7 },
  { pattern: /connection refused/i, type: 'Connection Error', confidence: 0.6 },
];

type Severity = 'critical' | 'high' | 'medium' | 'low' | 'catastrophic';

interface SQLPayload {
  payload: string;
  type: string;
  severity: Severity;
  confidence: number;
}

// Use imported JSON payloads
const SQL_PAYLOADS: SQLPayload[] = SQL_PAYLOADS_JSON as SQLPayload[];

// Helper to extract a relevant snippet of evidence
const getEvidenceSnippet = (fullText: string, indicator: string, maxLength: number = 300): string => {
  const lowerFullText = fullText.toLowerCase();
  const lowerIndicator = indicator.toLowerCase();
  const index = lowerFullText.indexOf(lowerIndicator);
  if (index !== -1) {
    const start = Math.max(0, index - 100);
    const end = Math.min(fullText.length, index + indicator.length + 100);
    return fullText.substring(start, end).substring(0, maxLength) + (fullText.length > maxLength ? '...' : '');
  }
  return fullText.substring(0, maxLength) + (fullText.length > maxLength ? '...' : '');
};

const testTimeBased = async (url: string, requestManager: RequestManager): Promise<{ vulnerable: boolean; duration: number }> => {
  const startTime = Date.now();
  const expectedDelay = 5000; // 5 seconds delay in payload
  const timeout = expectedDelay + 3000; // Set timeout slightly longer than expected delay
  
  try {
    await requestManager.fetch(url, { timeout }); 
    const duration = Date.now() - startTime;
    return { vulnerable: duration >= expectedDelay - 500, duration };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    if (error.message.includes('Request aborted') && duration >= expectedDelay - 500) {
      return { vulnerable: true, duration };
    }
    return { vulnerable: false, duration };
  }
};

const checkSQLError = (text: string): { found: boolean; pattern?: string; type?: string; confidence: number } => {
  for (const { pattern, type, confidence } of SQL_ERROR_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      return {
        found: true,
        pattern: match[0], // Return the actual matched string
        type,
        confidence,
      };
    }
  }
  return { found: false, confidence: 0 };
};

// New function for Boolean-based Blind SQLi detection
const testBooleanBlind = async (
  baseUrl: string,
  paramKey: string,
  originalValue: string,
  requestManager: RequestManager,
  baselineResponseText: string,
  baselineLength: number,
  baselineStatus: number
): Promise<{ vulnerable: boolean; indicator?: string; confidence: number; evidence?: string }> => {
  const truePayload = " AND 1=1--"; // Example payload for true condition
  const falsePayload = " AND 1=0--"; // Example payload for false condition

  let trueResponseText = '';
  let falseResponseText = '';
  let trueResponseStatus = 0;
  let falseResponseStatus = 0;
  let trueResponseLength = 0;
  let falseResponseLength = 0;

  try {
    // Test with true condition
    const trueTestUrl = new URL(baseUrl);
    const trueTestParams = new URLSearchParams(trueTestUrl.search);
    trueTestParams.set(paramKey, originalValue + truePayload);
    trueTestUrl.search = trueTestParams.toString();
    const trueResult = await requestManager.fetch(trueTestUrl.toString(), { timeout: 10000 });
    trueResponseText = await trueResult.text();
    trueResponseStatus = trueResult.status;
    trueResponseLength = trueResponseText.length;

    // Test with false condition
    const falseTestUrl = new URL(baseUrl);
    const falseTestParams = new URLSearchParams(falseTestUrl.search);
    falseTestParams.set(paramKey, originalValue + falsePayload);
    falseTestUrl.search = falseTestParams.toString();
    const falseResult = await requestManager.fetch(falseTestUrl.toString(), { timeout: 10000 });
    falseResponseText = await falseResult.text();
    falseResponseStatus = falseResult.status;
    falseResponseLength = falseResponseText.length;

    // Compare responses
    // Heuristic 1: Different HTTP status codes
    if (trueResponseStatus !== falseResponseStatus) {
      return {
        vulnerable: true,
        indicator: `Different HTTP status codes for TRUE (${trueResponseStatus}) vs FALSE (${falseResponseStatus}) conditions.`,
        confidence: 0.9,
        evidence: `True status: ${trueResponseStatus}, False status: ${falseResponseStatus}`,
      };
    }

    // Heuristic 2: Significant difference in content length
    const lengthDiff = Math.abs(trueResponseLength - falseResponseLength);
    const minSignificantLengthDiff = Math.max(50, baselineLength * 0.1); // At least 50 bytes or 10% of baseline
    if (lengthDiff > minSignificantLengthDiff) {
      return {
        vulnerable: true,
        indicator: `Significant content length difference for TRUE (${trueResponseLength} bytes) vs FALSE (${falseResponseLength} bytes) conditions.`,
        confidence: 0.85,
        evidence: `True length: ${trueResponseLength}, False length: ${falseResponseLength}, Baseline length: ${baselineLength}`,
      };
    }

    // Heuristic 3: Different content (more robust than just length)
    if (trueResponseText !== falseResponseText) {
      // This is a strong indicator if length is similar but content differs
      return {
        vulnerable: true,
        indicator: `Content differs for TRUE vs FALSE conditions.`,
        confidence: 0.8,
        evidence: `True response snippet: ${trueResponseText.substring(0, 100)}..., False response snippet: ${falseResponseText.substring(0, 100)}...`,
      };
    }

  } catch (error: any) {
    console.warn(`[SQL Scan] Boolean blind test failed for parameter ${paramKey}: ${error.message}`);
  }
  return { vulnerable: false, confidence: 0 };
};


export const performSQLScan = async (target: string, requestManager: RequestManager, payloadLimit: number = 20): Promise<SQLScanResult> => {
  console.log(`[SQL Scan] Starting comprehensive vulnerability scan for ${target} with ${payloadLimit} payloads`);
  
  const result: SQLScanResult = {
    vulnerable: false,
    testedPayloads: 0,
    vulnerabilities: [],
    tested: true,
    method: 'Error-based, Time-based, Boolean Blind, and Heuristic Analysis',
  };

  try {
    const url = normalizeUrl(target);
    const urlObj = new URL(url);
    
    const params = new URLSearchParams(urlObj.search);
    const paramKeys = Array.from(params.keys());
    
    if (paramKeys.length === 0) {
      console.log('[SQL Scan] No parameters found, testing with default parameter "id"');
      paramKeys.push('id');
      urlObj.search = '?id=1'; // Add a default parameter for testing
    }

    // Get baseline response for comparison
    let baselineResponseText = '';
    let baselineStatus = 0;
    let baselineLength = 0;
    
    try {
      const baselineResult = await fetchWithBypass(url, { timeout: 10000, signal: requestManager.scanController?.signal });
      result.corsMetadata = baselineResult.metadata;
      baselineResponseText = await baselineResult.response.text();
      baselineStatus = baselineResult.response.status;
      baselineLength = baselineResponseText.length;
      console.log(`[SQL Scan] Baseline: Status ${baselineStatus}, Length ${baselineLength} bytes`);
    } catch (error) {
      console.warn('[SQL Scan] Could not get baseline response, continuing without it for some heuristics.');
    }

    const payloadsToTest = SQL_PAYLOADS.slice(0, payloadLimit);

    for (const paramKey of paramKeys) {
      const originalValue = params.get(paramKey) || '1'; // Use '1' as a default value for parameters

      // Perform Boolean-based Blind SQLi test first for this parameter
      const booleanBlindResult = await testBooleanBlind(url, paramKey, originalValue, requestManager, baselineResponseText, baselineLength, baselineStatus);
      if (booleanBlindResult.vulnerable) {
        console.log(`[SQL Scan] ⚠️ CRITICAL: Boolean-based Blind SQLi detected on parameter '${paramKey}'`);
        result.vulnerable = true;
        result.vulnerabilities.push({
          payload: originalValue + " AND [BOOLEAN CONDITION]--",
          indicator: booleanBlindResult.indicator || 'Boolean-based content/status difference',
          severity: 'critical',
          type: 'Boolean-based Blind',
          evidence: booleanBlindResult.evidence || 'Response differences based on boolean conditions',
          parameter: paramKey,
          confidence: booleanBlindResult.confidence,
        });
      }

      for (const { payload, severity, type, confidence: baseConfidence } of payloadsToTest) {
        if (requestManager.scanController?.signal.aborted) {
          throw new Error('Scan aborted');
        }

        try {
          const testUrl = new URL(url);
          const testParams = new URLSearchParams(testUrl.search);
          
          testParams.set(paramKey, originalValue + payload);
          testUrl.search = testParams.toString();

          console.log(`[SQL Scan] Testing ${type} on '${paramKey}': ${payload.substring(0, 30)}...`);

          // Time-based testing
          if (type.includes('Time-based Blind')) {
            const { vulnerable, duration } = await testTimeBased(testUrl.toString(), requestManager);
            
            if (vulnerable) {
              console.log(`[SQL Scan] ⚠️ CRITICAL: Time-based SQL injection confirmed (${duration}ms delay)`);
              result.vulnerable = true;
              result.vulnerabilities.push({
                payload,
                indicator: `Response delayed by ${duration}ms (Expected ~5000ms)`,
                severity: 'critical',
                type,
                evidence: `Server response time: ${duration}ms`,
                parameter: paramKey,
                confidence: 1.0,
              });
            }
            result.testedPayloads++;
            await new Promise(resolve => setTimeout(resolve, 500)); // Small delay after time-based test
            continue; // Move to next payload
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
            
            const evidence = getEvidenceSnippet(text, errorCheck.pattern!);
            
            result.vulnerabilities.push({
              payload,
              indicator: errorCheck.pattern!,
              severity,
              type: errorCheck.type || type, // Use more specific type if available
              evidence: evidence,
              parameter: paramKey,
              confidence: errorCheck.confidence,
            });
          }

          // Heuristic: Check for status code changes (e.g., 500 Internal Server Error)
          if (baselineStatus > 0 && response.status !== baselineStatus && response.status >= 500) {
            console.log(`[SQL Scan] ⚠️ Server error detected (${response.status})`);
            if (!result.vulnerabilities.some(v => v.parameter === paramKey && v.payload === payload && v.indicator.includes('HTTP'))) {
              result.vulnerable = true;
              result.vulnerabilities.push({
                payload,
                indicator: `HTTP ${response.status} error`,
                severity: 'high',
                type: 'Server Error Heuristic',
                evidence: `Server returned ${response.status} (baseline: ${baselineStatus})`,
                parameter: paramKey,
                confidence: 0.85,
              });
            }
          }

          // Heuristic: Check for significant content changes (Union-based, or other blind techniques)
          if (baselineLength > 0 && text !== baselineResponseText) {
            const sizeDiff = Math.abs(text.length - baselineLength);
            const percentDiff = (sizeDiff / baselineLength) * 100;
            
            // Consider a change significant if it's more than 20% or a large absolute difference
            if (percentDiff > 20 || sizeDiff > 500) { 
              console.log(`[SQL Scan] ⚠️ Suspicious content change: ${percentDiff.toFixed(1)}%`);
              if (!result.vulnerabilities.some(v => v.parameter === paramKey && v.payload === payload && v.indicator.includes('content length'))) {
                result.vulnerable = true;
                result.vulnerabilities.push({
                  payload,
                  indicator: 'Content length changed significantly',
                  severity: 'medium', 
                  type: 'Content Change Heuristic',
                  evidence: `Response size: ${text.length} bytes (baseline: ${baselineLength}, diff: ${percentDiff.toFixed(1)}%)`,
                  parameter: paramKey,
                  confidence: 0.75,
                });
              }
            }
          }

          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error: any) {
          if (error.message === 'Scan aborted') {
            throw error;
          }
          console.warn(`[SQL Scan] Payload test failed for ${paramKey} with ${payload.substring(0, 20)}...: ${error.message}`);
        }
      }
    }

    // Deduplicate vulnerabilities based on payload, parameter, and type
    const uniqueVulnerabilities: typeof result.vulnerabilities = [];
    const seen = new Set<string>();
    for (const vuln of result.vulnerabilities) {
      const key = `${vuln.parameter}-${vuln.payload}-${vuln.type}`;
      if (!seen.has(key)) {
        uniqueVulnerabilities.push(vuln);
        seen.add(key);
      }
    }
    result.vulnerabilities = uniqueVulnerabilities;

    // Filter out low confidence results (e.g., only keep those >= 0.7)
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