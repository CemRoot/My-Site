/**
 * Test LinkedIn Automation Setup
 * Verifies all components are properly configured
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Test configuration
const tests = {
  supabase: false,
  gemini: false,
  telegram: false,
  linkedin: false
};

console.log('🧪 Testing LinkedIn Automation Setup...\n');

// Test 1: Supabase Connection
try {
  console.log('1️⃣ Testing Supabase connection...');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  const { data, error } = await supabase
    .from('tech_news_articles')
    .select('count')
    .limit(1);
    
  if (error) throw error;
  console.log('   ✅ Supabase connection: OK');
  tests.supabase = true;
} catch (error) {
  console.log('   ❌ Supabase connection: FAILED');
  console.log(`   Error: ${error.message}`);
}

// Test 2: Google Gemini API
try {
  console.log('\n2️⃣ Testing Google Gemini API...');
  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-goog-api-key': process.env.GEMINI_API_KEY
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: 'Test message for API verification'
        }]
      }]
    })
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const data = await response.json();
  if (data.candidates && data.candidates[0]) {
    console.log('   ✅ Google Gemini API: OK');
    tests.gemini = true;
  } else {
    throw new Error('Invalid response format');
  }
} catch (error) {
  console.log('   ❌ Google Gemini API: FAILED');
  console.log(`   Error: ${error.message}`);
}

// Test 3: Telegram Bot
try {
  console.log('\n3️⃣ Testing Telegram Bot...');
  const response = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getMe`);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const data = await response.json();
  if (data.ok && data.result) {
    console.log(`   ✅ Telegram Bot: OK (@${data.result.username})`);
    tests.telegram = true;
  } else {
    throw new Error('Invalid bot token');
  }
} catch (error) {
  console.log('   ❌ Telegram Bot: FAILED');
  console.log(`   Error: ${error.message}`);
}

// Test 4: LinkedIn API (optional - requires valid token)
try {
  console.log('\n4️⃣ Testing LinkedIn API...');
  
  if (!process.env.LINKEDIN_ACCESS_TOKEN) {
    console.log('   ⚠️  LinkedIn API: SKIPPED (no access token)');
  } else {
    const response = await fetch('https://api.linkedin.com/v2/people/~', {
      headers: {
        'Authorization': `Bearer ${process.env.LINKEDIN_ACCESS_TOKEN}`
      }
    });
    
    if (response.ok) {
      console.log('   ✅ LinkedIn API: OK');
      tests.linkedin = true;
    } else if (response.status === 401) {
      console.log('   ❌ LinkedIn API: FAILED (invalid or expired token)');
    } else {
      console.log(`   ❌ LinkedIn API: FAILED (HTTP ${response.status})`);
    }
  }
} catch (error) {
  console.log('   ❌ LinkedIn API: FAILED');
  console.log(`   Error: ${error.message}`);
}

// Test 5: Database Schema
try {
  console.log('\n5️⃣ Testing database schema...');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  // Check if linkedin_posts table exists
  const { data, error } = await supabase
    .from('linkedin_posts')
    .select('count')
    .limit(1);
    
  if (error && error.code === 'PGRST116') {
    console.log('   ❌ Database schema: linkedin_posts table not found');
    console.log('   📝 Run: docs/linkedin-posts-schema.sql in Supabase');
  } else if (error) {
    throw error;
  } else {
    console.log('   ✅ Database schema: OK');
  }
} catch (error) {
  console.log('   ❌ Database schema: FAILED');
  console.log(`   Error: ${error.message}`);
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 SETUP TEST SUMMARY');
console.log('='.repeat(50));

const passedTests = Object.values(tests).filter(Boolean).length;
const totalTests = Object.keys(tests).length;

console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);
console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests} tests\n`);

Object.entries(tests).forEach(([test, passed]) => {
  console.log(`${passed ? '✅' : '❌'} ${test.toUpperCase()}: ${passed ? 'READY' : 'NEEDS SETUP'}`);
});

if (passedTests === totalTests) {
  console.log('\n🎉 All tests passed! System is ready for automation.');
} else {
  console.log('\n⚠️  Some tests failed. Check the setup guide and fix issues before running automation.');
}

console.log('\n📖 Setup guide: docs/linkedin-automation-setup.md');
console.log('🧪 Test command: npm run linkedin:test');
console.log('🚀 Manual run: npm run linkedin:analyze');
