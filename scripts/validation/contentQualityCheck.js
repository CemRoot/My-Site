/**
 * Content Quality Check
 * Validates scraped article content to ensure no unwanted elements remain
 * Returns validation errors if any issues are found
 * Can also auto-fix certain issues
 */

/**
 * Clean Nuvemmag branding from content
 * @param {string} content - Content to clean
 * @returns {string} Cleaned content
 */
export function cleanNuvemmagBranding(content) {
  if (!content) return content;
  
  let cleaned = content;
  // Remove markdown links with Nuvemmag URLs
  cleaned = cleaned.replace(/\[[^\]]*\]\([^)]*nuvemmag\.com[^)]*\)/gi, '');
  // Remove standalone URLs
  cleaned = cleaned.replace(/https?:\/\/(?:www\.)?nuvemmag\.com[^\s\)>\]"']*/gi, '');
  // Remove brand name mentions (but preserve context)
  cleaned = cleaned.replace(/\bNuvemMag\b/gi, '');
  // Clean empty markdown links
  cleaned = cleaned.replace(/\[\s*\]\([^)]*\)/g, '');
  // Clean excessive whitespace
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();
  
  return cleaned;
}

/**
 * Validates article content for quality issues
 * @param {Object} article - Article object with title, description, content
 * @param {boolean} autoFix - If true, returns fixed content instead of errors
 * @returns {Object} { isValid: boolean, errors: string[], warnings: string[], fixedContent?: string }
 */
export function validateArticleContent(article, autoFix = false) {
  const errors = [];
  const warnings = [];
  
  let { title, description, content } = article;
  let wasFixed = false;
  
  // ============================================
  // CRITICAL ERRORS (Must not exist)
  // ============================================
  
  // 1. Check for Nuvemmag branding - auto-fix if enabled
  if (content.includes('nuvemmag.com') || content.includes('NuvemMag')) {
    if (autoFix) {
      content = cleanNuvemmagBranding(content);
      wasFixed = true;
      warnings.push('⚠️ Auto-fixed: Removed Nuvemmag branding/URLs');
    } else {
      errors.push('❌ Contains Nuvemmag branding/URLs');
    }
  }
  
  // 2. Check for navigation/category links
  if (content.includes('post-category')) {
    errors.push('❌ Contains category URLs');
  }
  
  // 3. Check for header navigation
  const headerPatterns = [
    'Ana Sayfa',
    'Ana SayfaEn',
    'En Son Haberler',
    'Yapay Zeka Uygulamaları'
  ];
  
  for (const pattern of headerPatterns) {
    if (content.includes(pattern)) {
      errors.push(`❌ Contains navigation text: "${pattern}"`);
      break;
    }
  }
  
  // 4. Check if content starts with date (should not)
  if (content.match(/^\d{1,2}\/\d{1,2}\/\d{4}/)) {
    errors.push('❌ Content starts with date (header not removed)');
  }
  
  // 5. Check for YouTube UI text
  const youtubeUIPatterns = [
    /youtube\.com\/channel/,
    /embeds_referring_euri/,
    /^\s*(Info|Share|Subscribe)\s*$/mi,
    /\d+\.?\d*[KM]\s+subscribers/i
  ];
  
  for (const pattern of youtubeUIPatterns) {
    if (content.match(pattern)) {
      errors.push('❌ Contains YouTube UI text');
      break;
    }
  }
  
  // 6. Check for example placeholder leakage (from system prompts)
  if (content.includes('VIDEO_ID_HERE') || content.includes('123456789012345678')) {
    errors.push('❌ CRITICAL: Contains example placeholder from system prompt!');
  }
  
  // 7. Check for translation/enhancement instruction leakage
  const instructionPatterns = [
    // Translation prompt leakage
    'REMINDER:',
    'Note: I have',
    'Note: The translation',
    'Note: This is',
    'Text to translate:',
    'Keep all [[EMBED',
    'Turkish text provided',
    'summary of the content',
    'Here is the translation',
    'Here\'s the translation',
    'I have translated',
    'Translation:',
    'Translated text:',
    'The above text',
    'as requested',
    'Please note that',
    // Enhancement prompt leakage (TL;DR generation)
    'Return the enhanced article',
    'followed by the full article',
    'with TL;DR and key highlights',
    'Analyze this article',
    'add a TL;DR summary',
    'Your task:',
    'Format the output as follows',
    'Original article content follows',
    // Translation meta-commentary leakage
    'I\'ve removed the Turkish',
    'I have removed the Turkish',
    'translated the text accordingly',
    'preserved the markdown formatting',
    'kept the paragraph structure',
    'I\'ve also preserved',
    'I have also preserved',
    'removed the Turkish characters',
    // AI REFUSAL MESSAGES (CRITICAL - NEVER ALLOW)
    'I\'m unable to translate',
    'I am unable to translate',
    'I cannot translate',
    'Unable to translate',
    'contains non-English characters',
    'contains non-Latin characters',
    'I apologize, but',
    'I\'m sorry, but I cannot',
    'As an AI',
    'As a language model',
    'I cannot process',
    'I\'m not able to',
    'I do not have the ability',
    'cannot be translated',
    'cannot translate this'
  ];
  
  for (const pattern of instructionPatterns) {
    if (content.includes(pattern) || title.includes(pattern) || description.includes(pattern)) {
      errors.push(`❌ CRITICAL: Translation instruction leakage detected: "${pattern}"`);
      break;
    }
  }
  
  // 8. Check for non-English characters (Chinese, Japanese, Korean, Arabic, etc.)
  const cjkChars = /[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/;
  const arabicHebrewChars = /[\u0600-\u06ff\u0590-\u05ff]/;
  const cyrillicChars = /[\u0400-\u04ff]/;
  const turkishChars = /[ğüşıöçĞÜŞİÖÇ]/;
  
  const textToCheck = `${title} ${description} ${content}`;
  
  if (cjkChars.test(textToCheck)) {
    errors.push('❌ CRITICAL: Contains Chinese/Japanese/Korean characters');
  }
  if (arabicHebrewChars.test(textToCheck)) {
    errors.push('❌ CRITICAL: Contains Arabic/Hebrew characters');
  }
  if (cyrillicChars.test(textToCheck)) {
    errors.push('❌ CRITICAL: Contains Cyrillic (Russian) characters');
  }
  if (turkishChars.test(title) || turkishChars.test(description)) {
    // Turkish in title/description is critical error
    errors.push('❌ CRITICAL: Title or description contains Turkish characters');
  } else if (turkishChars.test(content)) {
    // Turkish in content is a warning (might be a quote or name)
    warnings.push('⚠️  Content contains Turkish characters (may be intentional)');
  }
  
  // 9. Check for footer text
  if (content.includes('Pinetent Digital') || content.includes('Tüm Hakları Saklıdır')) {
    errors.push('❌ Contains footer text');
  }
  
  // 9. Check for "İlginizi Çekebilir" (related articles section)
  if (content.includes('İlginizi Çekebilir')) {
    errors.push('❌ Contains related articles section');
  }
  
  // 10. Check for empty markdown links
  if (content.match(/\[\]\([^\)]*\)/)) {
    errors.push('❌ Contains empty markdown links []()');
  }
  
  // ============================================
  // WARNINGS (Should be reviewed)
  // ============================================
  
  // 1. Check for embed tokens (should have at least some embeds in social media articles)
  const embedCount = (content.match(/\[\[EMBED:/g) || []).length;
  if (embedCount === 0) {
    warnings.push('⚠️  No embed tokens found (may be normal if article has no social media)');
  }
  
  // 2. Check content length
  if (content.length < 500) {
    warnings.push('⚠️  Content is very short (< 500 chars)');
  }
  
  // 3. Check for excessive whitespace
  if (content.match(/\n{4,}/)) {
    warnings.push('⚠️  Contains excessive whitespace (4+ newlines)');
  }
  
  // 4. Check title length
  if (title.length > 200) {
    warnings.push('⚠️  Title is very long (> 200 chars)');
  }
  
  // 5. Check for incomplete markdown
  const openBrackets = (content.match(/\[/g) || []).length;
  const closeBrackets = (content.match(/\]/g) || []).length;
  const openParens = (content.match(/\(/g) || []).length;
  const closeParens = (content.match(/\)/g) || []).length;
  
  if (openBrackets !== closeBrackets || openParens !== closeParens) {
    warnings.push('⚠️  Unbalanced markdown brackets/parentheses');
  }
  
  // ============================================
  // RETURN VALIDATION RESULT
  // ============================================
  
  const result = {
    isValid: errors.length === 0,
    errors,
    warnings,
    stats: {
      contentLength: content.length,
      embedCount,
      titleLength: title.length,
      descriptionLength: description.length
    }
  };
  
  // Add fixed content if auto-fix was enabled and changes were made
  if (autoFix && wasFixed) {
    result.fixedContent = content;
  }
  
  return result;
}

/**
 * Prints validation result to console
 * @param {Object} result - Validation result from validateArticleContent
 * @param {string} articleTitle - Title of the article
 */
export function printValidationResult(result, articleTitle) {
  console.log('\n' + '='.repeat(80));
  console.log('📋 CONTENT QUALITY CHECK');
  console.log('='.repeat(80));
  console.log(`Article: ${articleTitle.substring(0, 60)}...`);
  console.log('-'.repeat(80));
  
  if (result.isValid) {
    console.log('✅ PASSED - No critical issues found');
  } else {
    console.log('❌ FAILED - Critical issues detected:');
    result.errors.forEach(error => console.log(`   ${error}`));
  }
  
  if (result.warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    result.warnings.forEach(warning => console.log(`   ${warning}`));
  }
  
  console.log('\n📊 STATS:');
  console.log(`   Content Length: ${result.stats.contentLength} chars`);
  console.log(`   Embed Count: ${result.stats.embedCount}`);
  console.log(`   Title Length: ${result.stats.titleLength} chars`);
  console.log(`   Description Length: ${result.stats.descriptionLength} chars`);
  console.log('='.repeat(80) + '\n');
  
  return result.isValid;
}

/**
 * Throws an error if validation fails (for use in scraper)
 * @param {Object} article - Article object
 * @throws {Error} If validation fails
 */
export function assertContentQuality(article) {
  const result = validateArticleContent(article);
  
  if (!result.isValid) {
    const errorMessage = `Content quality check failed:\n${result.errors.join('\n')}`;
    throw new Error(errorMessage);
  }
  
  // Log warnings but don't fail
  if (result.warnings.length > 0) {
    console.log('⚠️  Quality warnings (not blocking):');
    result.warnings.forEach(w => console.log(`   ${w}`));
  }
}

