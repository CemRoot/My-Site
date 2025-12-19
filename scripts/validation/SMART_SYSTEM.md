# 🤖 Smart Article Processing System

## Overview
Multi-step validation pipeline that prevents common errors before articles are saved to the database.

## 🛡️ Protection Against Common Errors

### 1. **Wrong Dates** ❌
- **Problem**: Dates like "6930", "6891", "6800"
- **Solution**: Year validation (2020-2030 range)
- **Auto-fix**: Uses today's date if invalid

### 2. **Turkish Content** ❌
- **Problem**: Untranslated Turkish text in articles
- **Solution**: 
  - Turkish character detection (>30 chars or >2.5% ratio)
  - Turkish phrase detection (>5 phrases)
  - Similarity check with original content
- **Action**: Rejects article, requires retranslation

### 3. **Title Issues** ❌
- **Problem**: "– NuvemMag" in titles, Turkish characters
- **Solution**: 
  - Auto-removes "– NuvemMag"
  - Detects Turkish characters (>3)
  - Checks for instruction leakage
- **Auto-fix**: Cleans title automatically

### 4. **Translation Errors** ❌
- **Problem**: "I couldn't find the rest of the text", instruction leakage
- **Solution**: 
  - Detects error messages
  - Checks for instruction patterns ("REMINDER:", "Note: I have")
  - Validates translation actually happened
- **Action**: Rejects article

### 5. **Content Quality** ⚠️
- **Problem**: Short content, missing embeds, bad formatting
- **Solution**: 
  - Length validation (>200 chars)
  - Format checks
  - Warning system (non-blocking)

## 🔄 Multi-Step Validation Pipeline

### Step 1: Date Validation
```javascript
validateDate(dateStr, articleUrl)
```
- Validates year (2020-2030)
- Validates month (1-12)
- Validates day (1-31)
- Checks if date is too far in future/past

### Step 2: Title Validation
```javascript
validateTitle(title, originalTitle)
```
- Removes "– NuvemMag"
- Detects Turkish characters
- Checks for instruction leakage
- Validates length
- Compares with original (translation check)

### Step 3: Content Validation
```javascript
validateContent(content, originalContent)
```
- Turkish character detection
- Turkish phrase detection
- Translation error detection
- Instruction leakage detection
- NuvemMag branding detection
- Length validation
- Similarity check with original

### Step 4: Description Validation
```javascript
validateDescription(description)
```
- Turkish character detection
- Length validation

### Step 5: Comprehensive Validation
```javascript
validateArticle(article)
```
- Runs all validations
- Calculates quality score (0-100)
- Returns validation result with errors/warnings/fixes

## 🔧 Auto-Fix System

The system automatically fixes common issues:

1. **Title Cleaning**: Removes "– NuvemMag"
2. **Date Fixing**: Uses today's date if invalid year
3. **Re-validation**: Re-checks after fixes

## 📊 Quality Score System

- **100 points**: Perfect article
- **-20 points**: Per critical error
- **-5 points**: Per warning
- **Minimum 60 points**: Required to pass

## 🚫 Rejection Criteria

Articles are **rejected** if they have:
- ❌ Invalid year (< 2020 or > 2030)
- ❌ Turkish content (>30 chars or >2.5% ratio)
- ❌ Turkish phrases (>5 phrases)
- ❌ Translation error messages
- ❌ Instruction leakage
- ❌ NuvemMag branding (except image URLs)

## ⚠️ Warning Criteria (Non-blocking)

Articles get **warnings** for:
- ⚠️ Very short content (<200 chars)
- ⚠️ Very long title (>200 chars)
- ⚠️ Date too far in future (>7 days)
- ⚠️ Date too old (>1 year)
- ⚠️ High similarity with original (translation may have failed)

## 📝 Usage

### In News Scraper

```javascript
import { validateArticle, autoFixArticle } from './validation/smartArticleProcessor.js';

// After translation
const validation = validateArticle(translatedArticle);

if (!validation.isValid) {
  // Auto-fix common issues
  const { fixed, fixedCount } = autoFixArticle(translatedArticle, validation.results);
  
  // Re-validate
  const revalidation = validateArticle(fixed);
  
  if (!revalidation.isValid) {
    // Reject article
    throw new Error('Article failed validation');
  }
}

// Save article
await saveArticle(fixed);
```

## 🎯 Benefits

1. **Prevents Bad Data**: Catches errors before they reach database
2. **Auto-Fixes**: Automatically fixes common issues
3. **Quality Score**: Quantifies article quality
4. **Detailed Feedback**: Shows exactly what's wrong
5. **Self-Healing**: Fixes issues and re-validates

## 🔍 Validation Flow

```
Article → Translate → Validate → Auto-Fix → Re-Validate → Save
           ↓            ↓          ↓           ↓            ↓
        Turkish      Errors?    Fixes      Pass?      Database
        Content      Found      Applied    Yes
```

## 📈 Statistics

The system tracks:
- Validation score
- Number of errors
- Number of warnings
- Number of fixes applied
- Rejection rate

## 🛠️ Future Enhancements

- [ ] Machine learning-based quality prediction
- [ ] Automatic retranslation for failed articles
- [ ] A/B testing for different validation thresholds
- [ ] Real-time quality dashboard

