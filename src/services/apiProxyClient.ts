import { supabase } from '@/SupabaseClient';

async function getAuthToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token ?? null;
}

async function request(path: string, options?: RequestInit): Promise<Response> {
  const token = await getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(path, { ...options, headers });
}

export async function fetchAPIKeys(): Promise<Record<string, string>> {
  const resp = await request('/api/keys');
  if (!resp.ok) {
    const text = await resp.text().catch(() => 'Unknown error');
    throw new Error(`Failed to load API keys: ${resp.status} ${text}`);
  }
  const data = await resp.json();
  // Guard: server could return null or a non-object (e.g. on misconfiguration); treat as empty
  if (!data || typeof data !== 'object' || Array.isArray(data)) return {};
  return data as Record<string, string>;
}

export async function deleteAccount(): Promise<void> {
  const resp = await request('/api/account', { method: 'DELETE' });
  if (!resp.ok) {
    const text = await resp.text().catch(() => 'Unknown error');
    throw new Error(`Failed to delete account: ${resp.status} ${text}`);
  }
}

export async function saveAPIKeysToBackend(keys: Record<string, string>): Promise<void> {
  const resp = await request('/api/keys', {
    method: 'POST',
    body: JSON.stringify(keys),
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => 'Unknown error');
    throw new Error(`Failed to save API keys: ${resp.status} ${text}`);
  }
}

interface ProxyOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  api_key?: string;
}

export async function proxyProviderAPI(
  provider: string,
  url: string,
  options?: ProxyOptions,
): Promise<Response> {
  const { api_key, ...rest } = options ?? {};
  const payload: Record<string, any> = {
    provider,
    url,
    method: rest.method ?? 'GET',
    headers: rest.headers ?? {},
    body: rest.body,
  };
  if (api_key) payload.api_key = api_key;

  const resp = await request('/api/keys/proxy', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`[${provider}] Proxy request failed: ${resp.status} ${text}`);
  }
  return resp;
}

export async function proxyProviderJSON<T = any>(
  provider: string,
  url: string,
  options?: ProxyOptions,
): Promise<T> {
  const resp = await proxyProviderAPI(provider, url, options);
  return resp.json();
}
