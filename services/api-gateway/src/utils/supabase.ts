import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppError } from '../middleware/error.middleware.js';

let supabaseAdmin: SupabaseClient | null = null;

export function hasSupabaseConfig(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY);
}

export function getSupabaseAdmin(): SupabaseClient {
  if (!hasSupabaseConfig()) {
    throw new AppError('Supabase not configured', 500);
  }

  if (!supabaseAdmin) {
    supabaseAdmin = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );
  }

  return supabaseAdmin;
}

export function getOptionalSupabaseAdmin(): SupabaseClient | null {
  return hasSupabaseConfig() ? getSupabaseAdmin() : null;
}
