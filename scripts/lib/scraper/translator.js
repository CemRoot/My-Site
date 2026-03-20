/**
 * Translation pipeline for the news scraper.
 * Handles Turkish → English translation using Groq AI with multi-model fallback.
 */

import Groq from 'groq-sdk';
import { Ollama } from 'ollama';
import { SCRAPER_CONFIG, GROQ_PRIMARY_MODEL, GROQ_FALLBACK_MODEL, GROQ_LAST_RESORT_MODEL, GROQ_ENHANCEMENT_MODEL, GROQ_FAST_MODEL, OLLAMA_PRIMARY_MODEL, OLLAMA_API_KEY } from './config.js';
import {
  TRANSLATION_SYSTEM_PROMPT,
  createTranslationPrompt,
  ARTICLE_ENHANCEMENT_SYSTEM_PROMPT,
  createArticleEnhancementPrompt,
  validateTokenPreservation,
} from '../../translate/prompt.js';
import { assertContentQuality } from '../../validation/contentQualityCheck.js';
import { validateArticle } from '../../validation/smartArticleProcessor.js';
import { notifyTelegram } from '../../lib/telegram.js';

const groq = new Groq({ apiKey: SCRAPER_CONFIG.GROQ_API_KEY });

const ollama = OLLAMA_API_KEY
  ? new Ollama({
      host: 'https://ollama.com',
      headers: { Authorization: `Bearer ${OLLAMA_API_KEY}` },
    })
  : null;

function preserveWidgets(content) {
  const widgets = [];
  let processedContent = content;

  processedContent = processedContent.replace(/\[\[EMBED:(?:TIKTOK|TWEET|YOUTUBE):[^\]]+\]\]/gi, (match) => {
    const placeholder = `__WIDGET_${widgets.length}__`;
    widgets.push({ type: 'embed_token', content: match, placeholder });
    return placeholder;
  });

  processedContent = processedContent.replace(/Twitter Widget Iframe/gi, (match) => {
    const placeholder = `__WIDGET_${widgets.length}__`;
    widgets.push({ type: 'twitter_iframe', content: match, placeholder });
    return placeholder;
  });

  processedContent = processedContent.replace(/<iframe[^>]*>.*?<\/iframe>/gis, (match) => {
    const placeholder = `__WIDGET_${widgets.length}__`;
    widgets.push({ type: 'iframe_embed', content: match, placeholder });
    return placeholder;
  });

  processedContent = processedContent.replace(/<blockquote[^>]*class="twitter-tweet"[^>]*>.*?<\/blockquote>/gis, (match) => {
    const placeholder = `__WIDGET_${widgets.length}__`;
    widgets.push({ type: 'twitter_blockquote', content: match, placeholder });
    return placeholder;
  });

  const widgetPatterns = [/YouTube Widget/gi, /Instagram Widget/gi, /Social Media Widget/gi, /Widget Iframe/gi];

  widgetPatterns.forEach(pattern => {
    processedContent = processedContent.replace(pattern, (match) => {
      const placeholder = `__WIDGET_${widgets.length}__`;
      widgets.push({ type: 'generic_widget', content: match, placeholder });
      return placeholder;
    });
  });

  return { content: processedContent, widgets };
}

function restoreWidgets(translatedContent, widgets) {
  let result = translatedContent;
  widgets.forEach(widget => {
    result = result.replace(
      new RegExp(widget.placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
      widget.content
    );
  });
  return result;
}

function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  const longer = str1.length > str2.length ? str1 : str2;
  if (longer.length === 0) return 1.0;

  let matches = 0;
  const minLength = Math.min(str1.length, str2.length);
  for (let i = 0; i < minLength; i++) {
    if (str1[i] === str2[i]) matches++;
  }
  return matches / longer.length;
}

async function translateWithModel(model, text, retry = false) {
  const systemPrompt = retry
    ? 'Translate from Turkish to English. Output ONLY the English translation. Do NOT include any notes, explanations, or the original text.'
    : TRANSLATION_SYSTEM_PROMPT;

  const userPrompt = retry
    ? `Translate this Turkish text to English.\n\nCRITICAL RULES:\n1. Output ONLY the English translation, nothing else.\n2. Keep ALL __WIDGET_0__, __WIDGET_1__, __WIDGET_N__ placeholders exactly as-is. Do not translate, remove, or modify them.\n3. No notes, no explanations.\n\nText:\n${text}`
    : createTranslationPrompt(text);

  const completion = await groq.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: retry ? 0.1 : 0.3,
    max_tokens: 4000,
  });

  let translatedText = completion.choices[0]?.message?.content || '';

  if (!translatedText || translatedText.trim().length === 0) {
    throw new Error('Translation returned empty result');
  }

  translatedText = translatedText
    .replace(/^I('m| am) sorry[^.\n]*\.?/gim, '')
    .replace(/^I don'?t understand[^.\n]*\.?/gim, '')
    .replace(/^Could you please (provide|clarify)[^.\n]*\.?/gim, '')
    .replace(/^I('m| am) unable to[^.\n]*\.?/gim, '')
    .replace(/^I cannot[^.\n]*\.?/gim, '')
    .replace(/^Please provide the text[^.\n]*\.?/gim, '')
    .replace(/^What you('re| are) asking for[^.\n]*\.?/gim, '')
    .replace(/^REMINDER:.*$/gim, '')
    .replace(/^Note: I have.*$/gim, '')
    .replace(/^Translate the following.*$/gim, '')
    .replace(/^Translation:.*$/gim, '')
    .replace(/Text to translate:.*$/gim, '')
    .trim();

  const turkishChars = /[ğüşıöçĞÜŞİÖÇ]/;
  if (turkishChars.test(translatedText) && translatedText.length > 50) {
    const similarity = calculateSimilarity(text, translatedText);
    if (similarity > 0.8) {
      throw new Error(`Translation failed - output still contains Turkish: ${translatedText.substring(0, 100)}...`);
    }
  }

  return translatedText;
}

async function translateWithOllama(text) {
  if (!ollama) throw new Error('Ollama client not configured (missing API key)');

  const completion = await ollama.chat({
    model: OLLAMA_PRIMARY_MODEL,
    messages: [
      { role: 'system', content: TRANSLATION_SYSTEM_PROMPT },
      { role: 'user', content: createTranslationPrompt(text) },
    ],
    options: { temperature: 0.3 },
  });

  let translatedText = completion.message?.content || '';

  if (!translatedText || translatedText.trim().length === 0) {
    throw new Error('Ollama translation returned empty result');
  }

  translatedText = translatedText
    .replace(/^I('m| am) sorry[^.\n]*\.?/gim, '')
    .replace(/^I don'?t understand[^.\n]*\.?/gim, '')
    .replace(/^Could you please (provide|clarify)[^.\n]*\.?/gim, '')
    .replace(/^I('m| am) unable to[^.\n]*\.?/gim, '')
    .replace(/^I cannot[^.\n]*\.?/gim, '')
    .replace(/^Please provide the text[^.\n]*\.?/gim, '')
    .replace(/^REMINDER:.*$/gim, '')
    .replace(/^Note: I have.*$/gim, '')
    .replace(/^Translation:.*$/gim, '')
    .trim();

  const turkishChars = /[ğüşıöçĞÜŞİÖÇ]/;
  if (turkishChars.test(translatedText) && translatedText.length > 50) {
    const similarity = calculateSimilarity(text, translatedText);
    if (similarity > 0.8) {
      throw new Error(`Ollama translation still contains Turkish: ${translatedText.substring(0, 100)}...`);
    }
  }

  return translatedText;
}

async function enhanceArticleWithTLDR(content) {
  try {
    console.log(`   📝 Enhancing article with TL;DR and key highlights...`);

    const completion = await groq.chat.completions.create({
      model: GROQ_ENHANCEMENT_MODEL,
      messages: [
        { role: 'system', content: ARTICLE_ENHANCEMENT_SYSTEM_PROMPT },
        { role: 'user', content: createArticleEnhancementPrompt(content) },
      ],
      temperature: 0.5,
      max_tokens: 4000,
    });

    let enhancedContent = completion.choices[0]?.message?.content || content;

    enhancedContent = enhancedContent
      .replace(/^REMINDER:.*$/gim, '')
      .replace(/^Note: I have.*$/gim, '')
      .replace(/^Analyze this article.*$/gim, '')
      .replace(/^Article content:.*$/gim, '')
      .trim();

    if (!enhancedContent.includes('TL;DR') && !enhancedContent.includes('TLDR')) {
      console.log(`   ⚠️  TL;DR not found in response, using original content`);
      return content;
    }

    console.log(`   ✅ Article enhanced with TL;DR and key highlights`);
    return enhancedContent;
  } catch (error) {
    console.error(`   ⚠️  Failed to enhance article: ${error.message}`);
    return content;
  }
}

const INSTRUCTION_LEAKAGE_PATTERNS = [
  '**Translation**', '**Reasoning', 'REMINDER:', 'Translate the following',
  'text to translate:', 'Note: The translation', 'Note: I have', 'Note: This is',
  'Turkish text provided', 'summary of the content', 'Here is the translation',
  "Here's the translation", 'I have translated', 'Translation:', 'Translated text:',
  'Return the enhanced article', 'followed by the full article',
  'with TL;DR and key highlights', 'Analyze this article', 'add a TL;DR summary',
  'Your task:', 'Format the output as follows', 'Original article content follows',
  "I've removed the Turkish", 'I have removed the Turkish',
  'translated the text accordingly', 'preserved the markdown formatting',
  'kept the paragraph structure', "I've also preserved", 'I have also preserved',
  'removed the Turkish characters',
  "I'm unable to translate", 'I am unable to translate', 'I cannot translate',
  'Unable to translate', 'contains non-English characters',
  'contains non-Latin characters', 'I apologize, but', "I'm sorry, but I cannot",
  'As an AI', 'As a language model', 'I cannot process', "I'm not able to",
  'I do not have the ability', 'cannot be translated', 'cannot translate this',
  'The above text', 'as requested', 'Please note that',
  "i'm sorry", 'i am sorry', "i don't understand", 'i do not understand',
  'could you please provide', 'please provide the text',
  "what you're asking for", 'what you are asking for',
];

function validateTranslationQuality(result) {
  const turkishChars = /[ğüşıöçĞÜŞİÖÇ]/;
  const cjkChars = /[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/;
  const otherNonLatin = /[\u0600-\u06ff\u0590-\u05ff\u0e00-\u0e7f\u0400-\u04ff]/;

  const latinChars = result.replace(/[\s\d\p{P}]/gu, '').match(/[a-zA-ZÀ-ÿ]/g) || [];
  const totalChars = result.replace(/[\s\d\p{P}]/gu, '').length;
  const latinRatio = totalChars > 0 ? latinChars.length / totalChars : 1;

  const hasInstructionLeakage = INSTRUCTION_LEAKAGE_PATTERNS.some(p =>
    result.toLowerCase().includes(p.toLowerCase())
  );

  if (turkishChars.test(result)) return { valid: false, reason: 'still contains Turkish characters' };
  if (cjkChars.test(result)) return { valid: false, reason: 'contains Chinese/Japanese/Korean characters' };
  if (otherNonLatin.test(result)) return { valid: false, reason: 'contains non-Latin characters (Arabic/Hebrew/Cyrillic)' };
  if (latinRatio < 0.8) return { valid: false, reason: `not mostly English (only ${(latinRatio * 100).toFixed(1)}% Latin chars)` };
  if (hasInstructionLeakage) return { valid: false, reason: 'contains instruction leakage (LLM added notes/meta-text)' };

  return { valid: true };
}

export async function translateText(text, useOllama = false, fastMode = false) {
  if (!text || text.trim().length === 0) return text;

  const { content: cleanContent, widgets } = preserveWidgets(text);
  let translatedContent = null;

  // Ollama Cloud — only used for content translation (useOllama=true)
  if (useOllama && ollama) {
    try {
      const result = await translateWithOllama(cleanContent);
      const quality = validateTranslationQuality(result);
      if (quality.valid) {
        translatedContent = result;
        console.log(`    ✅ Ollama (${OLLAMA_PRIMARY_MODEL}) translation succeeded`);
      } else {
        console.warn(`    ⚠️  Ollama quality check failed: ${quality.reason}`);
      }
    } catch (error) {
      console.warn(`    ⚠️  Ollama translation failed: ${error.message}`);
      notifyTelegram(`⚠️ <b>Ollama Fallback</b>\nGroq cascade started\n<code>${error.message.substring(0,100)}</code>`);
    }
  }

  const models = fastMode
    ? [GROQ_FAST_MODEL, GROQ_PRIMARY_MODEL, GROQ_LAST_RESORT_MODEL]
    : [GROQ_PRIMARY_MODEL, GROQ_FALLBACK_MODEL, GROQ_LAST_RESORT_MODEL];

  for (let i = 0; i < models.length && !translatedContent; i++) {
    const model = models[i];

    for (let attempt = 0; attempt < 2; attempt++) {
      const isRetry = attempt > 0;

      try {
        const result = await translateWithModel(model, cleanContent, isRetry);
        const quality = validateTranslationQuality(result);

        if (quality.valid) {
          translatedContent = result;
          break;
        } else {
          throw new Error(`Translation quality check failed - ${quality.reason}`);
        }
      } catch (error) {
        const msg = String(error?.message || error);
        const isRateLimit = msg.includes('429') || msg.includes('rate_limit') || msg.includes('Rate limit');

        if (isRetry || i === models.length - 1) {
          console.warn(`⚠️ Model ${model} failed${isRetry ? ' (retry)' : ''}: ${msg}`);
        }

        if (isRateLimit && i < models.length - 1) {
          console.log(`⏳ Rate limit detected, waiting 3 seconds before trying next model...`);
          await new Promise(resolve => setTimeout(resolve, 3000));
          break;
        }

        if (!isRetry) continue;
        if (i === models.length - 1) {
          notifyTelegram(`❌ <b>Tüm modeller başarısız</b>\n<code>${msg.substring(0,150)}</code>`);
          throw new Error(`All translation models failed. Last error: ${msg}`);
        }
        break;
      }
    }

    if (translatedContent) break;
  }

  if (!translatedContent) {
    notifyTelegram(`❌ <b>Tüm modeller başarısız</b>\n<code>All translation models exhausted</code>`);
    throw new Error('All translation models failed');
  }

  console.log(`    🔄 Restoring ${widgets.length} widgets...`);
  let finalContent = restoreWidgets(translatedContent, widgets);
  console.log(`    ✅ After restore, __WIDGET remaining: ${(finalContent.match(/__WIDGET_\d+__/g)||[]).length}`);

  // Strip hallucinated embed tokens the LLM may have invented
  const legitimateTokens = new Set(widgets.filter(w => w.type === 'embed_token').map(w => w.content));
  finalContent = finalContent.replace(/\[\[EMBED:(?:TIKTOK|TWEET|YOUTUBE):[^\]]+\]\]/gi, (match) => {
    if (legitimateTokens.has(match)) return match;
    console.warn(`    ⚠️  Removed hallucinated embed token: ${match.substring(0, 60)}`);
    return '';
  });

  const tokenCheck = validateTokenPreservation(text, finalContent);
  if (!tokenCheck.valid && tokenCheck.missingTokens?.length > 0) {
    console.warn(`    ⚠️  ${tokenCheck.missingTokens.length} embed token(s) lost during translation — re-injecting`);
    let patched = finalContent;
    for (const missing of tokenCheck.missingTokens) {
      patched = patched.trimEnd() + '\n\n' + missing + '\n\n';
    }
    return patched.replace(/\n{3,}/g, '\n\n').trim();
  }

  return finalContent.replace(/\n{3,}/g, '\n\n').trim();
}

export function cleanTranslation(text) {
  if (!text) return text;

  let cleaned = text;

  const allPatterns = [
    /^REMINDER:.*$/gim, /^Note: I have.*$/gim, /^I have preserved.*$/gim,
    /^I have kept.*$/gim, /^Translate the following.*$/gim, /^Translation:.*$/gim,
    /^Text to translate:.*$/gim, /^Here is the translation.*$/gim,
    /^Here's the translation.*$/gim, /^The translation is.*$/gim,
    /Return the enhanced article.*$/gim, /followed by the full article.*$/gim,
    /with TL;DR and key highlights.*$/gim, /^Analyze this article.*$/gim,
    /^add a TL;DR summary.*$/gim, /^Your task:.*$/gim,
    /^Format the output as follows.*$/gim, /Original article content follows.*$/gim,
    /Note: I've removed.*Turkish.*$/gim, /Note: I have removed.*Turkish.*$/gim,
    /I've also preserved.*formatting.*$/gim, /I have also preserved.*formatting.*$/gim,
    /translated the text accordingly.*$/gim, /kept the paragraph structure.*$/gim,
    /preserved the markdown formatting.*$/gim, /removed the Turkish characters.*$/gim,
    /I'm unable to translate.*$/gim, /I am unable to translate.*$/gim,
    /I cannot translate.*$/gim, /Unable to translate.*$/gim,
    /contains non-English characters.*$/gim, /contains non-Latin characters.*$/gim,
    /I apologize, but.*$/gim, /I'm sorry, but I cannot.*$/gim,
    /^As an AI.*$/gim, /^As a language model.*$/gim,
    /I cannot process.*$/gim, /I'm not able to.*$/gim,
  ];

  allPatterns.forEach(p => { cleaned = cleaned.replace(p, ''); });

  cleaned = cleaned.replace(/\[[^\]]*\]\([^)]*nuvemmag\.com[^)]*\)/gi, '');
  cleaned = cleaned.replace(/https?:\/\/(?:www\.)?nuvemmag\.com[^\s\)>\]"']*/gi, '');
  cleaned = cleaned.replace(/\bNuvemMag\b/gi, '');
  cleaned = cleaned.replace(/^\s*\[\s*\]\([^)]*\)\s*$/gm, '');
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();

  cleaned = cleaned.replace(/\bYZ['']nin\b/g, "AI's");
  cleaned = cleaned.replace(/\bYZ[''](?:ye|yi|ya|yu|da|de|dan|den|in|un|ün|le|li|lere|lerin)\b/g, 'AI');
  cleaned = cleaned.replace(/\bYZ\b/g, 'AI');

  cleaned = cleaned.replace(/\byapay zeka(?:n[\u0131i]n)(?![a-z\u0131\u0130\u00e7\u00f6\u015f\u011f\u00fc])/gi, "AI's");
  cleaned = cleaned.replace(/\byapay zeka(?:y[\u0131i]|y[ae]|d[ae]n?)(?![a-z\u0131\u0130\u00e7\u00f6\u015f\u011f\u00fc])/gi, 'AI');
  cleaned = cleaned.replace(/\byapay zeka(?![a-z\u0131\u0130\u00e7\u00f6\u015f\u011f\u00fc])/gi, 'AI');

  cleaned = cleaned.replace(/^#{1,6}\s+(.+)$/gm, '**$1**');

  cleaned = cleaned.replace(/!(\s*\n)/g, '.$1');
  cleaned = cleaned.replace(/!(\s*$)/gm, '.');
  cleaned = cleaned.replace(/^\s*!\s*$/gm, '');

  const lines = cleaned.split('\n');
  const filteredLines = lines.filter(line => {
    const trimmed = line.trim();
    return trimmed !== '!' && trimmed !== '*' && trimmed !== '**' && trimmed !== '***';
  });
  cleaned = filteredLines.join('\n');
  cleaned = cleaned.replace(/\*\*\s*\*\*/g, '');

  return cleaned.trim();
}

export async function translateArticle(article) {
  console.log(`🌐 Translating article with Groq AI...`);
  console.log(`   Title length: ${article.title.length} chars`);
  console.log(`   Content length: ${article.content.length} chars`);

  try {
    console.log(`   🔤 Translating title (fast)...`);
    const translatedTitle = cleanTranslation(await translateText(article.title, false, true));
    await new Promise(resolve => setTimeout(resolve, SCRAPER_CONFIG.TRANSLATION_DELAY));

    console.log(`   📝 Translating description (fast)...`);
    const translatedDescription = cleanTranslation(await translateText(article.description, false, true));
    await new Promise(resolve => setTimeout(resolve, SCRAPER_CONFIG.TRANSLATION_DELAY));

    console.log(`   📄 Translating full content...`);
    let translatedContent = cleanTranslation(await translateText(article.content, true, false));

    await new Promise(resolve => setTimeout(resolve, SCRAPER_CONFIG.TRANSLATION_DELAY));
    translatedContent = await enhanceArticleWithTLDR(translatedContent);

    if (translatedTitle.includes('REMINDER:') ||
        translatedTitle.includes('Note: I have') ||
        translatedContent.includes('Text to translate:')) {
      throw new Error('Translation contains instruction leakage - rejecting');
    }

    const translatedArticle = {
      ...article,
      title: translatedTitle,
      description: translatedDescription,
      content: translatedContent,
      originalTitle: article.title,
      originalContent: article.content,
    };

    console.log(`   🔍 Running legacy content quality check...`);
    assertContentQuality(translatedArticle);
    console.log(`   ✅ Legacy quality check PASSED`);

    console.log(`   🔍 Running smart validation...`);
    const validation = validateArticle(translatedArticle);

    if (!validation.isValid) {
      const criticalErrors = validation.errors.filter(e =>
        e.includes('Turkish') || e.includes('year') ||
        e.includes('instruction leakage') || e.includes('translation error')
      );
      if (criticalErrors.length > 0) {
        throw new Error(`Smart validation failed: ${criticalErrors.join('; ')}`);
      }
    }

    console.log(`   ✅ Smart validation passed (Score: ${validation.score.toFixed(1)}/100)`);
    console.log(`   ✅ Translation complete and validated`);

    return translatedArticle;
  } catch (error) {
    console.error(`❌ Translation failed: ${error.message}`);
    return article;
  }
}
