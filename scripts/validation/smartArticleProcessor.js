/**
 * Smart Article Processor
 * Multi-step validation pipeline with quality gates
 * Prevents common errors: wrong dates, Turkish content, bad translations, duplicates
 */

/**
 * Validation result structure
 */
export class ValidationResult {
  constructor() {
    this.isValid = true;
    this.errors = [];
    this.warnings = [];
    this.fixes = [];
    this.score = 100; // Quality score (0-100)
  }

  addError(message, fix = null) {
    this.isValid = false;
    this.errors.push(message);
    this.score -= 20;
    if (fix) {
      this.fixes.push(fix);
    }
  }

  addWarning(message) {
    this.warnings.push(message);
    this.score -= 5;
  }

  addFix(message) {
    this.fixes.push(message);
  }
}

/**
 * Step 1: Validate and fix date
 */
export function validateDate(dateStr, articleUrl) {
  const result = new ValidationResult();
  
  if (!dateStr) {
    result.addError('Date is missing');
    return result;
  }

  // Parse date
  const [day, month, year] = dateStr.split('/').map(Number);
  
  // Validate year (CRITICAL)
  if (year < 2020 || year > 2030) {
    result.addError(
      `Invalid year: ${year} (must be between 2020-2030)`,
      `Use today's date as fallback`
    );
    return result;
  }

  // Validate month
  if (month < 1 || month > 12) {
    result.addError(`Invalid month: ${month}`);
    return result;
  }

  // Validate day
  if (day < 1 || day > 31) {
    result.addError(`Invalid day: ${day}`);
    return result;
  }

  // Check if date is too far in the future
  const articleDate = new Date(year, month - 1, day);
  const today = new Date();
  const daysDiff = Math.floor((articleDate - today) / (1000 * 60 * 60 * 24));
  
  if (daysDiff > 7) {
    result.addWarning(`Date is ${daysDiff} days in the future`);
  }

  if (daysDiff < -365) {
    result.addWarning(`Date is more than 1 year old`);
  }

  return result;
}

/**
 * Step 2: Validate and fix title
 */
export function validateTitle(title, originalTitle = null) {
  const result = new ValidationResult();
  
  if (!title || title.trim().length === 0) {
    result.addError('Title is empty');
    return result;
  }

  // Check for Turkish characters
  const turkishChars = /[ğüşıöçĞÜŞİÖÇ]/g;
  const turkishCount = (title.match(turkishChars) || []).length;
  
  if (turkishCount > 3) {
    result.addError(
      `Title contains ${turkishCount} Turkish characters`,
      'Title needs retranslation'
    );
    return result;
  }

  // Check for "– NuvemMag" or similar
  if (title.match(/\s*[–—\-]\s*NuvemMag\s*$/i)) {
    const cleanTitle = title.replace(/\s*[–—\-]\s*NuvemMag\s*$/i, '').trim();
    result.addFix(`Removed "– NuvemMag" from title`);
    title = cleanTitle;
  }

  // Check for instruction leakage
  const instructionPatterns = [
    'REMINDER:',
    'Note: I have',
    'Translate the following',
    'Translation:',
    'Text to translate:'
  ];

  for (const pattern of instructionPatterns) {
    if (title.includes(pattern)) {
      result.addError(`Title contains instruction leakage: "${pattern}"`);
      return result;
    }
  }

  // Check length
  if (title.length < 10) {
    result.addWarning('Title is very short');
  }

  if (title.length > 200) {
    result.addWarning('Title is very long');
  }

  // Check if translation happened (compare with original)
  if (originalTitle) {
    const similarity = calculateSimilarity(originalTitle.toLowerCase(), title.toLowerCase());
    if (similarity > 0.9) {
      result.addWarning('Title is very similar to original (translation may have failed)');
    }
  }

  return { ...result, fixedTitle: title };
}

/**
 * Step 3: Validate and fix content
 */
export function validateContent(content, originalContent = null) {
  const result = new ValidationResult();
  
  if (!content || content.trim().length === 0) {
    result.addError('Content is empty');
    return result;
  }

  // Check for Turkish characters
  const turkishChars = /[ğüşıöçĞÜŞİÖÇ]/g;
  const turkishMatches = content.match(turkishChars) || [];
  const turkishCount = turkishMatches.length;
  const totalChars = content.length;
  const turkishRatio = totalChars > 0 ? turkishCount / totalChars : 0;

  if (turkishCount > 30 || turkishRatio > 0.025) {
    result.addError(
      `Content contains ${turkishCount} Turkish characters (${(turkishRatio * 100).toFixed(2)}%)`,
      'Content needs retranslation'
    );
    return result;
  }

  // Check for Turkish phrases (more reliable)
  const turkishPhrases = [
    'yapay zeka', 'teknoloji', 'haber', 'haberi', 'haberler',
    'tarafından', 'olarak', 'şekilde', 'durumda', 'halde',
    'için', 'göre', 'kadar', 'ile', 've', 'de', 'da', 'ki',
    'oldu', 'olduğu', 'yapıldı', 'yapılan', 'yapılacak',
    'açıkladı', 'duyurdu', 'söyledi', 'belirtti',
    'hollywood', 'süregelen', 'kesin bir sınır',
    'ailesi altındaki', 'en yeni', 'açık modellerini',
    'duyurarak', 'performansında', 'hız artışı'
  ];

  const contentLower = content.toLowerCase();
  let turkishPhraseCount = 0;
  for (const phrase of turkishPhrases) {
    if (contentLower.includes(phrase)) {
      turkishPhraseCount++;
    }
  }

  if (turkishPhraseCount > 5) {
    result.addError(
      `Content contains ${turkishPhraseCount} Turkish phrases`,
      'Content needs retranslation'
    );
    return result;
  }

  // Check for translation errors
  if (content.includes("I couldn't find the rest of the text") ||
      content.includes('Please provide the complete text in Turkish')) {
    result.addError('Content contains translation error message');
    return result;
  }

  // Check for instruction leakage
  const instructionPatterns = [
    'REMINDER:',
    'Note: I have',
    'Translate the following',
    'Translation:',
    'Text to translate:',
    '**Translation**',
    '**Reasoning'
  ];

  for (const pattern of instructionPatterns) {
    if (content.includes(pattern)) {
      result.addError(`Content contains instruction leakage: "${pattern}"`);
      return result;
    }
  }

  // Check for NuvemMag branding (except in image URLs)
  const nuvemMagPattern = /nuvemmag\.com(?!\/wp-content)/gi;
  if (nuvemMagPattern.test(content)) {
    result.addError('Content contains NuvemMag branding/URLs');
    return result;
  }

  // Check length
  if (content.length < 200) {
    result.addWarning('Content is very short');
  }

  // Check if translation happened (compare with original)
  if (originalContent) {
    const similarity = calculateSimilarity(originalContent.toLowerCase(), content.toLowerCase());
    if (similarity > 0.85) {
      result.addWarning('Content is very similar to original (translation may have failed)');
    }
  }

  return result;
}

/**
 * Step 4: Validate description
 */
export function validateDescription(description) {
  const result = new ValidationResult();
  
  if (!description || description.trim().length === 0) {
    result.addWarning('Description is empty');
    return result;
  }

  // Check for Turkish characters
  const turkishChars = /[ğüşıöçĞÜŞİÖÇ]/g;
  const turkishCount = (description.match(turkishChars) || []).length;
  
  if (turkishCount > 5) {
    result.addError(`Description contains ${turkishCount} Turkish characters`);
    return result;
  }

  // Check length
  if (description.length < 20) {
    result.addWarning('Description is very short');
  }

  if (description.length > 500) {
    result.addWarning('Description is very long');
  }

  return result;
}

/**
 * Step 5: Comprehensive article validation
 */
export function validateArticle(article) {
  const results = {
    date: validateDate(article.date, article.sourceUrl),
    title: validateTitle(article.title, article.originalTitle),
    content: validateContent(article.content, article.originalContent),
    description: validateDescription(article.description),
  };

  // Calculate overall score
  const scores = Object.values(results).map(r => r.score);
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

  // Check if any critical error exists
  const hasErrors = Object.values(results).some(r => !r.isValid);

  return {
    isValid: !hasErrors && avgScore >= 60,
    score: avgScore,
    results,
    errors: Object.values(results).flatMap(r => r.errors),
    warnings: Object.values(results).flatMap(r => r.warnings),
    fixes: Object.values(results).flatMap(r => r.fixes),
  };
}

/**
 * Auto-fix common issues
 */
export function autoFixArticle(article, validationResults) {
  const fixed = { ...article };
  let fixedCount = 0;

  // Fix title
  if (validationResults.title.fixedTitle) {
    fixed.title = validationResults.title.fixedTitle;
    fixedCount++;
  }

  // Fix date (use today if invalid)
  if (!validationResults.date.isValid && article.date) {
    const today = new Date();
    const [day, month, year] = article.date.split('/').map(Number);
    
    // If year is invalid, use current year
    if (year < 2020 || year > 2030) {
      fixed.date = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
      fixedCount++;
    }
  }

  return { fixed, fixedCount };
}

/**
 * Calculate similarity between two strings
 */
function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

/**
 * Calculate Levenshtein distance
 */
function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

