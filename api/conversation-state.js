/**
 * Conversation State API
 *
 * Vercel serverless function to manage Telegram conversation states
 * This endpoint is called by n8n workflows to set conversation state
 * for multi-step interactions like LinkedIn digest editing
 *
 * Endpoints:
 * - POST /api/conversation-state - Set conversation state
 * - GET /api/conversation-state?user_id=123 - Get conversation state
 * - DELETE /api/conversation-state?user_id=123 - Delete conversation state
 */

import { createClient } from '@supabase/supabase-js';

const CONFIG = {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  // Security: API key for authentication (RECOMMENDED)
  API_SECRET: process.env.CONVERSATION_STATE_API_SECRET || process.env.TELEGRAM_CONTROL_API_SECRET || '',
};

// SECURITY: Log error if API_SECRET is not set
if (!CONFIG.API_SECRET) {
  console.error('❌ CRITICAL: CONVERSATION_STATE_API_SECRET is not set! Authentication is required.');
}

// Create Supabase client
let supabaseClient = null;

function getSupabaseClient() {
  if (!supabaseClient) {
    if (!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_SERVICE_KEY) {
      throw new Error('Missing Supabase configuration in environment variables');
    }
    supabaseClient = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SERVICE_KEY);
  }
  return supabaseClient;
}

/**
 * Get user's current conversation state
 */
async function getConversationState(userId) {
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
 */
async function setConversationState(userId, step, additionalData = {}) {
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
 */
async function deleteConversationState(userId) {
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
 * Verify authentication
 */
function verifyAuth(req) {
  // If no API_SECRET is set, block access as a security measure
  if (!CONFIG.API_SECRET) {
    return {
      authorized: false,
      status: 500,
      error: 'Internal Server Error',
      message: 'API security configuration is missing. Set CONVERSATION_STATE_API_SECRET or TELEGRAM_CONTROL_API_SECRET.'
    };
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      authorized: false,
      status: 401,
      error: 'Unauthorized',
      message: 'Bearer token required in Authorization header'
    };
  }

  const providedSecret = authHeader.replace('Bearer ', '');
  if (providedSecret !== CONFIG.API_SECRET) {
    return {
      authorized: false,
      status: 403,
      error: 'Forbidden',
      message: 'Invalid API secret'
    };
  }

  return { authorized: true };
}

/**
 * Main handler
 */
export default async function handler(req, res) {
  // CORS headers
  const ALLOWED_ORIGINS = [
    'https://cemkoyluoglu.codes',
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  ].filter(Boolean);

  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Security: Verify authentication
    const authResult = verifyAuth(req);
    if (!authResult.authorized) {
      console.warn(`Unauthorized access attempt to conversation-state API from ${req.headers['x-forwarded-for'] || 'unknown'}`);
      return res.status(authResult.status).json({
        success: false,
        error: authResult.error,
        message: authResult.message
      });
    }

    // Handle different HTTP methods
    if (req.method === 'POST') {
      // Set conversation state
      const { user_id, step, digest_id, article_url, original_source } = req.body;

      if (!user_id || !step) {
        return res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'Missing required parameters: user_id, step'
        });
      }

      const additionalData = {
        digestId: digest_id,
        articleUrl: article_url,
        originalSource: original_source
      };

      const success = await setConversationState(user_id, step, additionalData);

      if (success) {
        console.log(`✅ Conversation state set: user_id=${user_id}, step=${step}, digest_id=${digest_id || 'none'}`);
        return res.status(200).json({
          success: true,
          message: 'Conversation state updated',
          data: {
            user_id,
            step,
            digest_id: digest_id || null
          }
        });
      } else {
        return res.status(500).json({
          success: false,
          error: 'Internal Server Error',
          message: 'Failed to set conversation state'
        });
      }
    } else if (req.method === 'GET') {
      // Get conversation state
      const { user_id } = req.query;

      if (!user_id) {
        return res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'Missing required parameter: user_id'
        });
      }

      const state = await getConversationState(parseInt(user_id));

      if (state) {
        return res.status(200).json({
          success: true,
          data: state
        });
      } else {
        return res.status(404).json({
          success: false,
          message: 'No active conversation state found'
        });
      }
    } else if (req.method === 'DELETE') {
      // Delete conversation state
      const { user_id } = req.query;

      if (!user_id) {
        return res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'Missing required parameter: user_id'
        });
      }

      const success = await deleteConversationState(parseInt(user_id));

      if (success) {
        console.log(`✅ Conversation state deleted: user_id=${user_id}`);
        return res.status(200).json({
          success: true,
          message: 'Conversation state deleted'
        });
      } else {
        return res.status(500).json({
          success: false,
          error: 'Internal Server Error',
          message: 'Failed to delete conversation state'
        });
      }
    } else {
      return res.status(405).json({
        success: false,
        error: 'Method Not Allowed',
        message: `HTTP method ${req.method} is not supported`,
        allowed_methods: ['GET', 'POST', 'DELETE']
      });
    }

  } catch (error) {
    console.error('❌ Conversation State API error:', error);

    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
