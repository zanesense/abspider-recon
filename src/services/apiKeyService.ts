interface APIKeys {
  shodan?: string;
  virustotal?: string;
  securitytrails?: string;
  builtwith?: string;
  hunter?: string;
  clearbit?: string;
  alexa?: string;
  moz?: string;
}

const API_KEYS_STORAGE = 'abspider-api-keys';

export const getAPIKeys = (): APIKeys => {
  try {
    const stored = localStorage.getItem(API_KEYS_STORAGE);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('[API Keys] Failed to load:', error);
    return {};
  }
};

export const saveAPIKeys = (keys: APIKeys) => {
  try {
    localStorage.setItem(API_KEYS_STORAGE, JSON.stringify(keys));
    console.log('[API Keys] Saved successfully');
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