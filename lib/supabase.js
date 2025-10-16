/**
 * Supabase Client Configuration
 * Used for newsletter subscription storage
 */

import { createClient } from '@supabase/supabase-js';

// Get Supabase configuration from environment variables
// Support both Vite and Next.js environment variable naming
const supabaseUrl = 
  import.meta.env?.VITE_SUPABASE_URL || 
  process.env?.NEXT_PUBLIC_SUPABASE_URL || 
  import.meta.env?.VITE_PUBLIC_SUPABASE_URL;

const supabaseAnonKey = 
  import.meta.env?.VITE_SUPABASE_ANON_KEY || 
  process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  import.meta.env?.VITE_PUBLIC_SUPABASE_ANON_KEY;

const supabaseServiceKey = 
  import.meta.env?.VITE_SUPABASE_SERVICE_ROLE_KEY || 
  process.env?.SUPABASE_SERVICE_ROLE_KEY;

// Debug logging only in development mode
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  console.log('Supabase Config:', {
    url: supabaseUrl ? '✅ SET' : '❌ MISSING',
    key: supabaseAnonKey ? '✅ SET' : '❌ MISSING',
  });
}

// Validate required environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  const errorMsg = `
🚨 Missing Supabase Environment Variables 🚨
Required: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY

Current values:
- VITE_SUPABASE_URL: ${supabaseUrl || 'NOT SET'}
- VITE_SUPABASE_ANON_KEY: ${supabaseAnonKey ? 'SET' : 'NOT SET'}

Available environment variables:
${Object.keys(import.meta.env).filter(k => k.includes('SUPABASE')).join(', ') || 'None found'}

Please check your .env file and Vercel environment variables.
  `.trim();
  
  console.error(errorMsg);
  throw new Error('Missing Supabase configuration. Please check environment variables.');
}

// Create singleton instances immediately (not lazily)
// This ensures only ONE instance is created per client type
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  }
});

export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey || supabaseAnonKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  }
);

