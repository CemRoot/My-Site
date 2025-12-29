/**
 * LinkedIn Groups Daily Digest Generator
 * 
 * Generates daily tech news digests optimized for LinkedIn Groups.
 * Uses Groq API (Llama 3.3 70B) for AI-powered content generation.
 * 
 * Features:
 * - Fetches recent articles from Supabase
 * - Calculates relevance scores based on group topics
 * - Selects TOP 3 articles with category diversity
 * - Generates group-optimized content with hooks and discussion questions
 * - Sends formatted content to Telegram for manual posting
 * 
 * Usage:
 *   node scripts/linkedin-groups-digest.js [daily|weekly] [group-id]
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import Groq from 'groq-sdk';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables from multiple .env files
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Load .env first, then .env.local (local overrides)
dotenv.config({ path: join(projectRoot, '.env') });
if (existsSync(join(projectRoot, '.env.local'))) {
  dotenv.config({ path: join(projectRoot, '.env.local'), override: true });
}

// Configuration
const CONFIG = {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID,
  SITE_BASE_URL: process.env.SITE_URL || 'https://cemkoyluoglu.codes'
};

// Initialize clients
const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SERVICE_KEY);
const groq = new Groq({ apiKey: CONFIG.GROQ_API_KEY });

// Load group configurations
function loadGroupConfig() {
  try {
    const configPath = join(__dirname, '..', 'data', 'linkedin-groups.json');
    const configData = readFileSync(configPath, 'utf-8');
    return JSON.parse(configData);
  } catch (error) {
    console.error('Error loading group config:', error.message);
    throw error;
  }
}

/**
 * Send message to Telegram
 */
async function sendTelegramMessage(text, options = {}) {
  try {
    const url = `https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    // Telegram message limit is 4096 characters
    const MAX_LENGTH = 4000;
    const truncatedText = text.length > MAX_LENGTH 
      ? text.substring(0, MAX_LENGTH - 50) + '\n\n... [Truncated]'
      : text;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CONFIG.TELEGRAM_CHAT_ID,
        text: truncatedText,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        ...options
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Telegram API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Telegram send error:', error.message);
    throw error;
  }
}

/**
 * Get list of article IDs that have already been used in LinkedIn Group digests
 */
async function getUsedArticleIds() {
  try {
    const { data, error } = await supabase
      .from('linkedin_group_digests')
      .select('article_ids')
      .order('created_at', { ascending: false })
      .limit(10); // Last 10 digests
    
    if (error) {
      // Table might not exist yet - that's OK
      if (error.code === '42P01') {
        console.log('linkedin_group_digests table not found, will create on first digest');
        return new Set();
      }
      console.warn('Error fetching used articles:', error.message);
      return new Set();
    }
    
    const usedIds = new Set();
    data?.forEach(digest => {
      if (digest.article_ids && Array.isArray(digest.article_ids)) {
        digest.article_ids.forEach(id => usedIds.add(id));
      }
    });
    
    console.log(`Found ${usedIds.size} previously used article IDs`);
    return usedIds;
  } catch (error) {
    console.warn('Error getting used article IDs:', error.message);
    return new Set();
  }
}

/**
 * Save digest record to prevent article reuse
 */
async function saveDigestRecord(groupId, groupName, articleIds) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Use upsert to handle duplicate key
    const { error } = await supabase
      .from('linkedin_group_digests')
      .upsert({
        group_id: groupId,
        group_name: groupName,
        article_ids: articleIds,
        digest_date: today,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'group_id,digest_date'
      });
    
    if (error) {
      if (error.code === '42P01') {
        console.warn('Table linkedin_group_digests does not exist. Please create it.');
      } else {
        console.warn('Error saving digest record:', error.message);
      }
    } else {
      console.log(`Saved digest record for group: ${groupId}`);
    }
  } catch (error) {
    console.warn('Error saving digest record:', error.message);
  }
}

/**
 * Fetch recent articles from Supabase
 * @param {number} hoursAgo - How many hours back to fetch
 * @param {boolean} excludeUsed - Whether to exclude already used articles
 */
async function fetchRecentArticles(hoursAgo = 48, excludeUsed = true) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - hoursAgo);
    
    // Get used article IDs
    const usedIds = excludeUsed ? await getUsedArticleIds() : new Set();
    
    const { data: articles, error } = await supabase
      .from('tech_news_articles')
      .select('id, title, description, content, category, slug, date, created_at, original_source')
      .gte('created_at', cutoffDate.toISOString())
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }
    
    // Filter out already used articles
    const freshArticles = (articles || []).filter(a => !usedIds.has(a.id));
    
    console.log(`Found ${articles?.length || 0} articles from last ${hoursAgo} hours`);
    if (usedIds.size > 0) {
      console.log(`Filtered out ${(articles?.length || 0) - freshArticles.length} already used articles`);
      console.log(`Available fresh articles: ${freshArticles.length}`);
    }
    
    return freshArticles;
  } catch (error) {
    console.error('Error fetching articles:', error);
    throw error;
  }
}

/**
 * Calculate relevance score for an article based on group topics
 * Uses the formula from user's SYSTEM prompt
 */
function calculateRelevance(article, group) {
  let relevance = 1.0;
  
  const titleLower = (article.title || '').toLowerCase();
  const descLower = (article.description || '').toLowerCase();
  const contentLower = (article.content || '').substring(0, 500).toLowerCase();
  const combinedText = `${titleLower} ${descLower} ${contentLower}`;
  
  // +0.4 if title/summary contains any topic_keywords
  const keywordMatch = group.topic_keywords.some(keyword => 
    combinedText.includes(keyword.toLowerCase())
  );
  if (keywordMatch) {
    relevance += 0.4;
  }
  
  // +0.2 if category matches group theme
  const categoryMatch = group.categories.some(cat => 
    cat.toLowerCase() === (article.category || '').toLowerCase()
  );
  if (categoryMatch) {
    relevance += 0.2;
  }
  
  // +0.2 if published within last 48 hours (already filtered, but check recency bonus)
  const articleDate = new Date(article.created_at);
  const hoursSincePublished = (Date.now() - articleDate.getTime()) / (1000 * 60 * 60);
  if (hoursSincePublished <= 24) {
    relevance += 0.2; // Extra bonus for very recent articles
  } else if (hoursSincePublished <= 48) {
    relevance += 0.1;
  }
  
  return relevance;
}

/**
 * Score and select top articles for a group
 */
function selectTopArticles(articles, group, config) {
  const dailyCount = config.defaults.daily_article_count || 3;
  const maxPerCategory = config.defaults.max_articles_per_category || 2;
  
  // Calculate scores
  const scoredArticles = articles.map(article => {
    const relevance = calculateRelevance(article, group);
    // Base score from 0-100 based on content quality indicators
    let baseScore = 50;
    
    // Boost for longer descriptions
    if (article.description && article.description.length > 100) baseScore += 10;
    if (article.description && article.description.length > 200) baseScore += 5;
    
    // Boost for having content
    if (article.content && article.content.length > 500) baseScore += 10;
    
    // Boost for recognized sources
    const trustedSources = ['techcrunch', 'wired', 'arstechnica', 'theverge', 'mit', 'stanford'];
    if (trustedSources.some(src => (article.original_source || '').toLowerCase().includes(src))) {
      baseScore += 15;
    }
    
    const finalScore = Math.round(baseScore * relevance);
    
    return {
      ...article,
      relevance,
      base_score: baseScore,
      final_score: finalScore,
      article_url: `${CONFIG.SITE_BASE_URL}/tech-news/${article.slug}`
    };
  });
  
  // Sort by final score
  scoredArticles.sort((a, b) => b.final_score - a.final_score);
  
  // Select with category diversity
  const selected = [];
  const categoryCounts = {};
  
  for (const article of scoredArticles) {
    const cat = article.category || 'General';
    categoryCounts[cat] = (categoryCounts[cat] || 0);
    
    if (categoryCounts[cat] < maxPerCategory) {
      selected.push(article);
      categoryCounts[cat]++;
    }
    
    if (selected.length >= dailyCount) break;
  }
  
  // If we don't have enough, add more ignoring diversity
  if (selected.length < dailyCount) {
    for (const article of scoredArticles) {
      if (!selected.find(s => s.id === article.id)) {
        selected.push(article);
        if (selected.length >= dailyCount) break;
      }
    }
  }
  
  // Mark wildcard if we had to stretch
  if (selected.length > 0 && selected[selected.length - 1].final_score < 40) {
    selected[selected.length - 1].is_wildcard = true;
  }
  
  return selected;
}

/**
 * Generate group-optimized content using Groq AI
 * LinkedIn Best Practices 2025 Format:
 * - Unicode bold title
 * - 2-line hook
 * - Each article: emoji + topic + 2-line insight
 * - Multiple choice poll question (A/B/C)
 * - 3-5 hashtags
 * - "Sources in the first comment" at end
 */
async function generateGroupContent(selectedArticles, group) {
  const articlesData = selectedArticles.map(a => ({
    title: a.title,
    summary: a.description?.substring(0, 250) || '',
    category: a.category,
    url: a.article_url
  }));
  
  // Generate hashtags based on group topics
  const hashtags = group.topic_keywords.slice(0, 3)
    .map(k => `#${k.replace(/\s+/g, '')}`)
    .join(' ');
  
  const systemPrompt = `You are a JSON API that generates LinkedIn content. You MUST respond with ONLY a valid JSON object, no other text.

Your response format MUST be exactly:
{"post_text": "...", "first_comment": "..."}

CONTENT RULES:
- LinkedIn does NOT support markdown. NEVER use **bold** or *italic* or __underline__
- For emphasis, use Unicode bold characters like: 𝐀𝐈, 𝐓𝐞𝐜𝐡, 𝐌𝐋
- Each article insight: WHAT happened + WHY it matters (2 sentences max)
- Use emojis: 🧠 ⚡ 🔮 for the 3 signals
- End with A/B/C question options
- NO links in post_text - all links go in first_comment
- Use \\n for line breaks in JSON strings`;

  const userPrompt = `Group: ${group.name}
Keywords: ${group.topic_keywords.slice(0, 3).join(', ')}
Hashtags: ${hashtags}

ARTICLES:
${articlesData.map((a, i) => `${i + 1}. ${a.title}\n   ${a.summary}\n   URL: ${a.url}`).join('\n\n')}

IMPORTANT: Use \\n\\n (double newline) to separate sections for readability!

Return this JSON:
{
  "post_text": "𝐓𝐨𝐝𝐚𝐲'𝐬 𝐓𝐨𝐩 𝐓𝐞𝐜𝐡 𝐒𝐢𝐠𝐧𝐚𝐥𝐬: [keywords]\\n\\nHook line 1.\\nHook line 2.\\n\\nHere are 3 signals worth your attention today:\\n\\n🧠 [Topic]: [What + Why]\\n\\n⚡ [Topic]: [What + Why]\\n\\n🔮 [Topic]: [What + Why]\\n\\nQuestion for the group:\\nIf you could only track ONE — which would it be?\\n\\nA) Option\\nB) Option\\nC) Option\\n\\nSources in the first comment.\\n${hashtags}",
  "first_comment": "Sources / Read more:\\n\\n• Label: url\\n• Label: url\\n• Label: url"
}`;

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.6,
      max_tokens: 1000, // Reduced - we want concise content
      top_p: 0.9
    });

    const responseText = completion.choices[0]?.message?.content || '';
    
    // Debug: log first 200 chars of response
    console.log('AI Response preview:', responseText.substring(0, 300));
    
    // Parse JSON from response
    let parsedContent;
    try {
      // Clean up response - be careful with Unicode
      let cleanedResponse = responseText
        .replace(/```json\n?/gi, '')
        .replace(/```\n?/gi, '')
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Only strip control chars, NOT Unicode
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']')
        .trim();
      
      // Find JSON object in response
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON object found in response');
      }
      cleanedResponse = jsonMatch[0];
      
      // Try to parse, if fails try fixing common issues
      let rawParsed;
      try {
        rawParsed = JSON.parse(cleanedResponse);
      } catch {
        // Try fixing unescaped newlines in strings
        const fixedJson = cleanedResponse.replace(/:\s*"([^"]*?)"/g, (match, content) => {
          const fixed = content.replace(/\n/g, '\\n').replace(/\r/g, '\\r');
          return `: "${fixed}"`;
        });
        rawParsed = JSON.parse(fixedJson);
      }
      
      // Clean up AI output for LinkedIn compatibility
      const cleanForLinkedIn = (text) => {
        return (text || '')
          .replace(/\\n/g, '\n')              // Fix escaped newlines from JSON
          .replace(/\*\*([^*]+)\*\*/g, '$1')  // Remove **markdown bold**
          .replace(/\*([^*]+)\*/g, '$1')      // Remove *italic*
          .replace(/^\s+/gm, '')              // Remove leading spaces
          .replace(/\n{4,}/g, '\n\n\n')       // Max 3 consecutive newlines
          .trim();
      };
      
      parsedContent = {
        post_text: cleanForLinkedIn(rawParsed.post_text),
        first_comment: cleanForLinkedIn(rawParsed.first_comment)
      };
      
      console.log('AI content generated successfully');
      
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError.message);
      
      // Fallback: create high-quality formatted content
      const emojis = ['🧠', '⚡', '🔮'];
      const topKeywords = group.topic_keywords.slice(0, 3);
      const boldKeywords = topKeywords.map(k => {
        // Convert to unicode bold (simplified)
        return k.split('').map(c => {
          const code = c.charCodeAt(0);
          if (code >= 65 && code <= 90) return String.fromCodePoint(0x1D400 + code - 65);
          if (code >= 97 && code <= 122) return String.fromCodePoint(0x1D41A + code - 97);
          return c;
        }).join('');
      }).join(', ');
      
      const hashtags = topKeywords.map(k => `#${k.replace(/\s+/g, '')}`).join(' ');
      
      // Build signals with WHAT + WHY format
      const signalLines = selectedArticles.map((a, i) => {
        const emoji = emojis[i] || '📌';
        const topicLabel = a.category || 'Tech Update';
        const desc = a.description || '';
        const whatHappened = desc.substring(0, 80);
        const whyMatters = desc.length > 80 ? desc.substring(80, 150) : 'This signals a shift in how the industry operates.';
        return `${emoji} ${topicLabel}: ${whatHappened}\n${whyMatters}`;
      });
      
      // Build options (2-4 words each)
      const optionLines = selectedArticles.map((a, i) => {
        const letter = String.fromCharCode(65 + i);
        const words = a.title.split(' ').slice(0, 3).join(' ');
        return `${letter}) ${words}`;
      });
      
      const postText = [
        `𝐓𝐨𝐝𝐚𝐲'𝐬 𝐓𝐨𝐩 𝐓𝐞𝐜𝐡 𝐒𝐢𝐠𝐧𝐚𝐥𝐬: ${boldKeywords}`,
        '',
        "Tech isn't just evolving — it's reshaping entire industries.",
        'Here are the developments practitioners should watch.',
        '',
        'Here are 3 signals worth your attention today:',
        '',
        signalLines[0],
        '',
        signalLines[1],
        '',
        signalLines[2],
        '',
        'Question for the group:',
        'If you could only track ONE of these trends — which would it be, and why?',
        '',
        optionLines.join('\n'),
        '',
        'Sources in the first comment.',
        hashtags
      ].join('\n');
      
      const firstComment = [
        'Sources / Read more:',
        '',
        ...selectedArticles.map(a => {
          const shortLabel = a.title.substring(0, 35);
          return `• ${shortLabel}: ${a.article_url}`;
        })
      ].join('\n');
      
      parsedContent = {
        post_text: postText,
        first_comment: firstComment
      };
    }
    
    return parsedContent;
  } catch (error) {
    console.error('Groq API error:', error);
    throw error;
  }
}

/**
 * Format content for Telegram message - Clean and properly formatted
 */
function formatTelegramMessage(content, group, selectedArticles) {
  const escapeHtml = (text) => {
    return (text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  };
  
  // Force proper line breaks for readability
  const formatPostText = (text) => {
    let formatted = escapeHtml(text || '');
    
    // Ensure blank line after title (first line)
    const lines = formatted.split('\n');
    if (lines.length > 1 && lines[1].trim() !== '') {
      lines.splice(1, 0, ''); // Insert blank line after title
    }
    formatted = lines.join('\n');
    
    // Ensure blank line before each signal emoji
    formatted = formatted.replace(/([^\n])\n(🧠|⚡|🔮)/g, '$1\n\n$2');
    
    // Ensure blank line before "Question for the group"
    formatted = formatted.replace(/([^\n])\n(Question for the group)/g, '$1\n\n$2');
    
    // Ensure blank line before hashtags
    formatted = formatted.replace(/([^\n])\n(#\w)/g, '$1\n\n$2');
    
    return formatted;
  };
  
  const postText = formatPostText(content.post_text || '');
  const firstComment = escapeHtml(content.first_comment || '');
  
  return `<b>📱 ${escapeHtml(group.name)}</b>

━━━━━━━━━━━━━━━━━━━━
<b>📝 POST (copy this):</b>
━━━━━━━━━━━━━━━━━━━━

${postText}

━━━━━━━━━━━━━━━━━━━━
<b>💬 FIRST COMMENT:</b>
━━━━━━━━━━━━━━━━━━━━

${firstComment}`;
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const mode = args[0] || 'daily';
  const targetGroupId = args[1] || null;
  
  console.log('='.repeat(60));
  console.log('LinkedIn Groups Daily Digest Generator');
  console.log(`Mode: ${mode} | Target Group: ${targetGroupId || 'All priority 1-2 groups'}`);
  console.log('='.repeat(60));
  
  try {
    // Load configuration
    const config = loadGroupConfig();
    console.log(`Loaded ${config.groups.length} group configurations`);
    
    // Fetch recent articles
    const hoursAgo = mode === 'weekly' ? 168 : config.defaults.recency_hours;
    const articles = await fetchRecentArticles(hoursAgo);
    
    if (articles.length === 0) {
      const message = `No articles found in the last ${hoursAgo} hours. Please run the news scraper first.`;
      console.log(message);
      await sendTelegramMessage(`<b>LinkedIn Groups Digest</b>\n\n${message}`);
      return;
    }
    
    // Filter groups
    let targetGroups = config.groups;
    if (targetGroupId) {
      targetGroups = config.groups.filter(g => g.id === targetGroupId);
      if (targetGroups.length === 0) {
        throw new Error(`Group not found: ${targetGroupId}`);
      }
    } else {
      // Only process priority 1-2 groups by default (largest groups)
      targetGroups = config.groups.filter(g => g.priority <= 2);
    }
    
    console.log(`Processing ${targetGroups.length} groups...`);
    
    // Generate digest for first priority group (to avoid spamming Telegram)
    // In production, you might want to rotate groups or process all
    const group = targetGroups[0];
    console.log(`\nGenerating digest for: ${group.name}`);
    
    // Select top articles
    const selectedArticles = selectTopArticles(articles, group, config);
    console.log(`Selected ${selectedArticles.length} articles:`);
    selectedArticles.forEach((a, i) => {
      console.log(`  ${i + 1}. [${a.final_score}] ${a.title.substring(0, 50)}...`);
    });
    
    // Generate content with AI
    console.log('\nGenerating content with Groq AI...');
    const content = await generateGroupContent(selectedArticles, group);
    
    // Format and send to Telegram
    const telegramMessage = formatTelegramMessage(content, group, selectedArticles);
    await sendTelegramMessage(telegramMessage);
    
    // Save digest record to prevent article reuse
    const articleIds = selectedArticles.map(a => a.id);
    await saveDigestRecord(group.id, group.name, articleIds);
    
    console.log('\nDigest sent to Telegram successfully!');
    console.log('Article IDs saved to prevent reuse');
    console.log('='.repeat(60));
    
    return {
      success: true,
      group: group.name,
      articlesSelected: selectedArticles.length,
      content
    };
    
  } catch (error) {
    console.error('Fatal error:', error);
    
    // Notify via Telegram
    try {
      await sendTelegramMessage(
        `<b>LinkedIn Groups Digest Error</b>\n\n` +
        `<code>${error.message}</code>\n\n` +
        `Check GitHub Actions logs for details.`
      );
    } catch (telegramError) {
      console.error('Failed to send error notification:', telegramError);
    }
    
    process.exit(1);
  }
}

// CLI handling
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export {
  fetchRecentArticles,
  selectTopArticles,
  generateGroupContent,
  formatTelegramMessage,
  sendTelegramMessage,
  loadGroupConfig,
  getUsedArticleIds,
  saveDigestRecord,
  main
};
