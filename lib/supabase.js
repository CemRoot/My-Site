/**
 * Supabase Client Configuration
 * Used for newsletter subscription storage
 */

import { createClient } from '@supabase/supabase-js';

// Get Supabase configuration from environment variables
// Support both Vite and Next.js environment variable naming
// With production fallback values (public URLs/keys only - safe to expose)
const supabaseUrl = 
  import.meta.env?.VITE_SUPABASE_URL || 
  process.env?.NEXT_PUBLIC_SUPABASE_URL || 
  import.meta.env?.VITE_PUBLIC_SUPABASE_URL ||
  'https://egehpwmjvvabyvfilehd.supabase.co'; // Production fallback

const supabaseAnonKey = 
  import.meta.env?.VITE_SUPABASE_ANON_KEY || 
  process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  import.meta.env?.VITE_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnZWhwd21qdnZhYnl2ZmlsZWhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyMDcwODgsImV4cCI6MjA3NTc4MzA4OH0.fxwjdP9JtlIUVXVz6UwGej6O2H9C-Kz0YhjApcZeRjo'; // Production fallback

const supabaseServiceKey = 
  import.meta.env?.VITE_SUPABASE_SERVICE_ROLE_KEY || 
  process.env?.SUPABASE_SERVICE_ROLE_KEY;

// Debug logging in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('Supabase Config Debug:', {
    url: supabaseUrl ? 'SET' : 'NOT SET',
    key: supabaseAnonKey ? 'SET' : 'NOT SET',
    source: import.meta.env?.VITE_SUPABASE_URL ? 'VITE_ENV' : 'FALLBACK'
  });
}

// Validate required configuration
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase configuration despite fallbacks. This should not happen.');
  throw new Error('Fatal: Supabase configuration is completely unavailable');
}

// Public client (for client-side operations)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client (for server-side operations with elevated permissions)
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey || supabaseAnonKey // Fallback to anon key if service key not available
);

