import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Automatically clear stale/revoked refresh tokens to prevent repeated 400 errors.
// When the token refresh fails (SIGNED_OUT due to invalid refresh token),
// sign out cleanly so the client doesn't keep retrying with a bad token.
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED' && !session) {
    // Token refresh was attempted but resulted in no session — clear storage
    supabase.auth.signOut({ scope: 'local' });
  }
});