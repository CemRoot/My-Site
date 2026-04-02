/**
 * LLM Translation Prompt Templates
 * Ensures embed tokens are preserved during translation
 */

/**
 * System prompt for translation
 * Instructs the LLM to preserve embed tokens exactly as they are
 */
export const TRANSLATION_SYSTEM_PROMPT = `You are a professional tech journalist writing for an English-speaking audience.

Your job is to read the source article (written in Turkish) and rewrite it as an original, high-quality English tech news article.

WRITING RULES:
- Write in a clear, neutral, professional journalistic tone
- Do NOT translate word-for-word — understand the content and rewrite it naturally
- Keep all facts, data points, quotes, and statistics accurate
- Use varied sentence structure — avoid repetitive phrasing
- Never end a sentence or paragraph with an exclamation mark unless it is inside a direct quote
- No exclamation marks in body text at all
- Paragraphs should flow naturally
- Do not add your own opinions or speculation beyond what the source states

EMBED TOKEN RULES (CRITICAL):
- Embed tokens follow the format [[EMBED:TYPE:DATA]] where TYPE is YOUTUBE, TWEET, or TIKTOK. Preserve every token you encounter exactly.
- You MUST keep every embed token exactly as-is in your output
- Place embed tokens on their own line, between paragraphs
- Do not translate, modify, remove, or move embed tokens
- If you see __WIDGET_0__, __WIDGET_1__ etc — keep them exactly as-is

OUTPUT RULES:
- Output ONLY the rewritten article text
- No meta-commentary, no notes, no explanations
- No preamble like "Here is the rewritten article"
- Do NOT use markdown headings (# or ##) — use **bold text** for subheadings instead
- Do NOT output any Turkish characters (ğ, ü, ş, ı, ö, ç)`;

/**
 * System prompt for article content enhancement with TL;DR and key points
 */
export const ARTICLE_ENHANCEMENT_SYSTEM_PROMPT = `You are a professional tech news editor. Analyze the article content and create a concise TL;DR summary and key highlights.

LANGUAGE REQUIREMENTS:
- Output MUST be 100% English
- Do NOT output any Chinese, Japanese, Korean, Arabic, Russian, or other non-English characters
- Do NOT add any meta-commentary, notes, or explanations
- Just output the enhanced article directly

CRITICAL RULES FOR EMBED TOKENS:
- Any text inside double square brackets like [[EMBED:...]] must be preserved EXACTLY as is
- DO NOT modify or reformat these tokens in any way
- These tokens represent embedded social media content

Your task:
1. Create a brief TL;DR (2-3 sentences maximum) summarizing the main point
2. Extract 3-5 key highlights as bullet points
3. Format the output as follows:

TL;DR: [Brief 2-3 sentence summary]

Key Highlights:
• [First key point]
• [Second key point]
• [Third key point]
• [Fourth key point if relevant]
• [Fifth key point if relevant]

[Original article content follows here]

Rules:
- Keep TL;DR concise and engaging
- Key highlights should be specific, informative, and easy to scan
- Use bullet points (•) for highlights
- Preserve all embed tokens [[EMBED:...]] exactly as they appear
- Maintain the original article content after the TL;DR and highlights
- Write in natural, professional American English
- Do NOT add any prefix like "Here is" or suffix like "Note:"
`;

/**
 * Create prompt for article enhancement with TL;DR and highlights
 * @param {string} content - Article content to enhance
 * @returns {string} Formatted prompt
 */
export function createArticleEnhancementPrompt(content) {
  return `Add a TL;DR and Key Highlights block at the top. Then copy the article below EXACTLY as-is — do NOT rewrite or summarize it.

Format:
TL;DR
[2-3 sentence summary]

Key Highlights
• [point]
• [point]
• [point]

---

${content}`;
}

/**
 * User prompt template for full article translation
 */
export function createTranslationPrompt(content) {
  return `Rewrite the following Turkish tech article as an original English news piece.
Follow all rules from your system instructions exactly.
Preserve every [[EMBED:...]] and __WIDGET_N__ token without modification.

Source article:

${content}`;
}

/**
 * User prompt for translating short text (titles, descriptions).
 * Accepts optional article context to improve accuracy.
 */
export function createShortTextTranslationPrompt(content, context = '') {
  const contextBlock = context
    ? `\nArticle context (first 300 chars, for reference only — do NOT include this in your output):\n${context.substring(0, 300)}\n`
    : '';

  return `Translate this Turkish headline to English. Output ONLY the translated headline — nothing else. Do not add explanations, descriptions, or extra sentences.${contextBlock}
${content}`;
}

/**
 * Alternative prompt for multilingual translation with context
 * @param {string} content - Content to translate
 * @param {string} title - Article title
 * @param {string} sourceLang - Source language
 * @param {string} targetLang - Target language
 * @returns {string} Formatted prompt
 */
export function createContextualTranslationPrompt(
  content,
  title,
  sourceLang = 'Turkish',
  targetLang = 'English'
) {
  return `You are translating a technology news article.

Article Title: ${title}

CRITICAL RULES:
1. Preserve ALL [[EMBED:...]] tokens EXACTLY as written
2. Translate from ${sourceLang} to ${targetLang}
3. Maintain technical accuracy
4. Keep markdown formatting intact
5. Use natural, professional language

Content to translate:
${content}`;
}

/**
 * Validation function to check if tokens were preserved
 * @param {string} original - Original text
 * @param {string} translated - Translated text
 * @returns {{valid: boolean, originalTokens: string[], translatedTokens: string[], missingTokens: string[], extraTokens: string[]}}
 */
export function validateTokenPreservation(original, translated) {
  const tokenRegex = /\[\[EMBED:[^\]]+\]\]/g;
  
  const originalTokens = original.match(tokenRegex) || [];
  const translatedTokens = translated.match(tokenRegex) || [];
  
  const originalSet = new Set(originalTokens);
  const translatedSet = new Set(translatedTokens);
  
  const missingTokens = originalTokens.filter(t => !translatedSet.has(t));
  const extraTokens = translatedTokens.filter(t => !originalSet.has(t));
  
  return {
    valid: missingTokens.length === 0 && extraTokens.length === 0,
    originalTokens,
    translatedTokens,
    missingTokens,
    extraTokens
  };
}

