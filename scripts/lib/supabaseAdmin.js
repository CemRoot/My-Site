/**
 * Shared Supabase admin client for scripts.
 * Uses service role key for full read/write access.
 *
 * Usage:
 *   import { supabase } from './lib/supabaseAdmin.js';
 */

import { createClient } from '@supabase/supabase-js';
import { env } from './config.js';

if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
