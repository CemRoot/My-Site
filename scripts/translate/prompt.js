/**
 * LLM Translation Prompt Templates
 * Ensures embed tokens are preserved during translation
 */

/**
 * System prompt for translation
 * Instructs the LLM to preserve embed tokens exactly as they are
 */
export const TRANSLATION_SYSTEM_PROMPT = `You are a professional translator. Translate from Turkish to English.

CRITICAL RULES FOR EMBED TOKENS:
- Any text inside double square brackets like [[EMBED:...]] must be copied EXACTLY as is
- DO NOT translate, modify, or reformat these tokens in any way
- DO NOT add spaces, newlines, or escape characters inside the brackets
- These tokens represent embedded social media content and must remain unchanged

Examples of tokens to preserve:
[[EMBED:TIKTOK:https://www.tiktok.com/@user/video/123456]]
[[EMBED:TWEET:1876543212345678901]]
[[EMBED:YOUTUBE:dQw4w9WgXcQ]]

Translation rules:
- Translate ONLY the Turkish text provided by the user
- Output ONLY the English translation, nothing else
- Do NOT include any explanations, notes, or meta-commentary
- Do NOT repeat instructions or prompts
- Maintain natural, fluent English
- Preserve markdown formatting (headers, lists, bold, italic, links)
- Keep paragraph structure
`;

/**
 * User prompt template for translation
 * IMPORTANT: Only contains the content, no instructions (instructions are in system prompt)
 * @param {string} content - Content to translate
 * @param {string} sourceLang - Source language (default: Turkish)
 * @param {string} targetLang - Target language (default: English)
 * @returns {string} Just the content to translate
 */
export function createTranslationPrompt(content, sourceLang = 'Turkish', targetLang = 'English') {
  // Return ONLY the content - all instructions are in the system prompt
  return content;
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

