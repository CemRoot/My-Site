/**
 * Newsletter Subscription API
 * Vercel Serverless Function
 * Stores emails securely in Supabase (Postgres)
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // CORS headers - Security: Only allow requests from trusted origins
  const ALLOWED_ORIGINS = [
    'https://cemkoyluoglu.codes',
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  ].filter(Boolean);
  
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only accept POST
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });
  }

  try {
    const { email } = req.body;

    // Validate email
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }

    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid email format' 
      });
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Get client IP and user agent
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';

    // Check if email already exists
    const { data: existingSubscriber, error: checkError } = await supabase
      .from('newsletter_subscribers')
      .select('id, status')
      .eq('email', normalizedEmail)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 = no rows returned (expected for new subscribers)
      console.error('Supabase check error:', checkError);
      return res.status(500).json({ 
        success: false, 
        message: 'Database error' 
      });
    }

    if (existingSubscriber) {
      if (existingSubscriber.status === 'active') {
        return res.status(409).json({ 
          success: false, 
          message: 'Email already subscribed' 
        });
      } else {
        // Reactivate subscription
        const { error: updateError } = await supabase
          .from('newsletter_subscribers')
          .update({ 
            status: 'active',
            subscribed_at: new Date().toISOString()
          })
          .eq('email', normalizedEmail);

        if (updateError) {
          console.error('Supabase update error:', updateError);
          return res.status(500).json({ 
            success: false, 
            message: 'Failed to reactivate subscription' 
          });
        }

        return res.status(200).json({ 
          success: true, 
          message: 'Subscription reactivated successfully!' 
        });
      }
    }

    // Insert new subscriber
    const { data, error: insertError } = await supabase
      .from('newsletter_subscribers')
      .insert([
        {
          email: normalizedEmail,
          source: 'website',
          status: 'active',
          ip_address: ipAddress,
          user_agent: userAgent
        }
      ])
      .select();

    if (insertError) {
      console.error('Supabase insert error:', insertError);
      
      // Handle duplicate email (race condition)
      if (insertError.code === '23505') {
        return res.status(409).json({ 
          success: false, 
          message: 'Email already subscribed' 
        });
      }

      return res.status(500).json({ 
        success: false, 
        message: 'Failed to subscribe' 
      });
    }

    // Success!
    console.log(`✅ New subscriber: ${normalizedEmail}`);
    
    return res.status(200).json({ 
      success: true, 
      message: 'Successfully subscribed to newsletter!',
      data: {
        email: normalizedEmail,
        subscribedAt: data[0].subscribed_at
      }
    });

  } catch (error) {
    console.error('Newsletter API error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
}
