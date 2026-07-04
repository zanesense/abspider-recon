import { proxyProviderAPI } from './apiProxyClient';

interface APIKeyTestResult {
  success: boolean;
  message?: string;
}

async function testWithProxy(provider: string, url: string, apiKey: string): Promise<APIKeyTestResult> {
  if (!apiKey) return { success: false, message: 'API Key is missing.' };
  try {
    const response = await proxyProviderAPI(provider, url, { api_key: apiKey });
    const data = await response.json().catch(() => ({}));
    if (response.ok) {
      return { success: true, message: `${provider} API is valid.` };
    }
    return { success: false, message: data.error || `Invalid ${provider} API Key.` };
  } catch (error: any) {
    return { success: false, message: `${provider} API test failed: ${error.message}` };
  }
}

export const testShodanAPI = async (apiKey: string): Promise<APIKeyTestResult> =>
  testWithProxy('shodan', 'https://api.shodan.io/api-info', apiKey);

export const testVirusTotalAPI = async (apiKey: string): Promise<APIKeyTestResult> =>
  testWithProxy('virustotal', 'https://www.virustotal.com/vtapi/v2/url/report?resource=example.com', apiKey);

export const testSecurityTrailsAPI = async (apiKey: string): Promise<APIKeyTestResult> =>
  testWithProxy('securitytrails', 'https://api.securitytrails.com/v1/ping', apiKey);

export const testBuiltWithAPI = async (apiKey: string): Promise<APIKeyTestResult> =>
  testWithProxy('builtwith', 'https://api.builtwith.com/v1/api.json?lookup=example.com', apiKey);

export const testOpenCageAPI = async (apiKey: string): Promise<APIKeyTestResult> =>
  testWithProxy('opencage', 'https://api.opencagedata.com/geocode/v1/json?q=40.7128+-74.0060', apiKey);

export const testHunterAPI = async (apiKey: string): Promise<APIKeyTestResult> =>
  testWithProxy('hunterio', 'https://api.hunter.io/v2/email-verifier?email=test@example.com', apiKey);

export const testClearbitAPI = async (apiKey: string): Promise<APIKeyTestResult> =>
  testWithProxy('clearbit', 'https://company.clearbit.com/v1/companies/find?domain=google.com', apiKey);
