/**
 * Supabase Client Configuration
 * Used for newsletter subscription storage
 */

import { createClient } from '@supabase/supabase-js';

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
export const supabase = isBrowser ? browserClient : createClient(supabaseUrl, supabaseAnonKey);

// Only create the admin client on the server to keep the service role key private
export const supabaseAdmin =
  !isBrowser && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      })
    : null;

/**
 * Conversation State Management (for Telegram multi-step interactions)
 * Stores conversation state in Supabase to handle Vercel serverless cold starts
 */

/**
 * Get user's current conversation state
 * @param {number} userId - Telegram user ID
 * @returns {Promise<object|null>} - State object or null if not found/expired
 */
export async function getConversationState(userId) {
  try {
    const client = supabaseAdmin || supabase;
    
    const { data, error } = await client
      .from('conversation_states')
      .select('*')
      .eq('user_id', userId)
      .gt('expires_at', new Date().toISOString())
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('❌ Get conversation state error:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('❌ Get conversation state exception:', error);
    return null;
  }
}

/**
 * Set or update user's conversation state
 * @param {number} userId - Telegram user ID
 * @param {string} step - Current step ('awaiting_url', 'confirm_source', 'awaiting_original_source')
 * @param {object} additionalData - Additional data (articleUrl, originalSource)
 * @returns {Promise<boolean>} - Success status
 */
export async function setConversationState(userId, step, additionalData = {}) {
  try {
    const client = supabaseAdmin || supabase;
    
    const { error } = await client
      .from('conversation_states')
      .upsert({
        user_id: userId,
        step,
        article_url: additionalData.articleUrl || null,
        original_source: additionalData.originalSource || null,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
      }, {
        onConflict: 'user_id'
      });
    
    if (error) {
      console.error('❌ Set conversation state error:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('❌ Set conversation state exception:', error);
    return false;
  }
}

/**
 * Delete user's conversation state
 * @param {number} userId - Telegram user ID
 * @returns {Promise<boolean>} - Success status
 */
export async function deleteConversationState(userId) {
  try {
    const client = supabaseAdmin || supabase;
    
    const { error } = await client
      .from('conversation_states')
      .delete()
      .eq('user_id', userId);
    
    if (error) {
      console.error('❌ Delete conversation state error:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('❌ Delete conversation state exception:', error);
    return false;
  }
}

/**
 * Clean up expired conversation states (can be called periodically)
 * @returns {Promise<number>} - Number of deleted states
 */
export async function cleanupExpiredConversationStates() {
  try {
    const client = supabaseAdmin || supabase;
    
    const { data, error } = await client
      .from('conversation_states')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .select('id');
    
    if (error) {
      console.error('❌ Cleanup expired states error:', error);
      return 0;
    }
    
    return data?.length || 0;
  } catch (error) {
    console.error('❌ Cleanup expired states exception:', error);
    return 0;
  }
}
