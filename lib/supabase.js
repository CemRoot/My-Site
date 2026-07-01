/**
 * Supabase Client Configuration
 * Used for newsletter subscription storage
 */

import { createClient } from '@supabase/supabase-js';
import { createSupabaseServerClient } from './createSupabaseServerClient.js';

const importEnv = (key) =>
  typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env[key] : undefined;

const processEnv = (key) =>
  typeof process !== 'undefined' && process.env ? process.env[key] : undefined;

// Resolve Supabase configuration with support for Vite and server-side environments
const supabaseUrl =
  importEnv('VITE_SUPABASE_URL') ||
  importEnv('VITE_PUBLIC_SUPABASE_URL') ||
  processEnv('NEXT_PUBLIC_SUPABASE_URL') ||
  processEnv('SUPABASE_URL');

const supabaseAnonKey =
  importEnv('VITE_SUPABASE_ANON_KEY') ||
  importEnv('VITE_PUBLIC_SUPABASE_ANON_KEY') ||
  processEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') ||
  processEnv('SUPABASE_ANON_KEY');

const supabaseServiceKey = processEnv('SUPABASE_SERVICE_ROLE_KEY');
const isBrowser = typeof window !== 'undefined';

// Debug logging only in browser development mode
if (isBrowser && importEnv('DEV')) {
  console.log('Supabase Config:', {
    url: supabaseUrl ? '✅ SET' : '❌ MISSING',
    key: supabaseAnonKey ? '✅ SET' : '❌ MISSING',
  });
}

// Validate required environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  const importVars =
    typeof import.meta !== 'undefined' && import.meta.env
      ? Object.keys(import.meta.env).filter((key) => key.includes('SUPABASE'))
      : [];
  const processVars =
    typeof process !== 'undefined' && process.env
      ? Object.keys(process.env).filter((key) => key.includes('SUPABASE'))
      : [];

  const errorMsg = `
🚨 Missing Supabase Environment Variables 🚨
Required (client-side): VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY

Current values:
- VITE_SUPABASE_URL: ${supabaseUrl || 'NOT SET'}
- VITE_SUPABASE_ANON_KEY: ${supabaseAnonKey ? 'SET' : 'NOT SET'}

Available environment variables:
${[...new Set([...importVars, ...processVars])].join(', ') || 'None found'}

Please check your .env file and hosting environment variables.
  `.trim();

  console.error(errorMsg);
  throw new Error('Missing Supabase configuration. Please check environment variables.');
}

// Ensure a single browser instance to avoid multiple GoTrueClient warnings
let browserClient;
if (isBrowser) {
  if (!window.__SUPABASE_CLIENT__) {
    window.__SUPABASE_CLIENT__ = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storageKey: 'my_site_auth_token',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  browserClient = window.__SUPABASE_CLIENT__;
}

// Export client for browser/SSR usage
export const supabase = isBrowser ? browserClient : createSupabaseServerClient(supabaseUrl, supabaseAnonKey);

// Only create the admin client on the server to keep the service role key private
export const supabaseAdmin =
  !isBrowser && supabaseServiceKey
    ? createSupabaseServerClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      })
    : null;

/**
 * Note: Conversation State Management has been moved to lib/conversation-state.js
 * to avoid import.meta issues in Vercel serverless environment.
 * 
 * Import from: '../lib/conversation-state.js'
 */
