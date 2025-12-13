import { createClient } from '@supabase/supabase-js';

// Safe fallbacks to prevent "supabaseUrl is required" crash during initial setup
// We use a dummy URL if process.env values are missing.
const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'placeholder';

// Export a flag to check if we are truly connected
export const isSupabaseConfigured = !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);

if (!isSupabaseConfigured) {
  console.warn("Supabase credentials missing. App operating in limited mode (Guest only).");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);