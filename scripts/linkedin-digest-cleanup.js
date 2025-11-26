/**
 * LinkedIn Digest Cleanup Functions
 *
 * Handles cleanup of failed/pending LinkedIn digests
 * Prevents stuck states and allows retry
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const CONFIG = {
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID,
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
};

const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SERVICE_KEY);

/**
 * Clean up pending digests older than 24 hours
 */
export async function cleanOldPendingDigests() {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayISO = yesterday.toISOString();

    // Find old pending digests
    const { data: oldDigests, error: fetchError } = await supabase
      .from('linkedin_digest_posts')
      .select('*')
      .eq('status', 'pending')
      .lt('created_at', yesterdayISO);

    if (fetchError) throw fetchError;

    if (!oldDigests || oldDigests.length === 0) {
      return { success: true, message: 'No old pending digests found', count: 0 };
    }

    // Delete old pending digests
    const { error: deleteError } = await supabase
      .from('linkedin_digest_posts')
      .delete()
      .eq('status', 'pending')
      .lt('created_at', yesterdayISO);

    if (deleteError) throw deleteError;

    return {
      success: true,
      message: `Cleaned up ${oldDigests.length} old pending digests`,
      count: oldDigests.length,
      digests: oldDigests.map(d => ({
        date: d.digest_date,
        articles: d.article_count,
        created: d.created_at
      }))
    };
  } catch (error) {
    console.error('Error cleaning old pending digests:', error);
    return {
      success: false,
      message: error.message,
      count: 0
    };
  }
}

/**
 * Delete specific pending digest by ID
 */
export async function deletePendingDigest(digestId) {
  try {
    // First check if digest exists and is pending
    const { data: digest, error: fetchError } = await supabase
      .from('linkedin_digest_posts')
      .select('*')
      .eq('id', digestId)
      .single();

    if (fetchError) throw fetchError;

    if (!digest) {
      throw new Error('Digest not found');
    }

    if (digest.status === 'posted') {
      throw new Error('Cannot delete posted digest');
    }

    // Delete the digest
    const { error: deleteError } = await supabase
      .from('linkedin_digest_posts')
      .delete()
      .eq('id', digestId);

    if (deleteError) throw deleteError;

    return {
      success: true,
      message: `Deleted digest for ${digest.digest_date}`,
      digest: {
        date: digest.digest_date,
        articles: digest.article_count,
        status: digest.status
      }
    };
  } catch (error) {
    console.error('Error deleting pending digest:', error);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Delete all pending digests (nuclear option)
 */
export async function deleteAllPendingDigests() {
  try {
    // Get all pending digests first
    const { data: pendingDigests, error: fetchError } = await supabase
      .from('linkedin_digest_posts')
      .select('*')
      .eq('status', 'pending');

    if (fetchError) throw fetchError;

    if (!pendingDigests || pendingDigests.length === 0) {
      return {
        success: true,
        message: 'No pending digests to delete',
        count: 0
      };
    }

    // Delete all pending digests
    const { error: deleteError } = await supabase
      .from('linkedin_digest_posts')
      .delete()
      .eq('status', 'pending');

    if (deleteError) throw deleteError;

    return {
      success: true,
      message: `Deleted all ${pendingDigests.length} pending digests`,
      count: pendingDigests.length,
      digests: pendingDigests.map(d => ({
        date: d.digest_date,
        articles: d.article_count
      }))
    };
  } catch (error) {
    console.error('Error deleting all pending digests:', error);
    return {
      success: false,
      message: error.message,
      count: 0
    };
  }
}

/**
 * Check for stuck digests (pending > 1 hour)
 */
export async function checkStuckDigests() {
  try {
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const { data: stuckDigests, error } = await supabase
      .from('linkedin_digest_posts')
      .select('*')
      .eq('status', 'pending')
      .lt('created_at', oneHourAgo.toISOString());

    if (error) throw error;

    return {
      success: true,
      stuck: stuckDigests || [],
      count: (stuckDigests || []).length
    };
  } catch (error) {
    console.error('Error checking stuck digests:', error);
    return {
      success: false,
      stuck: [],
      count: 0,
      error: error.message
    };
  }
}

/**
 * Get pending digests summary
 */
export async function getPendingDigestsSummary() {
  try {
    const { data: pendingDigests, error } = await supabase
      .from('linkedin_digest_posts')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!pendingDigests || pendingDigests.length === 0) {
      return {
        success: true,
        count: 0,
        digests: [],
        message: 'No pending digests'
      };
    }

    return {
      success: true,
      count: pendingDigests.length,
      digests: pendingDigests.map(d => ({
        id: d.id,
        date: d.digest_date,
        articles: d.article_count,
        created: new Date(d.created_at).toLocaleString('tr-TR'),
        age: Math.floor((Date.now() - new Date(d.created_at)) / (1000 * 60)) + ' minutes'
      }))
    };
  } catch (error) {
    console.error('Error getting pending digests:', error);
    return {
      success: false,
      count: 0,
      digests: [],
      error: error.message
    };
  }
}

// Export all functions
export {
  cleanOldPendingDigests,
  deletePendingDigest,
  deleteAllPendingDigests,
  checkStuckDigests,
  getPendingDigestsSummary
};