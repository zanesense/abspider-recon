import { supabase } from '@/SupabaseClient';

export interface UserPreferences {
  id?: string;
  user_id: string;
  theme: 'light' | 'dark' | 'system';
  language: string;
  auto_save: boolean;
  scan_history_limit: number;
  max_concurrent_scans: number;
  enable_notifications: boolean;
  enable_sounds: boolean;
  default_scan_profile: 'quick' | 'balanced' | 'comprehensive' | 'stealth';
  export_format: 'json' | 'csv' | 'pdf';
  retry_attempts: number;
  user_agent: string;
  created_at?: string;
  updated_at?: string;
}

export const getUserPreferences = async (userId: string): Promise<UserPreferences | null> => {
  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return null;
  }
};

export const saveUserPreferences = async (preferences: Omit<UserPreferences, 'id' | 'created_at' | 'updated_at'>): Promise<UserPreferences> => {
  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .upsert(preferences, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error saving user preferences:', error);
    throw error;
  }
};

export const deleteUserPreferences = async (userId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('user_preferences')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting user preferences:', error);
    throw error;
  }
};

export const getDefaultPreferences = (userId: string): Omit<UserPreferences, 'id' | 'created_at' | 'updated_at'> => {
  return {
    user_id: userId,
    theme: 'system',
    language: 'en',
    auto_save: true,
    scan_history_limit: 100,
    max_concurrent_scans: 3,
    enable_notifications: true,
    enable_sounds: false,
    default_scan_profile: 'balanced',
    export_format: 'json',
    retry_attempts: 3,
    user_agent: 'ABSpider/1.0 (Security Scanner)'
  };
};