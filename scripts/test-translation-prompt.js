/**
 * Test Translation Prompt Fix
 * Verifies that the translation prompt doesn't leak into the output
 */

import 'dotenv/config';
import Groq from 'groq-sdk';
import { TRANSLATION_SYSTEM_PROMPT, createTranslationPrompt } from './translate/prompt.js';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const GROQ_MODEL = 'llama-3.3-70b-versatile'; // Updated model

async function testTranslation() {
  console.log('🧪 Testing Translation Prompt Fix\n');
  console.log('='.repeat(60));
  
  // Test Turkish content with an embed token
  const testContent = `
14 Ekim 2025

# Trump Artık Amerika'nın En Büyük Bitcoin Yatırımcılarından Biri

Eski ABD Başkanı Donald Trump, dolaylı olarak 870 milyon dolarlık bir bitcoin yatırımına sahip olarak Amerika'nın en büyük kripto para yatırımcılarından biri haline geldi.

[[EMBED:TIKTOK:https://www.tiktok.com/@example/video/1234567890]]

Trump, kripto parayı doğrudan değil, Truth Social platformunu işleten Trump Media and Technology Group aracılığıyla elinde tutuyor.
  `.trim();
  
  console.log('📝 Original Turkish Content:\n');
  console.log(testContent.substring(0, 200) + '...\n');
  console.log('='.repeat(60));
  
  try {
    console.log('\n🤖 Calling Groq API...\n');
    
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        {
          role: 'system',
          content: TRANSLATION_SYSTEM_PROMPT
        },
        {
          role: 'user',
          content: createTranslationPrompt(testContent)
        }
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });
    
    const translatedText = completion.choices[0]?.message?.content || '';
    
    console.log('✅ Translation Result:\n');
    console.log(translatedText);
    console.log('\n' + '='.repeat(60));
    
    // Validation checks
    console.log('\n🔍 Validation Checks:\n');
    
    const checks = [
      {
        name: 'No "REMINDER:" text',
        pass: !translatedText.includes('REMINDER:'),
        detail: translatedText.includes('REMINDER:') ? '❌ Found "REMINDER:" in output' : '✅ Clean'
      },
      {
        name: 'No "Translate the following"',
        pass: !translatedText.includes('Translate the following'),
        detail: translatedText.includes('Translate the following') ? '❌ Found prompt text' : '✅ Clean'
      },
      {
        name: 'No "Text to translate:"',
        pass: !translatedText.toLowerCase().includes('text to translate:'),
        detail: translatedText.toLowerCase().includes('text to translate:') ? '❌ Found instruction text' : '✅ Clean'
      },
      {
        name: 'Token preserved',
        pass: translatedText.includes('[[EMBED:TIKTOK:'),
        detail: translatedText.includes('[[EMBED:TIKTOK:') ? '✅ Token found' : '❌ Token missing!'
      },
      {
        name: 'Content translated',
        pass: translatedText.includes('Trump') && translatedText.includes('Bitcoin'),
        detail: '✅ Content appears translated'
      }
    ];
    
    checks.forEach((check, i) => {
      const icon = check.pass ? '✅' : '❌';
      console.log(`${i + 1}. ${icon} ${check.name}`);
      console.log(`   ${check.detail}\n`);
    });
    
    const allPassed = checks.every(c => c.pass);
    
    console.log('='.repeat(60));
    if (allPassed) {
      console.log('\n🎉 ALL CHECKS PASSED! Translation prompt is fixed.\n');
      console.log('✅ Safe to run: node scripts/news-scraper.js\n');
    } else {
      console.log('\n❌ SOME CHECKS FAILED! Review the output above.\n');
    }
    
  } catch (error) {
    console.error('❌ Error during translation test:', error.message);
  }
}

testTranslation();

