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

// Validate required environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase configuration. Required variables: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
}

// Public client (for client-side operations)
export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);

// Admin client (for server-side operations with elevated permissions)
export const supabaseAdmin = createClient(
  supabaseUrl || '',
  supabaseServiceKey || ''
);

