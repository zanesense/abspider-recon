import { getAPIKey } from './apiKeyService';
import { corsProxy } from './corsProxy'; // Import corsProxy

interface APIKeyTestResult {
  success: boolean;
  message?: string;
}

const API_TEST_TIMEOUT = 15000; // 15 seconds timeout for API tests

export const testShodanAPI = async (apiKey: string): Promise<APIKeyTestResult> => {
  if (!apiKey) return { success: false, message: 'API Key is missing.' };
  try {
    const url = `https://api.shodan.io/api-info?key=${apiKey}`;
    const response = await corsProxy.fetch(url, { timeout: API_TEST_TIMEOUT });
    const data = await response.json();

    if (response.ok && data.query_credits !== undefined) {
      return { success: true, message: `Shodan API is valid. Credits: ${data.query_credits}` };
    } else {
      return { success: false, message: data.error || 'Invalid Shodan API Key.' };
    }
  } catch (error: any) {
    return { success: false, message: `Shodan API test failed: ${error.message}` };
  }
};

export const testVirusTotalAPI = async (apiKey: string): Promise<APIKeyTestResult> => {
  if (!apiKey) return { success: false, message: 'API Key is missing.' };
  try {
    const testUrl = 'example.com'; 
    const url = `https://www.virustotal.com/vtapi/v2/url/report?apikey=${apiKey}&resource=${testUrl}`;
    const response = await corsProxy.fetch(url, { timeout: API_TEST_TIMEOUT });
    const data = await response.json();

    if (response.ok && data.response_code !== undefined) {
      if (data.response_code === 1 || data.response_code === 0) {
        return { success: true, message: 'VirusTotal API is valid.' };
      } else {
        return { success: false, message: data.verbose_msg || 'Invalid VirusTotal API Key.' };
      }
    } else {
      return { success: false, message: data.error || 'Invalid VirusTotal API Key.' };
    }
  } catch (error: any) {
    return { success: false, message: `VirusTotal API test failed: ${error.message}` };
  }
};

export const testSecurityTrailsAPI = async (apiKey: string): Promise<APIKeyTestResult> => {
  if (!apiKey) return { success: false, message: 'API Key is missing.' };
  try {
    const url = `https://api.securitytrails.com/v1/ping`;
    const response = await corsProxy.fetch(url, {
      headers: { 'APIKEY': apiKey },
      timeout: API_TEST_TIMEOUT
    });
    const data = await response.json();

    if (response.ok && data.success === true) {
      return { success: true, message: 'SecurityTrails API is valid.' };
    } else {
      return { success: false, message: data.message || 'Invalid SecurityTrails API Key.' };
    }
  } catch (error: any) {
    return { success: false, message: `SecurityTrails API test failed: ${error.message}` };
  }
};

export const testBuiltWithAPI = async (apiKey: string): Promise<APIKeyTestResult> => {
  if (!apiKey) return { success: false, message: 'API Key is missing.' };
  try {
    const testDomain = 'example.com';
    const url = `https://api.builtwith.com/v1/api.json?key=${apiKey}&lookup=${testDomain}`;
    const response = await corsProxy.fetch(url, { timeout: API_TEST_TIMEOUT });
    const data = await response.json();

    if (response.ok && data.Results) {
      return { success: true, message: 'BuiltWith API is valid.' };
    } else {
      return { success: false, message: data.Errors?.[0]?.Message || 'Invalid BuiltWith API Key.' };
    }
  } catch (error: any) {
    return { success: false, message: `BuiltWith API test failed: ${error.message}` };
  }
};

export const testOpenCageAPI = async (apiKey: string): Promise<APIKeyTestResult> => {
  if (!apiKey) return { success: false, message: 'API Key is missing.' };
  try {
    const testLat = 40.7128;
    const testLon = -74.0060;
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${testLat}+${testLon}&key=${apiKey}`;
    const response = await corsProxy.fetch(url, { timeout: API_TEST_TIMEOUT });
    const data = await response.json();

    if (response.ok && data.results) {
      return { success: true, message: 'OpenCage API is valid.' };
    } else {
      return { success: false, message: data.status?.message || 'Invalid OpenCage API Key.' };
    }
  } catch (error: any) {
    return { success: false, message: `OpenCage API test failed: ${error.message}` };
  }
};

export const testHunterAPI = async (apiKey: string): Promise<APIKeyTestResult> => {
  if (!apiKey) return { success: false, message: 'API Key is missing.' };
  try {
    const testEmail = 'test@example.com';
    const url = `https://api.hunter.io/v2/email-verifier?email=${testEmail}&api_key=${apiKey}`;
    const response = await corsProxy.fetch(url, { timeout: API_TEST_TIMEOUT });
    const data = await response.json();

    if (response.ok && data.data) {
      return { success: true, message: 'Hunter.io API is valid.' };
    } else {
      return { success: false, message: data.errors?.[0]?.message || 'Invalid Hunter.io API Key.' };
    }
  } catch (error: any) {
    return { success: false, message: `Hunter.io API test failed: ${error.message}` };
  }
};

export const testClearbitAPI = async (apiKey: string): Promise<APIKeyTestResult> => {
  if (!apiKey) return { success: false, message: 'API Key is missing.' };
  try {
    const testDomain = 'google.com';
    const url = `https://company.clearbit.com/v1/companies/find?domain=${testDomain}`;
    const response = await corsProxy.fetch(url, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
      timeout: API_TEST_TIMEOUT
    });

    if (response.status === 200 || response.status === 404) {
      return { success: true, message: 'Clearbit API is valid.' };
    } else if (response.status === 401) {
      return { success: false, message: 'Invalid Clearbit API Key.' };
    } else {
      const data = await response.json().catch(() => ({}));
      return { success: false, message: data.error?.message || `Clearbit API test failed with status ${response.status}.` };
    }
  } catch (error: any) {
    return { success: false, message: `Clearbit API test failed: ${error.message}` };
  }
};