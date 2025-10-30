/**
 * Conversation State Management for Telegram Multi-Step Interactions
 * Stores conversation state in Supabase to handle Vercel serverless cold starts
 * 
 * SERVERLESS-SAFE: Uses only process.env (no import.meta)
 */

import { createClient } from '@supabase/supabase-js';

// Get Supabase configuration from process.env (serverless-safe)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

// Create Supabase client
let supabaseClient = null;

function getSupabaseClient() {
  if (!supabaseClient) {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration in environment variables');
    }
    supabaseClient = createClient(supabaseUrl, supabaseKey);
  }
  return supabaseClient;
}

/**
 * Get user's current conversation state
 * @param {number} userId - Telegram user ID
 * @returns {Promise<object|null>} - State object or null if not found/expired
 */
export async function getConversationState(userId) {
  try {
    const client = getSupabaseClient();
    
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
 * @param {string} step - Current step ('awaiting_url', 'confirm_source', 'awaiting_original_source', 'awaiting_digest_edit')
 * @param {object} additionalData - Additional data (articleUrl, originalSource, digestId)
 * @returns {Promise<boolean>} - Success status
 */
export async function setConversationState(userId, step, additionalData = {}) {
  try {
    const client = getSupabaseClient();

    const { error } = await client
      .from('conversation_states')
      .upsert({
        user_id: userId,
        step,
        article_url: additionalData.articleUrl || null,
        original_source: additionalData.originalSource || null,
        digest_id: additionalData.digestId || null,
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
    const client = getSupabaseClient();
    
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
    const client = getSupabaseClient();
    
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

