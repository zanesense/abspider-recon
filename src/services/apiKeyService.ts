import { supabase } from '@/SupabaseClient';

interface APIKeys {
  shodan?: string;
  virustotal?: string;
  securitytrails?: string;
  builtwith?: string;
  clearbit?: string;
  opencage?: string;
}

// Define the structure for the Supabase table row
interface UserAPIKeysRow {
  user_id: string;
  api_keys: APIKeys;
}

export const getAPIKeys = async (): Promise<APIKeys> => {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (!session?.user) {
      console.warn('[API Keys] No active session, returning empty API keys.');
      return {};
    }

    const { data, error } = await supabase
      .from('user_api_keys')
      .select('api_keys')
      .eq('user_id', session.user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 means 'no rows found', which is fine
      throw error;
    }

    const keys = data?.api_keys || {};
    if (Object.keys(keys).length > 0) {
      console.warn('[API Keys] WARNING: API keys are stored in client-side accessible Supabase. This is INSECURE for private keys and should only be used for testing or public keys. Consider a secure backend for production.');
    }
    return keys;
  } catch (error: any) {
    console.error('[API Keys] Failed to load from Supabase:', error.message);
    return {};
  }
};

export const saveAPIKeys = async (keys: APIKeys) => {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (!session?.user) {
      throw new Error('No active user session to save API keys.');
    }

    const { error } = await supabase
      .from('user_api_keys')
      .upsert({ user_id: session.user.id, api_keys: keys } as UserAPIKeysRow, {
        onConflict: 'user_id',
      });

    if (error) throw error;

    console.log('[API Keys] Saved successfully to Supabase');
    if (Object.keys(keys).length > 0) {
      console.warn('[API Keys] WARNING: API keys are stored in client-side accessible Supabase. This is INSECURE for private keys and should only be used for testing or public keys. Consider a secure backend for production.');
    }
  } catch (error: any) {
    console.error('[API Keys] Failed to save to Supabase:', error.message);
    throw new Error(`Failed to save API keys: ${error.message}`);
  }
};

// The hasAPIKey function is no longer needed as keys will be passed directly
// export const hasAPIKey = async (service: keyof APIKeys): Promise<boolean> => {
//   const key = await getAPIKey(service);
//   return !!key && key.trim().length > 0;
// };