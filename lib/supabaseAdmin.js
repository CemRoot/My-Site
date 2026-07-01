/**
 * Shared Supabase admin client for API routes (Vercel serverless functions).
 * Uses service role key for full read/write access.
 */

import { createSupabaseServerClient } from './createSupabaseServerClient.js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const supabase = createSupabaseServerClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
