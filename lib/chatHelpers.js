/**
 * Helper functions for the Chat API route.
 * Extracted from api/chat.js for separation of concerns.
 */

import { supabase } from './supabaseAdmin.js';
export {
  detectMessageLanguage,
  isCodeGenerationRequest,
  isPromptInjection,
  isUnsafeAssistantResponse,
  getSecurityRefusal,
  isObviouslyOffTopic,
  validateUserMessage,
  enforceResponsePolicy,
} from './chatSecurity.js';

export function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

async function saveChatMessage(sessionId, role, content, source = 'vercel') {
  try {
    const { error } = await supabase
      .from('chat_history')
      .insert({
        session_id: sessionId,
        role,
        content,
        source,
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error(`❌ Error saving ${role} message to chat_history:`, error);
      return false;
    }
    return true;
  } catch (error) {
    console.error(`❌ Exception saving ${role} message:`, error);
    return false;
  }
}

export async function saveChatHistory(sessionId, userMessage, aiResponse, source = 'vercel') {
  await Promise.allSettled([
    saveChatMessage(sessionId, 'user', userMessage, source),
    saveChatMessage(sessionId, 'assistant', aiResponse, source),
  ]);
}

export async function updateChatBackendSetting(newBackend, reason = 'auto_fallback') {
  try {
    const { error } = await supabase
      .from('system_settings')
      .update({
        setting_value: newBackend,
        updated_at: new Date().toISOString(),
        updated_by: `auto-fallback (${reason})`,
        description: `Otomatik geçiş: ${reason} - ${new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })}`,
      })
      .eq('setting_key', 'chat_backend');

    if (error) {
      console.error('❌ Error updating chat_backend setting:', error);
      return false;
    }
    console.log(`✅ Chat backend updated to "${newBackend}" (reason: ${reason})`);
    return true;
  } catch (error) {
    console.error('❌ Exception updating chat_backend setting:', error);
    return false;
  }
}

export async function getChatBackend() {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('setting_value')
      .eq('setting_key', 'chat_backend')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching chat backend setting:', error);
      return 'vercel';
    }
    return data?.setting_value || 'vercel';
  } catch (error) {
    console.error('Chat backend check error:', error);
    return 'vercel';
  }
}

export async function forwardToN8n(message, pageContext) {
  const N8N_CHAT_WEBHOOK = process.env.N8N_CHAT_WEBHOOK;

  if (!N8N_CHAT_WEBHOOK) {
    throw new Error('N8N_CHAT_WEBHOOK environment variable not configured');
  }

  const response = await fetch(N8N_CHAT_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      pageContext,
      sessionId: `session_${Date.now()}`,
      timestamp: new Date().toISOString(),
    }),
  });

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(`n8n webhook error (${response.status}): ${responseText}`);
  }

  if (!responseText || responseText.trim() === '') {
    throw new Error('n8n returned empty response');
  }

  try {
    return JSON.parse(responseText);
  } catch (parseError) {
    console.error('n8n response parse error:', responseText.substring(0, 200));
    throw new Error(`n8n returned invalid JSON: ${parseError.message}`);
  }
}

export function sanitizeResponse(text) {
  if (!text || typeof text !== 'string') return text;

  let cleaned = text
    .replace(/[\u4E00-\u9FFF]/g, '')
    .replace(/[\u3040-\u309F\u30A0-\u30FF]/g, '')
    .replace(/[\uAC00-\uD7AF\u1100-\u11FF]/g, '')
    .replace(/[\u3000-\u303F\u31F0-\u31FF\uFF00-\uFFEF]/g, '')
    .replace(/[\u0600-\u06FF]/g, '')
    .replace(/[\u0590-\u05FF]/g, '')
    .replace(/[\u0400-\u04FF]/g, '')
    .replace(/\s{3,}/g, '  ')
    .replace(/\(\s*\)/g, '')
    .replace(/\[\s*\]/g, '')
    .trim();

  if (cleaned.length < 10 && text.length > 20) {
    console.warn('Response was heavily cleaned, original length:', text.length, 'cleaned length:', cleaned.length);
    return '[TOPIC:CEM] I apologize, but I encountered an issue with my response. Please try asking your question again!';
  }

  return cleaned;
}

export function hasSuspiciousCharacters(text) {
  if (!text) return false;
  return /[\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF\u0600-\u06FF\u0590-\u05FF]/.test(text);
}

export function formatPageContext(context) {
  if (!context || typeof context !== 'object') {
    return null;
  }

  const parts = ['=== CURRENT PAGE INFORMATION ==='];

  if (context.title) parts.push(`📄 Page Title: ${context.title}`);
  if (context.path) parts.push(`🔗 Page URL: ${context.path}`);
  if (context.summary) parts.push(`\n📝 Page Summary:\n${context.summary}`);
  if (context.description) parts.push(`\n💬 Description:\n${context.description}`);

  if (Array.isArray(context.highlights) && context.highlights.length > 0) {
    parts.push('\n✨ Key Highlights:');
    for (const highlight of context.highlights) {
      parts.push(`  • ${highlight}`);
    }
  }

  if (Array.isArray(context.features) && context.features.length > 0) {
    parts.push('\n🎯 Key Features:');
    for (const feature of context.features) {
      parts.push(`  • ${feature}`);
    }
  }

  if (context.technologies && Array.isArray(context.technologies)) {
    parts.push(`\n⚙️ Technologies: ${context.technologies.join(', ')}`);
  }
  if (context.content) parts.push(`\n📖 Main Content:\n${context.content}`);
  if (context.lastUpdated) parts.push(`\n🕐 Last Updated: ${context.lastUpdated}`);

  parts.push('\n=== END OF PAGE INFORMATION ===');
  parts.push('\nUSE THIS INFORMATION when the user asks about "this page", "here", "current section", etc.');

  return parts.join('\n');
}
