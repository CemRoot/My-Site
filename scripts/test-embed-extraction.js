/**
 * Test Script for Embed Token Extraction
 * Run: node scripts/test-embed-extraction.js
 */

import { htmlToTokens } from './embeds/extractEmbeds.js';

console.log('🧪 Testing Embed Token Extraction\n');

// Test 1: TikTok Embed
console.log('Test 1: TikTok Embed');
console.log('-------------------');
const tiktokHTML = `
<div class="content">
  <p>Check out this amazing video:</p>
  <blockquote class="tiktok-embed" 
    cite="https://www.tiktok.com/@jesstawil/video/7558264080222473485" 
    data-video-id="7558264080222473485">
    <a href="https://www.tiktok.com/@jesstawil/video/7558264080222473485">Watch on TikTok</a>
  </blockquote>
  <p>Amazing story!</p>
</div>
`;

const tiktokResult = htmlToTokens(tiktokHTML);
console.log('Content:', tiktokResult.contentWithTokens);
console.log('Embed Count:', tiktokResult.embedCount);
console.log('✅ Expected: 1 TikTok embed');
console.log('✅ Got:', tiktokResult.embedCount.tiktok, 'TikTok embed(s)\n');

// Test 2: Twitter Embed
console.log('Test 2: Twitter/X Embed');
console.log('----------------------');
const twitterHTML = `
<div class="content">
  <p>Important announcement:</p>
  <blockquote class="twitter-tweet">
    <p>This is a tweet</p>
    <a href="https://twitter.com/user/status/1876543212345678901">View Tweet</a>
  </blockquote>
  <p>What do you think?</p>
</div>
`;

const twitterResult = htmlToTokens(twitterHTML);
console.log('Content:', twitterResult.contentWithTokens);
console.log('Embed Count:', twitterResult.embedCount);
console.log('✅ Expected: 1 Twitter embed');
console.log('✅ Got:', twitterResult.embedCount.twitter, 'Twitter embed(s)\n');

// Test 3: YouTube Embed
console.log('Test 3: YouTube Embed');
console.log('--------------------');
const youtubeHTML = `
<div class="content">
  <p>Watch this video:</p>
  <iframe 
    src="https://www.youtube.com/embed/dQw4w9WgXcQ" 
    width="560" 
    height="315" 
    frameborder="0" 
    allowfullscreen>
  </iframe>
  <p>Great content!</p>
</div>
`;

const youtubeResult = htmlToTokens(youtubeHTML);
console.log('Content:', youtubeResult.contentWithTokens);
console.log('Embed Count:', youtubeResult.embedCount);
console.log('✅ Expected: 1 YouTube embed');
console.log('✅ Got:', youtubeResult.embedCount.youtube, 'YouTube embed(s)\n');

// Test 4: Multiple Embeds
console.log('Test 4: Multiple Embeds');
console.log('-----------------------');
const multiHTML = `
<article>
  <h1>Tech News Article</h1>
  <p>Here's a TikTok video:</p>
  <blockquote class="tiktok-embed" cite="https://www.tiktok.com/@user1/video/123456">
    <a href="https://www.tiktok.com/@user1/video/123456">TikTok</a>
  </blockquote>
  
  <p>And a tweet:</p>
  <blockquote class="twitter-tweet">
    <a href="https://x.com/user2/status/999888777">Tweet</a>
  </blockquote>
  
  <p>Plus a YouTube video:</p>
  <iframe src="https://www.youtube.com/embed/abc123def456"></iframe>
  
  <p>The end.</p>
</article>
`;

const multiResult = htmlToTokens(multiHTML);
console.log('Content:', multiResult.contentWithTokens);
console.log('Embed Count:', multiResult.embedCount);
console.log('✅ Expected: 1 TikTok, 1 Twitter, 1 YouTube');
console.log('✅ Got:', JSON.stringify(multiResult.embedCount), '\n');

// Test 5: Token Format Validation
console.log('Test 5: Token Format Validation');
console.log('-------------------------------');
const tokens = multiResult.contentWithTokens.match(/\[\[EMBED:[^\]]+\]\]/g) || [];
console.log('Found tokens:');
tokens.forEach((token, i) => {
  console.log(`  ${i + 1}. ${token}`);
  
  // Validate format
  const match = /^\[\[EMBED:(TIKTOK|TWEET|YOUTUBE):(.+)\]\]$/i.exec(token);
  if (match) {
    console.log(`     ✅ Valid (Type: ${match[1]}, Data: ${match[2].substring(0, 50)}...)`);
  } else {
    console.log(`     ❌ Invalid token format!`);
  }
});

console.log('\n🎉 All tests completed!');
console.log('\nTo test the full pipeline:');
console.log('1. Run the scraper: node scripts/news-scraper.js');
console.log('2. Check that tokens appear in database content');
console.log('3. Verify tokens are preserved after translation');
console.log('4. View article in browser to see embeds render');

