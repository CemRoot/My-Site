# Security Policy

## 🛡️ Security Overview

This document outlines the security measures, policies, and reporting procedures for the Tech News Automation Platform.

## 🔒 Security Measures Implemented

### 1. CORS Protection
- **Status**: ✅ Implemented
- **Location**: All API endpoints (`api/*.js`)
- **Protection**: Origin whitelist (only `cemkoyluoglu.codes` and Vercel preview URLs)
- **Prevention**: Blocks unauthorized cross-origin requests

### 2. Security Headers
- **Status**: ✅ Implemented
- **Location**: `vercel.json`
- **Headers Configured**:
  - `X-Frame-Options: DENY` - Prevents clickjacking
  - `X-Content-Type-Options: nosniff` - Prevents MIME sniffing
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy` - Restricts browser features
  - `Strict-Transport-Security` - Enforces HTTPS
  - `Content-Security-Policy` - Restricts resource loading

### 3. Rate Limiting
- **Status**: ✅ Implemented
- **Location**: `lib/rate-limit.js`, `api/chat.js`, `api/lib/chatHelpers.js`
- **Protection**: 10 requests per minute per IP for chat endpoint
- **Note**: In-memory cache (resets on cold starts)
- **Recommendation**: Upgrade to Upstash Redis for production

### 4. Input Validation
- **Status**: ✅ Implemented
- **Location**: `api/tech-news.js`, `api/og-meta.js`
- **Validation**: Slug parameter (`[a-z0-9-]+`, max 200 chars)
- **Prevention**: NoSQL injection, path traversal

### 5. API Authentication
- **Status**: ✅ Implemented (Optional)
- **Location**: `api/telegram-control.js`
- **Method**: Bearer token authentication
- **ENV Variable**: `TELEGRAM_CONTROL_API_SECRET`
- **Action Required**: ⚠️ Set secret in Vercel environment variables

### 6. Automated Security Scanning
- **Status**: ✅ Implemented
- **Workflows**:
  - NPM audit (weekly)
  - CodeQL analysis
  - Gitleaks secret scanning
  - Dependabot for dependency updates
- **Location**: `.github/workflows/security-scan.yml`, `.github/dependabot.yml`

## 🚨 Reporting a Vulnerability

If you discover a security vulnerability, please follow responsible disclosure:

### Preferred Method
- **Email**: cemkoyluoglu@icloud.com
- **Subject**: `[SECURITY] Vulnerability Report`
- **Include**:
  - Description of the vulnerability
  - Steps to reproduce
  - Potential impact
  - Suggested fix (if available)

### Response Time
- **Initial Response**: Within 48 hours
- **Status Updates**: Every 7 days until resolved
- **Fix Timeline**: Critical issues within 7 days, High within 14 days

### What NOT to Do
- ❌ Do not publicly disclose the vulnerability
- ❌ Do not exploit the vulnerability
- ❌ Do not access or modify other users' data

## 🔐 Environment Variables Security

### Required Secrets (Set in Vercel)
```bash
# ⚠️ NEVER commit these to git! See .env.example for full list.

# Critical - Set immediately
TELEGRAM_CONTROL_API_SECRET=<generate with: openssl rand -hex 32>
DEPLOYMENT_WEBHOOK_SECRET=<generate with: openssl rand -hex 32>

# AI Services
GROQ_API_KEY=<from https://console.groq.com/>
FIRECRAWL_API_KEY=<from https://firecrawl.dev/>
GEMINI_API_KEY=<from https://aistudio.google.com/>

# Database
NEXT_PUBLIC_SUPABASE_URL=<from Supabase dashboard>
SUPABASE_SERVICE_ROLE_KEY=<from Supabase dashboard>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from Supabase dashboard>

# Telegram
TELEGRAM_BOT_TOKEN=<from @BotFather>
TELEGRAM_CHAT_ID=<your chat ID>

# GitHub (auto-provided in Actions)
GITHUB_TOKEN=<auto>

# Sentry
VITE_SENTRY_DSN=<from Sentry project settings>
SENTRY_DSN=<from Sentry project settings>

# Optional
N8N_LINKEDIN_WORKFLOW_WEBHOOK=<your n8n webhook URL>
N8N_CHATBOT_WEBHOOK=<your n8n chatbot webhook URL>
```

### Secret Rotation Schedule
- **Critical Secrets**: Every 90 days
- **API Keys**: Every 180 days
- **After Breach**: Immediately

## 🛠️ Security Best Practices for Developers

### Before Committing
```bash
# 1. Check for secrets
git diff --cached

# 2. Run security scan (if gitleaks installed)
gitleaks detect --source . --verbose

# 3. Run npm audit
npm audit

# 4. Verify .env files are gitignored
git status
```

### Pre-commit Hook (Optional)
Create `.git/hooks/pre-commit`:
```bash
#!/bin/bash
if git diff --cached --name-only | grep -E '^\\.env(\\..*)?$'; then
  echo '❌ ERROR: Attempting to commit .env file!'
  exit 1
fi
echo '✅ Pre-commit checks passed'
```

Make it executable:
```bash
chmod +x .git/hooks/pre-commit
```

## 📋 Security Checklist

### Deployment Checklist
- [ ] All environment variables set in Vercel
- [ ] `TELEGRAM_CONTROL_API_SECRET` configured
- [ ] Security headers verified
- [ ] CORS origins configured correctly
- [ ] Rate limiting tested
- [ ] No secrets in git history
- [ ] Dependencies up to date (`npm update`)
- [ ] GitHub secret scanning enabled

### Regular Maintenance
- [ ] Review security scan results weekly
- [ ] Update dependencies monthly
- [ ] Rotate secrets quarterly
- [ ] Review access logs monthly
- [ ] Test backup/recovery procedures quarterly

## 🔍 Monitoring

### What We Monitor
1. **Failed Authentication Attempts** (telegram-control API)
2. **Rate Limit Violations** (logged to console)
3. **Invalid Input Attempts** (slug validation)
4. **Dependency Vulnerabilities** (Dependabot)

### Alert Channels
- GitHub Actions email notifications
- Vercel deployment logs
- npm audit reports

## 📚 Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Vercel Security Best Practices](https://vercel.com/docs/security)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [npm Security Advisories](https://www.npmjs.com/advisories)

## 📝 Changelog

### 2025-01 - Initial Security Implementation
- ✅ Fixed wildcard CORS (F-0001)
- ✅ Added security headers (F-0002)
- ✅ Implemented rate limiting (F-0003)
- ✅ Updated dependencies (F-0004)
- ✅ Enhanced API authentication (F-0005)
- ✅ Added input validation (F-0010)
- ✅ Configured security scanning (F-0012)
- ✅ Updated function timeouts (F-0008)

### 2026-03 - Codebase Refactoring & Hardening
- ✅ Extracted shared modules (`api/lib/`, `scripts/lib/`) to eliminate credential duplication
- ✅ Centralized Supabase client creation (single admin client per layer)
- ✅ Centralized Telegram API utilities (no more inline `fetch` calls)
- ✅ Removed 16 unused npm dependencies (reduced attack surface)
- ✅ Eliminated all `any` TypeScript types in frontend
- ✅ Deleted dead code, test files, and temporary logs from repository

---

**Last Updated**: March 2026  
**Maintained by**: Cem Koyluoğlu (cemkoyluoglu@icloud.com)

