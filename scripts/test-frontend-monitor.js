/**
 * Frontend Monitoring Test Script
 * 
 * Tests the frontend monitoring system by sending test errors
 * to the backend API and checking if Telegram notifications work
 */

const https = require('https');

// Test configuration
const TEST_URL = process.argv[2] || 'https://cemkoyluoglu.codes';
const API_ENDPOINT = `${TEST_URL}/api/frontend-health-monitor`;

console.log('\n🧪 Frontend Monitoring Test Başlıyor...\n');
console.log(`📍 Test URL: ${API_ENDPOINT}\n`);

// Test scenarios
const testCases = [
  {
    name: '💥 CRITICAL: Black Screen Test',
    data: {
      type: 'crash',
      message: 'Black screen detected - Root element is empty',
      severity: 'critical',
      userAgent: 'Mozilla/5.0 (Test Agent)',
      pageUrl: `${TEST_URL}/test`,
      additionalData: {
        rootExists: true,
        childrenCount: 0,
        testMode: true
      }
    }
  },
  {
    name: '🚨 ERROR: JavaScript Error Test',
    data: {
      type: 'error',
      message: 'TypeError: Cannot read properties of undefined',
      stack: 'Error: Cannot read properties of undefined\\n    at test.js:1:1',
      severity: 'critical',
      userAgent: 'Mozilla/5.0 (Test Agent)',
      pageUrl: `${TEST_URL}/test`,
      additionalData: {
        testMode: true
      }
    }
  },
  {
    name: '🔌 NETWORK: API Failure Test',
    data: {
      type: 'network',
      message: 'API Error: /api/chat returned 500',
      severity: 'critical',
      userAgent: 'Mozilla/5.0 (Test Agent)',
      pageUrl: `${TEST_URL}/test`,
      additionalData: {
        url: '/api/chat',
        status: 500,
        testMode: true
      }
    }
  },
  {
    name: '🐌 WARNING: Performance Issue Test',
    data: {
      type: 'performance',
      message: 'Slow page load: 6234ms',
      severity: 'warning',
      userAgent: 'Mozilla/5.0 (Test Agent)',
      pageUrl: `${TEST_URL}/test`,
      additionalData: {
        loadTime: 6234,
        testMode: true
      }
    }
  }
];

/**
 * Send test request to monitoring API
 */
async function sendTestError(testCase) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_ENDPOINT);
    const postData = JSON.stringify(testCase.data);

    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Origin': TEST_URL
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            response,
            testCase: testCase.name
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            response: data,
            testCase: testCase.name
          });
        }
      });
    });

    req.on('error', (error) => {
      reject({
        error: error.message,
        testCase: testCase.name
      });
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Run all tests
 */
async function runTests() {
  const results = [];
  
  console.log('🚀 Test senaryoları çalıştırılıyor...\n');

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    
    console.log(`${i + 1}/${testCases.length} ${testCase.name}`);
    
    try {
      const result = await sendTestError(testCase);
      results.push(result);
      
      if (result.statusCode === 200) {
        console.log(`   ✅ Başarılı (${result.statusCode})`);
        console.log(`   📨 Telegram bildirimi gönderildi\n`);
      } else {
        console.log(`   ⚠️  Uyarı (${result.statusCode}): ${JSON.stringify(result.response)}\n`);
      }
      
      // Wait 2 seconds between tests to avoid rate limiting
      if (i < testCases.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.log(`   ❌ Hata: ${error.error || error}\n`);
      results.push({ error, testCase: testCase.name });
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SONUÇLARI');
  console.log('='.repeat(60) + '\n');

  const successful = results.filter(r => r.statusCode === 200).length;
  const failed = results.filter(r => r.error || r.statusCode !== 200).length;

  console.log(`✅ Başarılı: ${successful}/${testCases.length}`);
  console.log(`❌ Başarısız: ${failed}/${testCases.length}`);

  if (successful > 0) {
    console.log('\n🎉 Test başarılı! Telegram\'dan bildirimler geldi mi kontrol edin.\n');
    console.log('📱 Telegram\'da şu mesajları görmelisiniz:');
    console.log('   - 💥 FRONTEND CRITICAL (Black screen)');
    console.log('   - 🚨 FRONTEND ERROR (JavaScript error)');
    console.log('   - 🚨 FRONTEND CRITICAL (Network failure)');
    console.log('   - 🐌 FRONTEND WARNING (Performance issue)\n');
  } else {
    console.log('\n⚠️  Hiçbir test başarılı olmadı. Lütfen şunları kontrol edin:');
    console.log('   1. Vercel\'de deployment başarılı mı?');
    console.log('   2. TELEGRAM_BOT_TOKEN ve TELEGRAM_CHAT_ID env var\'ları ekli mi?');
    console.log('   3. SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY doğru mu?');
    console.log('   4. Supabase\'de frontend_error_logs tablosu var mı?\n');
  }

  console.log('📝 Detaylı loglar için Supabase frontend_error_logs tablosunu kontrol edin.');
  console.log('🔗 Supabase: https://supabase.com/dashboard\n');
}

// Run tests
runTests().catch(err => {
  console.error('\n❌ Test çalıştırılırken hata oluştu:', err);
  process.exit(1);
});

