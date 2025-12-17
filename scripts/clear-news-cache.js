/**
 * Clear all news cache layers
 * - sessionStorage (client-side)
 * - Vercel CDN cache (via revalidation)
 * 
 * Usage: node scripts/clear-news-cache.js
 */

import 'dotenv/config';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local first, then .env
dotenv.config({ path: join(__dirname, '../.env.local') });
dotenv.config({ path: join(__dirname, '../.env') });

const VERCEL_URL = process.env.VERCEL_URL || 'cemkoyluoglu.codes';
const VERCEL_REVALIDATE_TOKEN = process.env.VERCEL_REVALIDATE_TOKEN;

async function clearVercelCache() {
  const token = VERCEL_REVALIDATE_TOKEN || process.env.TELEGRAM_CONTROL_API_SECRET;
  
  if (!token) {
    console.log('⚠️  VERCEL_REVALIDATE_TOKEN or TELEGRAM_CONTROL_API_SECRET not set');
    console.log('   You can manually clear cache by:');
    console.log('   1. Redeploying on Vercel');
    console.log('   2. Waiting 60 seconds (cache expires)');
    console.log('   3. Setting VERCEL_REVALIDATE_TOKEN in environment variables');
    return;
  }

  try {
    const url = `https://${VERCEL_URL}/api/revalidate-news`;
    console.log(`🔄 Calling revalidation endpoint: ${url}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log('✅ Vercel cache revalidated successfully!');
      console.log(`   ${result.message}`);
    } else {
      console.log(`⚠️  Revalidation returned status: ${response.status}`);
      console.log(`   Response: ${JSON.stringify(result, null, 2)}`);
    }
  } catch (error) {
    console.error('❌ Error revalidating Vercel cache:', error.message);
    console.log('   Cache will expire automatically in 60 seconds');
  }
}

async function main() {
  console.log('🧹 CLEARING NEWS CACHE\n');
  console.log('='.repeat(80));
  
  // Clear Vercel cache
  await clearVercelCache();
  
  console.log('\n' + '='.repeat(80));
  console.log('📋 MANUAL STEPS REQUIRED:');
  console.log('   1. Open your browser console (F12)');
  console.log('   2. Run: sessionStorage.clear()');
  console.log('   3. Or visit: https://cemkoyluoglu.codes/tech-news');
  console.log('   4. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)');
  console.log('='.repeat(80));
  console.log('\n✅ Cache clearing script completed!');
}

main().catch(console.error);

