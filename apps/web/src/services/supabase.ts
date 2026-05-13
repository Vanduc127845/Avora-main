import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storage: {
          getItem: (key) => {
            try {
              return localStorage.getItem(key);
            } catch {
              return null;
            }
          },
          setItem: (key, value) => {
            try {
              localStorage.setItem(key, value);
            } catch {
              // Storage full or blocked
            }
          },
          removeItem: (key) => {
            try {
              localStorage.removeItem(key);
            } catch {
              // Ignore
            }
          },
        },
      },
    })
  : null;

if (!supabase) {
  console.warn('Supabase credentials not configured. OAuth login will not work.');
  console.warn('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env');
}

export type AuthProvider = 'google' | 'microsoft';

export const getOAuthRedirectUrl = (provider: AuthProvider) => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
  return `${apiUrl}/api/auth/oauth/${provider}`;
};

export const signInWithOAuth = async (provider: AuthProvider) => {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }
  
  const redirectTo = `${window.location.origin}/auth/callback`;
  const supabaseProvider = provider === 'microsoft' ? 'azure' : provider;
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: supabaseProvider,
    options: {
      redirectTo,
      scopes: provider === 'microsoft' ? 'openid profile email' : undefined,
    },
  });

  if (error) throw error;
  return data;
};

export const signOut = async () => {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getCurrentUser = async () => {
  if (!supabase) return null;
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

export const onAuthStateChange = (callback: (user: unknown) => void) => {
  if (!supabase) {
    return { data: { unsubscribe: () => {} } };
  }
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });
};
