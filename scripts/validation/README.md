# Content Quality Validation System

## Overview
This validation system ensures all scraped articles meet quality standards before being saved to the database. It prevents common issues like header links, YouTube UI text, Rick Roll videos, and translation instruction leakage.

## Features

### Critical Error Detection (❌ FAILS)
The system detects and blocks articles with:
- ❌ **Nuvemmag branding/URLs** - Source website branding
- ❌ **Navigation/category links** - Header menu items
- ❌ **Date at start** - Content should start AFTER date removal
- ❌ **YouTube UI text** - "Info", "Share", subscriber counts, channel URLs
- ❌ **Rick Roll videos** - `dQw4w9WgXcQ` video ID
- ❌ **Translation instruction leakage** - "REMINDER:", "Note: I have", etc.
- ❌ **Footer text** - Copyright notices, company info
- ❌ **Related articles section** - "İlginizi Çekebilir"
- ❌ **Empty markdown links** - `[]()`

### Warning Detection (⚠️  NON-BLOCKING)
The system warns about potential issues:
- ⚠️  **No embed tokens** - May be normal if article has no social media
- ⚠️  **Very short content** - Less than 500 characters
- ⚠️  **Excessive whitespace** - 4+ consecutive newlines
- ⚠️  **Very long title** - Over 200 characters
- ⚠️  **Unbalanced markdown** - Mismatched brackets/parentheses

## Usage

### In News Scraper
The validation runs automatically after translation:

```javascript
import { assertContentQuality } from './validation/contentQualityCheck.js';

// After translating article
const translatedArticle = await translateArticle(article);

// Quality check (throws error if validation fails)
assertContentQuality(translatedArticle);

// If we reach here, article is valid and can be saved
```

### Manual Validation
You can also validate articles manually:

```javascript
import { validateArticleContent, printValidationResult } from './validation/contentQualityCheck.js';

const article = {
  title: 'Article Title',
  description: 'Article description',
  content: 'Article content...'
};

const result = validateArticleContent(article);
printValidationResult(result, article.title);

if (result.isValid) {
  console.log('✅ Article is valid');
} else {
  console.log('❌ Article has issues:', result.errors);
}
```

## Testing

Run the validation test suite:

```bash
cd scripts
node test-content-validation.js
```

This tests all validation rules with various problematic content to ensure the system works correctly.

## Integration with News Scraper

### Flow Diagram
```
Scrape HTML → Tokenize Embeds → Translate → Quality Check → Save to DB
                                              ↓ (if fails)
                                          Reject Article
```

### Quality Check Steps
1. **Check for critical errors** (blocking)
   - If any critical error found → throw error → article rejected
2. **Check for warnings** (non-blocking)
   - If warnings found → log warnings → continue
3. **Calculate stats**
   - Content length, embed count, title/description length

## Common Issues and Solutions

### Issue: Articles with header links
**Detection:** `line.includes('Ana Sayfa')`
**Prevention:** Step 0 in `scripts/lib/scraper/ScrapeOrchestrator.js` removes all lines up to date
**Fix:** If still appearing, check date pattern regex

### Issue: YouTube UI text
**Detection:** Regex patterns for "Info", "Share", subscriber counts
**Prevention:** `skipYouTubeUILines` skips 15 lines after YouTube embed
**Fix:** Increase skip count or add more patterns

### Issue: Rick Roll videos
**Detection:** `content.includes('dQw4w9WgXcQ')`
**Prevention:** Improved YouTube extraction from markdown links
**Fix:** Check `extractMarkdownEmbeds.js` for correct video ID extraction

### Issue: Translation instructions in content
**Detection:** Patterns like "REMINDER:", "Note: I have"
**Prevention:** System prompt + post-processing in `cleanTranslation()`
**Fix:** Update instruction patterns in both validation and cleaning

## Maintenance

### Adding New Validation Rules
1. Add pattern to `validateArticleContent()` in `contentQualityCheck.js`
2. Add test case to `test-content-validation.js`
3. Run test suite to verify
4. Update this README

### Updating Existing Rules
1. Modify pattern in `contentQualityCheck.js`
2. Update corresponding test case
3. Run full test suite
4. Document changes in this README

## Statistics

Each validation provides:
- **Content Length** - Total character count
- **Embed Count** - Number of `[[EMBED:...]]` tokens
- **Title Length** - Title character count
- **Description Length** - Description character count

## Error Handling

If validation fails in the news scraper:
1. Error is logged with details
2. Article is NOT saved to database
3. Scraper continues to next article
4. Summary shows validation failure count

## Performance

- **Validation time:** < 10ms per article
- **Memory usage:** Negligible (string operations only)
- **No external dependencies:** Pure JavaScript validation
