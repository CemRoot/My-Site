/**
 * Read-only Supabase client (anon key).
 * Use for public data fetches on the server — respects RLS.
 */

import { createSupabaseServerClient } from './createSupabaseServerClient.js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing public Supabase configuration. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.',
  );
}

export const supabasePublic = createSupabaseServerClient(SUPABASE_URL, SUPABASE_ANON_KEY);
