import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppError } from '../middleware/error.middleware.js';

let supabaseAdmin: SupabaseClient | null = null;

const hasRealEnvValue = (value?: string | null) => {
  const trimmed = value?.trim();
  return Boolean(
    trimmed &&
      !/your-|change-this|placeholder/i.test(trimmed)
  );
};

const getSupabaseUrl = () =>
  hasRealEnvValue(process.env.SUPABASE_URL) ? process.env.SUPABASE_URL!.trim() : null;

const getSupabaseServiceKey = () =>
  hasRealEnvValue(process.env.SUPABASE_SERVICE_KEY) ? process.env.SUPABASE_SERVICE_KEY!.trim() : null;

const getSupabasePublicKey = () => {
  const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  return hasRealEnvValue(key) ? key!.trim() : null;
};

const createServerClient = (url: string, key: string) =>
  createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });

export function hasSupabaseConfig(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseServiceKey());
}

export function getSupabaseAdmin(): SupabaseClient {
  const url = getSupabaseUrl();
  const serviceKey = getSupabaseServiceKey();

  if (!url || !serviceKey) {
    throw new AppError('Supabase not configured', 500);
  }

  if (!supabaseAdmin) {
    supabaseAdmin = createServerClient(url, serviceKey);
  }

  return supabaseAdmin;
}

export function getOptionalSupabaseAdmin(): SupabaseClient | null {
  return hasSupabaseConfig() ? getSupabaseAdmin() : null;
}

export function getSupabaseAuthClient(): SupabaseClient {
  const url = getSupabaseUrl();
  const key = getSupabasePublicKey() || getSupabaseServiceKey();

  if (!url || !key) {
    throw new AppError('Supabase auth not configured', 500);
  }

  return createServerClient(url, key);
}

export function getOptionalSupabaseAuthClient(): SupabaseClient | null {
  return getSupabaseUrl() && (getSupabasePublicKey() || getSupabaseServiceKey())
    ? getSupabaseAuthClient()
    : null;
}
