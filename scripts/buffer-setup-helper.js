#!/usr/bin/env node
/**
 * Buffer Setup Helper
 * Gets your LinkedIn profile ID and tests API connection
 */

import 'dotenv/config';

const BUFFER_ACCESS_TOKEN = process.env.BUFFER_ACCESS_TOKEN || '';

async function getBufferProfiles() {
  if (!BUFFER_ACCESS_TOKEN) {
    console.error('❌ BUFFER_ACCESS_TOKEN environment variable is required');
    console.log('');
    console.log('1. Go to https://buffer.com/developers/api');
    console.log('2. Create an Access Token');
    console.log('3. Set BUFFER_ACCESS_TOKEN in your environment');
    process.exit(1);
  }

  try {
    console.log('🔍 Fetching your Buffer profiles...');
    
    const response = await fetch('https://api.bufferapp.com/1/profiles.json', {
      headers: {
        'Authorization': `Bearer ${BUFFER_ACCESS_TOKEN}`
      }
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Buffer API error: ${response.status} - ${errorData}`);
    }

    const profiles = await response.json();
    
    console.log('✅ Buffer profiles found:');
    console.log('');
    
    profiles.forEach((profile, index) => {
      console.log(`${index + 1}. ${profile.service} - ${profile.formatted_username}`);
      console.log(`   Profile ID: ${profile.id}`);
      console.log(`   Service: ${profile.service}`);
      console.log(`   Status: ${profile.status}`);
      console.log('');
    });

    // Find LinkedIn profile
    const linkedinProfile = profiles.find(p => p.service === 'linkedin');
    
    if (linkedinProfile) {
      console.log('🎯 LinkedIn Profile Found:');
      console.log(`   Profile ID: ${linkedinProfile.id}`);
      console.log(`   Username: ${linkedinProfile.formatted_username}`);
      console.log('');
      console.log('📋 Add this to your GitHub Secrets:');
      console.log(`   BUFFER_ACCESS_TOKEN = ${BUFFER_ACCESS_TOKEN}`);
      console.log(`   BUFFER_LINKEDIN_PROFILE_ID = ${linkedinProfile.id}`);
    } else {
      console.log('❌ LinkedIn profile not found. Please connect your LinkedIn account to Buffer first.');
    }

  } catch (error) {
    console.error('❌ Error fetching Buffer profiles:', error.message);
    process.exit(1);
  }
}

async function testBufferPost() {
  const LINKEDIN_PROFILE_ID = process.env.BUFFER_LINKEDIN_PROFILE_ID || '';
  
  if (!LINKEDIN_PROFILE_ID) {
    console.log('⚠️ BUFFER_LINKEDIN_PROFILE_ID not set. Run this script first to get your profile ID.');
    return;
  }

  try {
    console.log('🧪 Testing Buffer post...');
    
    const testContent = `🧪 Test post from automated system
    
This is a test post to verify Buffer + LinkedIn integration is working.

#TestPost #Automation #TechNews`;

    const response = await fetch('https://api.bufferapp.com/1/updates/create.json', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${BUFFER_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: testContent,
        profile_ids: [LINKEDIN_PROFILE_ID],
        now: true // Post immediately
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Buffer API error: ${response.status} - ${errorData}`);
    }

    const result = await response.json();
    
    console.log('✅ Test post successful!');
    console.log(`   Post ID: ${result.id}`);
    console.log(`   Status: ${result.status}`);
    console.log('');
    console.log('🎉 Buffer + LinkedIn integration is working!');
    
  } catch (error) {
    console.error('❌ Test post failed:', error.message);
  }
}

// Command line argument handling
const command = process.argv[2];

switch (command) {
  case 'profiles':
  case 'setup':
    getBufferProfiles();
    break;
  case 'test':
    testBufferPost();
    break;
  default:
    console.log('Buffer Setup Helper');
    console.log('');
    console.log('Usage: node scripts/buffer-setup-helper.js [command]');
    console.log('');
    console.log('Commands:');
    console.log('  profiles, setup  - Get your Buffer profiles and LinkedIn profile ID');
    console.log('  test            - Test posting to LinkedIn via Buffer');
    console.log('');
    console.log('Environment variables needed:');
    console.log('  BUFFER_ACCESS_TOKEN         - Your Buffer API access token');
    console.log('  BUFFER_LINKEDIN_PROFILE_ID  - Your LinkedIn profile ID (get from setup command)');
    process.exit(1);
}

