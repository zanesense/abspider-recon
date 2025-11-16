interface APIKeys {
  shodan?: string;
  virustotal?: string;
  securitytrails?: string;
  builtwith?: string;
  hunter?: string;
  clearbit?: string;
  opencage?: string;
}

const API_KEYS_STORAGE = 'abspider-api-keys';

export const getAPIKeys = (): APIKeys => {
  try {
    const stored = localStorage.getItem(API_KEYS_STORAGE);
    const keys = stored ? JSON.parse(stored) : {};
    if (Object.keys(keys).length > 0) {
      console.warn('[API Keys] WARNING: API keys are stored in client-side localStorage. This is INSECURE for private keys and should only be used for testing or public keys. Consider a secure backend for production.');
    }
    return keys;
  } catch (error) {
    console.error('[API Keys] Failed to load:', error);
    return {};
  }
};

export const saveAPIKeys = (keys: APIKeys) => {
  try {
    localStorage.setItem(API_KEYS_STORAGE, JSON.stringify(keys));
    console.log('[API Keys] Saved successfully');
    if (Object.keys(keys).length > 0) {
      console.warn('[API Keys] WARNING: API keys are stored in client-side localStorage. This is INSECURE for private keys and should only be used for testing or public keys. Consider a secure backend for production.');
    }
  } catch (error) {
    console.error('[API Keys] Failed to save:', error);
  }
};

export const getAPIKey = (service: keyof APIKeys): string | undefined => {
  const keys = getAPIKeys();
  return keys[service];
};

export const hasAPIKey = (service: keyof APIKeys): boolean => {
  const key = getAPIKey(service);
  return !!key && key.trim().length > 0;
};