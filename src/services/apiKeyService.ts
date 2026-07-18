import { fetchAPIKeys, saveAPIKeysToBackend } from './apiProxyClient';

export interface APIKeys {
  shodan?: string;
  virustotal?: string;
  securitytrails?: string;
  builtwith?: string;
  clearbit?: string;
  opencage?: string;
  hunterio?: string;
}

export const getAPIKeys = async (): Promise<APIKeys> => {
  const keys = await fetchAPIKeys();
  if (!keys || typeof keys !== 'object' || Array.isArray(keys)) return {};
  return keys as APIKeys;
};

export const saveAPIKeys = async (keys: APIKeys) => {
  try {
    await saveAPIKeysToBackend(keys as Record<string, string>);
    console.log('[API Keys] Saved successfully via backend proxy');
  } catch (error: any) {
    console.error('[API Keys] Failed to save via backend:', error.message);
    throw new Error(`Failed to save API keys: ${error.message}`, { cause: error });
  }
};
