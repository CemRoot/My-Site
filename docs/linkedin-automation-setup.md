# LinkedIn Daily Automation - Setup Guide

## 🎯 Overview
Automated system that analyzes tech news daily using Google Gemini AI, sends approval requests via Telegram, and posts approved content to LinkedIn.

## 🚀 Features
- ✅ Daily AI-powered news analysis with Google Gemini 2.0 Flash
- ✅ Intelligent scoring system (0-100) for article importance
- ✅ Telegram approval workflow with inline buttons
- ✅ Automatic LinkedIn posting with rate limiting
- ✅ Comprehensive error handling and notifications
- ✅ Analytics and performance tracking
- ✅ Manual testing and override capabilities

## 📅 Schedule
- **15:00 UTC (16:00 Ireland)**: Daily analysis and Telegram approval request
- **15:30 UTC (16:30 Ireland)**: Automatic LinkedIn posting of approved content

## 🛠 Setup Instructions

### 1. Google Gemini API Setup

1. **Get API Key:**
   - Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Create new API key
   - Copy the key (starts with `AIzaSy...`)

2. **Add to GitHub Secrets:**
   ```
   GEMINI_API_KEY=AIzaSyDEHXJ-24LWczcysEwWOGmxEAMJvUXz4uA
   ```

### 2. Telegram Bot Setup

1. **Create Bot:**
   - Message [@BotFather](https://t.me/botfather) on Telegram
   - Send `/newbot` and follow instructions
   - Copy the bot token

2. **Get Chat ID:**
   - Message your bot
   - Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
   - Find your chat ID in the response

3. **Add to GitHub Secrets:**
   ```
   TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
   TELEGRAM_CHAT_ID=123456789
   ```

4. **Set Webhook (Optional):**
   ```bash
   curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
        -H "Content-Type: application/json" \
        -d '{"url": "https://yoursite.com/api/telegram-webhook/webhook/<BOT_TOKEN>"}'
   ```

### 3. LinkedIn API Setup

1. **Create LinkedIn App:**
   - Go to [LinkedIn Developers](https://www.linkedin.com/developers/apps)
   - Create new app with these permissions:
     - `w_member_social` (post content)
     - `r_liteprofile` (read profile)

2. **Get Access Token:**
   - Follow LinkedIn OAuth 2.0 flow
   - Get user access token with required scopes

3. **Get Person ID:**
   ```bash
   curl -H "Authorization: Bearer <ACCESS_TOKEN>" \
        "https://api.linkedin.com/v2/people/~"
   ```

4. **Add to GitHub Secrets:**
   ```
   LINKEDIN_ACCESS_TOKEN=your_access_token_here
   LINKEDIN_PERSON_ID=your_person_id_here
   ```

### 4. Database Setup

1. **Run SQL Schema:**
   ```sql
   -- Execute the contents of docs/linkedin-posts-schema.sql in Supabase
   ```

2. **Verify Tables:**
   ```sql
   SELECT * FROM linkedin_posts LIMIT 1;
   SELECT * FROM get_daily_linkedin_stats();
   ```

### 5. Environment Variables

Add these to GitHub Secrets:

```bash
# Google Gemini AI
GEMINI_API_KEY=AIzaSyDEHXJ-24LWczcysEwWOGmxEAMJvUXz4uA

# Telegram Bot
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=123456789

# LinkedIn API
LINKEDIN_ACCESS_TOKEN=your_access_token_here
LINKEDIN_PERSON_ID=your_person_id_here

# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://yoursite.com
```

## 🧪 Testing

### Manual Testing:
```bash
# Test analysis only
npm run linkedin:test

# Test analysis (real mode)
npm run linkedin:analyze

# Test posting (approved posts only)
npm run linkedin:post
```

### GitHub Actions Testing:
1. Go to **Actions** tab in GitHub
2. Select **"Daily LinkedIn Automation"**
3. Click **"Run workflow"**
4. Choose mode: `analyze`, `post`, or `test`

## 🔄 Workflow Details

### Analysis Phase (15:00 UTC)
```
1. Fetch articles from last 24 hours
2. Filter out already processed articles
3. Analyze each article with Google Gemini AI
4. Generate LinkedIn content and score (0-100)
5. Select top 5 articles with score ≥ 70
6. Save to database with 'pending' status
7. Send approval request to Telegram
```

### Approval Phase (Manual)
```
Telegram Message Format:
📊 GÜNLÜK HABER ANALİZİ TAMAMLANDI
📅 Date - X haber hazır

🚀 [95 puan] Article Title
📝 Suggested LinkedIn post content...
🔗 Site link

Buttons:
✅ TÜMÜNÜ ONAYLA  ❌ TÜMÜNÜ RED ET
✅ 1  ❌ 1  ✏️ 1  (for each article)
```

### Posting Phase (15:30 UTC)
```
1. Fetch approved posts from database
2. Post each to LinkedIn with rate limiting
3. Update database status to 'posted'
4. Send completion notification to Telegram
5. Generate daily summary report
```

## 📊 Monitoring & Analytics

### Telegram Commands:
```
/status - System health check
/stats - Performance statistics
/test - Run test mode
/settings - Configuration options
```

### Database Analytics:
```sql
-- Today's statistics
SELECT * FROM get_daily_linkedin_stats();

-- Weekly performance
SELECT * FROM get_weekly_linkedin_performance();

-- Success rate by category
SELECT category, success_rate FROM linkedin_posts_analytics;
```

### GitHub Actions Logs:
- Check workflow runs for detailed logs
- Error notifications sent to Telegram automatically
- Health checks run daily

## 🚨 Error Handling

### Automatic Recovery:
- API failures trigger retry mechanisms
- Failed posts remain in queue for next cycle
- Comprehensive error logging and notifications

### Manual Intervention:
- Telegram notifications for all errors
- Manual workflow triggers available
- Database status tracking for debugging

### Common Issues:
1. **LinkedIn API Rate Limits**: Posts queued for next cycle
2. **Gemini API Errors**: Fallback scoring mechanism
3. **Telegram Delivery**: Webhook fallback to polling
4. **Database Errors**: Transaction rollback and retry

## 🎛️ Configuration

### Adjustable Parameters:
```javascript
// In daily-linkedin-automation.js
const CONFIG = {
  MAX_ARTICLES_PER_DAY: 5,        // Max articles to analyze
  MIN_AI_SCORE: 70,               // Minimum score threshold
  SITE_URL: 'https://yoursite.com' // Your site URL
};
```

### Scheduling:
```yaml
# In .github/workflows/daily-linkedin.yml
schedule:
  - cron: '0 15 * * *'   # Analysis time
  - cron: '30 15 * * *'  # Posting time
```

## 🔒 Security

### API Keys:
- All keys stored in GitHub Secrets
- Never logged or exposed in code
- Webhook URLs include secret tokens

### Database:
- Row Level Security (RLS) enabled
- Service role access only for automation
- Public read access only for posted content

### Rate Limiting:
- 5 seconds between LinkedIn posts
- 1 second between Gemini API calls
- Telegram API respects official limits

## 📈 Success Metrics

Track these KPIs:
- **Analysis Success Rate**: % of successful daily analyses
- **Approval Rate**: % of articles approved vs suggested
- **Posting Success Rate**: % of approved articles successfully posted
- **Engagement Rate**: LinkedIn likes, comments, shares
- **Traffic Impact**: Site visits from LinkedIn posts

## 🆘 Troubleshooting

### No Articles Found:
- Check if news scraper is running
- Verify Supabase connection
- Check date filters in queries

### Telegram Not Responding:
- Verify bot token and chat ID
- Check webhook configuration
- Test with manual message

### LinkedIn Posting Fails:
- Check access token validity
- Verify API permissions
- Review rate limiting

### AI Analysis Errors:
- Check Gemini API key and quota
- Review article content format
- Test with manual API call

## 🔄 Maintenance

### Weekly Tasks:
- Review success rates and adjust thresholds
- Check API quota usage
- Monitor engagement metrics

### Monthly Tasks:
- Rotate API keys if needed
- Review and optimize AI prompts
- Analyze performance trends

### Quarterly Tasks:
- Update LinkedIn app permissions
- Review and update automation logic
- Performance optimization

---

**System is now ready for daily operation! 🚀**

Check Telegram for your first analysis results tomorrow at 16:00 Ireland time.
