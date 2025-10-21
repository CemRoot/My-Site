/**
 * Vercel Status Monitor
 * 
 * Monitors Vercel's status page RSS feed and sends Telegram notifications
 * when incidents are detected
 * 
 * RSS Feed: https://www.vercel-status.com/history.rss
 * Run: node scripts/vercel-status-monitor.js
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { parseStringPromise } from 'xml2js';

const CONFIG = {
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID,
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  VERCEL_STATUS_RSS: 'https://www.vercel-status.com/history.rss',
  // Check incidents from last N hours
  CHECK_HOURS: 1,
};

const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SERVICE_KEY);

/**
 * Send Telegram message
 */
async function sendTelegramMessage(text, options = {}) {
  try {
    const url = `https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CONFIG.TELEGRAM_CHAT_ID,
        text: text,
        parse_mode: 'HTML',
        disable_web_page_preview: false,
        ...options
      })
    });

    if (!response.ok) {
      throw new Error(`Telegram API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Telegram send error:', error.message);
    throw error;
  }
}

/**
 * Fetch and parse Vercel status RSS feed
 */
async function fetchVercelStatus() {
  try {
    console.log('📡 Fetching Vercel status RSS feed...');
    
    const response = await fetch(CONFIG.VERCEL_STATUS_RSS);
    if (!response.ok) {
      throw new Error(`RSS fetch error: ${response.status}`);
    }

    const xmlText = await response.text();
    const result = await parseStringPromise(xmlText);
    
    return result.rss.channel[0].item || [];
  } catch (error) {
    console.error('❌ Failed to fetch Vercel status:', error.message);
    throw error;
  }
}

/**
 * Parse incident from RSS item
 */
function parseIncident(item) {
  try {
    const title = item.title?.[0] || 'Unknown incident';
    const link = item.link?.[0] || '';
    const pubDate = item.pubDate?.[0] || '';
    const description = item.description?.[0] || '';
    
    // Extract incident ID from link
    const incidentId = link.split('/').pop() || '';
    
    // Parse description HTML to extract status updates
    const statusMatches = description.match(/<p><small>([^<]+)<\/small><br><strong>([^<]+)<\/strong> - ([^<]+)<\/p>/g);
    
    const updates = [];
    if (statusMatches) {
      statusMatches.forEach(match => {
        const dateMatch = match.match(/<small>([^<]+)<\/small>/);
        const statusMatch = match.match(/<strong>([^<]+)<\/strong>/);
        const messageMatch = match.match(/<\/strong> - ([^<]+)<\/p>/);
        
        if (dateMatch && statusMatch && messageMatch) {
          updates.push({
            date: dateMatch[1],
            status: statusMatch[1],
            message: messageMatch[1].replace(/<[^>]*>/g, '').trim()
          });
        }
      });
    }
    
    return {
      id: incidentId,
      title,
      link,
      pubDate: new Date(pubDate),
      updates,
      latestStatus: updates[0]?.status || 'Unknown',
      latestUpdate: updates[0]?.message || ''
    };
  } catch (error) {
    console.error('❌ Failed to parse incident:', error.message);
    return null;
  }
}

/**
 * Check if incident was already notified
 */
async function isIncidentNotified(incidentId) {
  try {
    const { data, error } = await supabase
      .from('vercel_status_notifications')
      .select('id')
      .eq('incident_id', incidentId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    return !!data;
  } catch (error) {
    console.error('⚠️ Failed to check notification status:', error.message);
    return false; // Assume not notified if check fails
  }
}

/**
 * Mark incident as notified
 */
async function markIncidentNotified(incidentId, incidentTitle) {
  try {
    const { error } = await supabase
      .from('vercel_status_notifications')
      .insert({
        incident_id: incidentId,
        incident_title: incidentTitle,
        notified_at: new Date().toISOString()
      });
    
    if (error) throw error;
    
    console.log(`✅ Marked incident ${incidentId} as notified`);
  } catch (error) {
    console.error('⚠️ Failed to mark incident as notified:', error.message);
  }
}

/**
 * Format incident for Telegram message
 */
function formatIncidentMessage(incident) {
  const statusEmoji = {
    'Investigating': '🔍',
    'Identified': '✅',
    'Monitoring': '👀',
    'Resolved': '✅',
    'Update': '📝'
  };
  
  const emoji = statusEmoji[incident.latestStatus] || '⚠️';
  
  let message = `${emoji} <b>VERCEL STATUS ALERT</b>\n\n`;
  message += `📋 <b>${incident.title}</b>\n\n`;
  message += `🔴 Status: <b>${incident.latestStatus}</b>\n`;
  message += `📅 ${incident.pubDate.toLocaleString('tr-TR')}\n\n`;
  
  // Add latest update
  if (incident.latestUpdate) {
    message += `💬 <i>${incident.latestUpdate}</i>\n\n`;
  }
  
  // Add recent updates (max 3)
  if (incident.updates.length > 1) {
    message += `<b>📜 Son Güncellemeler:</b>\n`;
    incident.updates.slice(0, 3).forEach(update => {
      message += `• ${update.date} - <b>${update.status}</b>\n`;
    });
    message += '\n';
  }
  
  message += `🔗 <a href="${incident.link}">Detaylı Bilgi</a>\n`;
  message += `📊 <a href="https://www.vercel-status.com">Vercel Status Page</a>`;
  
  return message;
}

/**
 * Check for recent incidents and notify
 */
async function checkAndNotify() {
  try {
    console.log('🔍 Checking Vercel status...');
    
    const incidents = await fetchVercelStatus();
    console.log(`📊 Found ${incidents.length} total incidents in RSS feed`);
    
    // Filter recent incidents (last N hours)
    const cutoffTime = new Date(Date.now() - CONFIG.CHECK_HOURS * 60 * 60 * 1000);
    const recentIncidents = incidents
      .map(parseIncident)
      .filter(incident => incident && incident.pubDate > cutoffTime);
    
    console.log(`🔥 ${recentIncidents.length} incidents in last ${CONFIG.CHECK_HOURS} hour(s)`);
    
    if (recentIncidents.length === 0) {
      console.log('✅ No recent incidents found');
      return {
        checked: true,
        incidents: 0,
        notified: 0
      };
    }
    
    let notifiedCount = 0;
    
    for (const incident of recentIncidents) {
      // Skip if already notified
      const alreadyNotified = await isIncidentNotified(incident.id);
      if (alreadyNotified) {
        console.log(`⏭️ Skipping already notified incident: ${incident.id}`);
        continue;
      }
      
      // Only notify for non-resolved incidents or very recent resolved ones
      const shouldNotify = incident.latestStatus !== 'Resolved' || 
                          (Date.now() - incident.pubDate.getTime()) < 30 * 60 * 1000; // 30 min
      
      if (shouldNotify) {
        console.log(`📢 Notifying about incident: ${incident.title}`);
        
        const message = formatIncidentMessage(incident);
        await sendTelegramMessage(message);
        
        await markIncidentNotified(incident.id, incident.title);
        notifiedCount++;
        
        // Rate limit: wait 2 seconds between notifications
        if (notifiedCount < recentIncidents.length) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    
    console.log(`✅ Notified about ${notifiedCount} new incidents`);
    
    return {
      checked: true,
      incidents: recentIncidents.length,
      notified: notifiedCount
    };
    
  } catch (error) {
    console.error('❌ Check and notify error:', error.message);
    
    // Send error notification
    await sendTelegramMessage(
      `⚠️ <b>Vercel Status Monitor Hatası</b>\n\n` +
      `<code>${error.message}</code>\n\n` +
      `Lütfen sistem durumunu manuel kontrol edin:\n` +
      `https://www.vercel-status.com`
    );
    
    throw error;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Vercel Status Monitor started');
  console.log(`⏰ Checking incidents from last ${CONFIG.CHECK_HOURS} hour(s)`);
  
  try {
    const result = await checkAndNotify();
    
    console.log('\n📊 Summary:');
    console.log(`   ✅ Check completed: ${result.checked}`);
    console.log(`   🔥 Recent incidents: ${result.incidents}`);
    console.log(`   📢 Notifications sent: ${result.notified}`);
    console.log('\n✨ Vercel Status Monitor completed successfully');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Vercel Status Monitor failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default {
  checkAndNotify,
  fetchVercelStatus,
  parseIncident,
  formatIncidentMessage
};

