import { createClient } from '@supabase/supabase-js';

// Helper to safely access environment variables in various environments (Vite, Next.js, CRA)
const getEnv = (key: string) => {
  // 1. Check for Vite's import.meta.env (Standard for Vercel/Vite)
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    // @ts-ignore
    return import.meta.env[`VITE_${key}`] || import.meta.env[key];
  }
  
  // 2. Check for standard process.env (Node/CRA)
  try {
    if (typeof process !== 'undefined' && process.env) {
      return process.env[key];
    }
  } catch (e) {
    // Ignore ReferenceError if process is not defined
  }

  return '';
};

// Safe accessors
const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');

// Export a flag to check if we are truly connected
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn("Supabase credentials missing. App operating in limited mode (Guest only).");
  console.info("To enable cloud features, add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables.");
}

// Initialize client (use placeholders if not configured to prevent crash)
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder'
);
