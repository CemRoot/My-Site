/**
 * AI Content Generator using Google Gemini 2.0 Flash
 * Analyzes tech news and generates LinkedIn content
 */

import 'dotenv/config';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

/**
 * Generate content using Google Gemini 2.0 Flash
 */
async function generateWithGemini(prompt) {
  try {
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': GEMINI_API_KEY
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.candidates[0]?.content?.parts[0]?.text || '';
  } catch (error) {
    console.error('❌ Gemini API error:', error.message);
    throw error;
  }
}

/**
 * Analyze article importance and generate score (0-100)
 */
export async function analyzeArticleImportance(article) {
  const prompt = `Analyze this tech news article and rate its importance/impact on a scale of 0-100.

Consider these factors:
- Innovation level (breakthrough technologies, new products): 30%
- Company significance (major tech companies: OpenAI, Google, Meta, Apple, Microsoft, etc.): 25%
- Global impact (affects millions of users, industry changes): 20%
- Trending topics (AI, robotics, space tech, quantum computing, sustainability): 15%
- Business implications (funding, partnerships, market changes): 10%

Article Details:
Title: ${article.title}
Description: ${article.description}
Category: ${article.category}
Content Preview: ${article.content.substring(0, 500)}...

Respond with ONLY a number between 0-100 (no explanation):`;

  try {
    const scoreText = await generateWithGemini(prompt);
    const score = parseInt(scoreText.trim());
    return Math.min(100, Math.max(0, score || 50)); // Ensure 0-100 range
  } catch (error) {
    console.error('Error scoring article:', error);
    return 50; // Default neutral score
  }
}

/**
 * Generate LinkedIn post content
 */
export async function generateLinkedInContent(article) {
  const prompt = `Create an engaging LinkedIn post for this tech news article.

Requirements:
- Write in English
- Keep it concise (150-250 words)
- Use professional but engaging tone
- Include relevant emojis (2-3 maximum)
- Add 5-7 relevant hashtags at the end
- Focus on the impact and significance
- Make it shareable and discussion-worthy
- Include a call-to-action or thought-provoking question

Article Details:
Title: ${article.title}
Description: ${article.description}
Category: ${article.category}
Content: ${article.content.substring(0, 800)}...

Format the response as:
POST_CONTENT
---
HASHTAGS: #hashtag1 #hashtag2 #hashtag3`;

  try {
    const content = await generateWithGemini(prompt);
    
    // Split content and hashtags
    const parts = content.split('---');
    const postContent = parts[0]?.trim() || content;
    const hashtags = parts[1]?.replace('HASHTAGS:', '').trim() || '#technology #innovation #tech';
    
    return {
      content: postContent,
      hashtags: hashtags,
      fullPost: `${postContent}\n\n${hashtags}`
    };
  } catch (error) {
    console.error('Error generating LinkedIn content:', error);
    // Fallback content
    return {
      content: `🚀 ${article.title}\n\n${article.description}`,
      hashtags: '#technology #innovation #tech #ai',
      fullPost: `🚀 ${article.title}\n\n${article.description}\n\n#technology #innovation #tech #ai`
    };
  }
}

/**
 * Generate trending hashtags for a topic
 */
export async function generateTrendingHashtags(topic, category) {
  const prompt = `Generate 8-10 trending and relevant hashtags for this tech topic.

Topic: ${topic}
Category: ${category}

Requirements:
- Mix of broad and specific hashtags
- Include trending tech hashtags
- Consider LinkedIn audience (professionals, entrepreneurs, tech enthusiasts)
- No spaces in hashtags
- Return as comma-separated list

Example format: #ai, #technology, #innovation, #startup, #digitaltransformation`;

  try {
    const hashtagsText = await generateWithGemini(prompt);
    return hashtagsText.trim();
  } catch (error) {
    console.error('Error generating hashtags:', error);
    return '#technology, #innovation, #tech, #ai, #digitaltransformation';
  }
}

/**
 * Analyze multiple articles and select top ones
 */
export async function selectTopArticles(articles, maxCount = 5) {
  console.log(`🧠 Analyzing ${articles.length} articles with Gemini AI...`);
  
  const scoredArticles = [];
  
  for (const article of articles) {
    try {
      console.log(`   📊 Scoring: ${article.title.substring(0, 50)}...`);
      
      const score = await analyzeArticleImportance(article);
      const linkedinContent = await generateLinkedInContent(article);
      
      scoredArticles.push({
        ...article,
        ai_score: score,
        suggested_content: linkedinContent.fullPost,
        linkedin_content: linkedinContent.content,
        hashtags: linkedinContent.hashtags
      });
      
      console.log(`   ✅ Score: ${score}/100`);
      
      // Rate limiting - wait between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`   ❌ Error processing article: ${error.message}`);
      // Continue with next article
    }
  }
  
  // Sort by score and return top articles
  const topArticles = scoredArticles
    .sort((a, b) => b.ai_score - a.ai_score)
    .slice(0, maxCount);
  
  console.log(`🎯 Selected top ${topArticles.length} articles:`);
  topArticles.forEach((article, index) => {
    console.log(`   ${index + 1}. [${article.ai_score}] ${article.title.substring(0, 60)}...`);
  });
  
  return topArticles;
}

/**
 * Generate summary report for Telegram
 */
export async function generateTelegramSummary(articles) {
  const prompt = `Create a concise summary report for these top tech articles.

Articles:
${articles.map((article, index) => 
  `${index + 1}. [Score: ${article.ai_score}] ${article.title}\n   ${article.description.substring(0, 100)}...`
).join('\n\n')}

Create a brief executive summary (2-3 sentences) highlighting the main themes and significance of today's tech news.`;

  try {
    const summary = await generateWithGemini(prompt);
    return summary.trim();
  } catch (error) {
    console.error('Error generating summary:', error);
    return `📊 Today's analysis complete: ${articles.length} high-impact tech stories selected for LinkedIn sharing.`;
  }
}

export default {
  analyzeArticleImportance,
  generateLinkedInContent,
  generateTrendingHashtags,
  selectTopArticles,
  generateTelegramSummary
};
