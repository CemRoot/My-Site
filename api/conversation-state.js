/**
 * Conversation State API
 * Handles conversation state management for Telegram bot
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { user_id, step, digest_id, article_url } = req.body;

    if (req.method === 'POST') {
      // Set conversation state
      if (!user_id || !step) {
        return res.status(400).json({ 
          success: false, 
          message: 'user_id and step are required' 
        });
      }

      const { data, error } = await supabase
        .from('conversation_states')
        .upsert({
          user_id: user_id,
          step: step,
          digest_id: digest_id || null,
          article_url: article_url || null,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return res.status(200).json({ 
        success: true, 
        data: data 
      });

    } else if (req.method === 'DELETE') {
      // Delete conversation state
      if (!user_id) {
        return res.status(400).json({ 
          success: false, 
          message: 'user_id is required' 
        });
      }

      const { error } = await supabase
        .from('conversation_states')
        .delete()
        .eq('user_id', user_id);

      if (error) {
        throw error;
      }

      return res.status(200).json({ 
        success: true, 
        message: 'Conversation state deleted' 
      });

    } else {
      return res.status(405).json({ 
        success: false, 
        message: 'Method not allowed' 
      });
    }

  } catch (error) {
    console.error('Conversation state API error:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
}


