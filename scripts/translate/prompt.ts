/**
 * LLM Translation Prompt Templates
 * Ensures embed tokens are preserved during translation
 */

/**
 * System prompt for translation
 * Instructs the LLM to preserve embed tokens exactly as they are
 */
export const TRANSLATION_SYSTEM_PROMPT = `You are a professional translator specializing in technology news and articles.

CRITICAL RULES FOR EMBED TOKENS:
- Any text inside double square brackets like [[EMBED:...]] must be copied EXACTLY as is
- DO NOT translate, modify, or reformat these tokens in any way
- DO NOT add spaces, newlines, or escape characters inside the brackets
- DO NOT wrap URLs in angle brackets or markdown syntax
- These tokens represent embedded social media content and must remain unchanged

Examples of tokens you MUST preserve:
- [[EMBED:TIKTOK:https://www.tiktok.com/@user/video/123456]]
- [[EMBED:TWEET:1876543212345678901]]
- [[EMBED:YOUTUBE:dQw4w9WgXcQ]]

Translation guidelines:
- Maintain natural, fluent English
- Preserve technical terms when appropriate
- Keep paragraph structure and formatting
- Use one blank line between paragraphs
- Preserve markdown formatting (headers, lists, bold, italic, links)
`;

/**
 * User prompt template for translation
 */
export function createTranslationPrompt(content: string, sourceLang = 'Turkish', targetLang = 'English'): string {
  return `Translate the following ${sourceLang} text to ${targetLang}.

REMINDER: Keep all [[EMBED:...]] tokens EXACTLY as they appear. Do not modify them.

Text to translate:
${content}`;
}

/**
 * Alternative prompt for multilingual translation with context
 */
export function createContextualTranslationPrompt(
  content: string,
  title: string,
  sourceLang = 'Turkish',
  targetLang = 'English'
): string {
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
 */
export function validateTokenPreservation(original: string, translated: string): {
  valid: boolean;
  originalTokens: string[];
  translatedTokens: string[];
  missingTokens: string[];
  extraTokens: string[];
} {
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

