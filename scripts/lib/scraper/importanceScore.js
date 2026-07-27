/**
 * Article importance scoring (0–100).
 * Shared by scrape insert path and LinkedIn AI content generator.
 * Gemini first; keyword heuristic fallback (also used for backfill).
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

async function generateWithGemini(prompt) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const response = await fetch(GEMINI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-goog-api-key': GEMINI_API_KEY,
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

/**
 * Keyword / heuristic importance (no network). Used as Gemini fallback and backfill.
 * @param {{ title?: string, description?: string, content?: string }} article
 * @returns {number} 30–100
 */
export function keywordImportanceScore(article) {
  const title = String(article?.title || '').toLowerCase();
  const description = String(article?.description || '').toLowerCase();
  const content = String(article?.content || '').toLowerCase();

  let fallbackScore = 50;

  if (
    title.includes('ai') ||
    title.includes('artificial intelligence') ||
    title.includes('openai') ||
    title.includes('chatgpt')
  ) {
    fallbackScore += 20;
  }
  if (
    title.includes('google') ||
    title.includes('microsoft') ||
    title.includes('apple') ||
    title.includes('meta')
  ) {
    fallbackScore += 15;
  }
  if (
    title.includes('breakthrough') ||
    title.includes('revolutionary') ||
    title.includes('first') ||
    title.includes('new')
  ) {
    fallbackScore += 10;
  }
  if (content.includes('billion') || content.includes('million')) {
    fallbackScore += 10;
  }
  // Light boost from description when title is sparse
  if (
    description.includes('openai') ||
    description.includes('artificial intelligence')
  ) {
    fallbackScore += 5;
  }

  return Math.min(100, Math.max(30, fallbackScore));
}

/**
 * Analyze article importance and return score (0–100).
 * @param {{ title?: string, description?: string, category?: string, content?: string }} article
 */
export async function analyzeArticleImportance(article) {
  const title = article?.title || '';
  const description = article?.description || '';
  const category = article?.category || '';
  const content = String(article?.content || '');

  const prompt = `Analyze this tech news article and rate its importance/impact on a scale of 0-100.

Consider these factors:
- Innovation level (breakthrough technologies, new products): 30%
- Company significance (major tech companies: OpenAI, Google, Meta, Apple, Microsoft, etc.): 25%
- Global impact (affects millions of users, industry changes): 20%
- Trending topics (AI, robotics, space tech, quantum computing, sustainability): 15%
- Business implications (funding, partnerships, market changes): 10%

Article Details:
Title: ${title}
Description: ${description}
Category: ${category}
Content Preview: ${content.substring(0, 500)}...

Respond with ONLY a number between 0-100 (no explanation):`;

  try {
    const scoreText = await generateWithGemini(prompt);
    const score = parseInt(String(scoreText).trim(), 10);
    return Math.min(100, Math.max(0, Number.isFinite(score) ? score : 50));
  } catch (error) {
    console.error('Error scoring article:', error?.message || error);
    return keywordImportanceScore(article);
  }
}
