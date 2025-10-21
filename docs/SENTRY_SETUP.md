# 🔍 Sentry Error Tracking Setup Guide

## 📋 Overview

Sentry is now integrated into the project for comprehensive error tracking and performance monitoring across both frontend and backend.

### Features Enabled:
- ✅ Frontend error tracking (React)
- ✅ Backend error tracking (Vercel Serverless Functions)
- ✅ Performance monitoring
- ✅ Session replay (50 replays/month)
- ✅ User context tracking
- ✅ Release tracking
- ✅ Breadcrumbs for debugging

---

## 🚀 Quick Start

### 1. Get Your Sentry DSN

1. Go to [Sentry.io](https://sentry.io)
2. Navigate to your project settings
3. Find your **DSN** (Data Source Name)
   - Format: `https://<key>@<organization>.ingest.sentry.io/<project-id>`

### 2. Set Environment Variables

#### On Vercel:

```bash
# Go to your Vercel project settings → Environment Variables

# Frontend (required)
VITE_SENTRY_DSN=https://your-key@your-org.ingest.sentry.io/your-project-id
VITE_SENTRY_ENVIRONMENT=production
VITE_APP_VERSION=1.0.0

# Backend (required)
SENTRY_DSN=https://your-key@your-org.ingest.sentry.io/your-project-id
SENTRY_ENVIRONMENT=production

# Source Maps Upload (optional but recommended)
SENTRY_AUTH_TOKEN=your_auth_token_here
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=your-project-slug
```

#### Locally:

Create a `.env.local` file (already in `.gitignore`):

```bash
cp .env.example .env.local
# Edit .env.local with your actual values
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Test Locally

```bash
npm run dev
```

Visit your app and trigger an error to test:
- Open browser console
- Type: `throw new Error('Test error')`
- Check Sentry dashboard for the error

---

## 📦 What's Been Integrated

### Frontend (`src/`)

#### 1. Sentry Initialization
**File:** `src/lib/sentry.ts`

```typescript
import { initSentry } from './lib/sentry';
initSentry();
```

Features:
- Automatic error capture
- Performance monitoring
- Session replay (10% of sessions, 100% with errors)
- React Router integration
- Custom error filtering
- Development mode warnings

#### 2. Error Boundary
**File:** `src/components/ErrorBoundary.tsx`

Wraps the entire app to catch React errors:

```tsx
import { ErrorBoundary } from './components/ErrorBoundary';

<ErrorBoundary>
  <App />
</ErrorBoundary>
```

Features:
- User-friendly error UI
- Turkish/English support
- Automatic error reporting to Sentry
- "Try Again" and "Go Home" buttons

#### 3. Main Entry Point
**File:** `src/main.tsx`

Sentry is initialized before React renders:

```tsx
import { initSentry } from './lib/sentry';
import { ErrorBoundary } from './components/ErrorBoundary';

initSentry();

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
```

### Backend (`api/`, `lib/`)

#### 1. Sentry Server Module
**File:** `lib/sentry-server.js`

Features:
- Automatic initialization for serverless functions
- Request context tracking
- Error capturing with context
- Rate limit integration

#### 2. API Route Wrapper
**File:** `api/chat.js` (example)

All API routes should use `withSentry`:

```javascript
import { withSentry } from '../lib/sentry-server.js';

export default withSentry(async function handler(req, res) {
  // Your API logic
});
```

This automatically:
- Captures errors
- Tracks request context
- Flushes events before function ends
- Returns user-friendly error responses

---

## 🔧 Configuration Options

### Frontend Configuration

**File:** `src/lib/sentry.ts`

```typescript
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || 'development',
  release: import.meta.env.VITE_APP_VERSION || 'unknown',
  
  // Adjust these based on your needs:
  tracesSampleRate: 0.2, // 20% of transactions in production
  replaysSessionSampleRate: 0.1, // 10% of normal sessions
  replaysOnErrorSampleRate: 1.0, // 100% of error sessions
});
```

### Backend Configuration

**File:** `lib/sentry-server.js`

```javascript
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT || 'production',
  release: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
  tracesSampleRate: 0.2, // 20% in production
});
```

---

## 🎯 Usage Examples

### Manual Error Reporting

#### Frontend:

```typescript
import { captureException, captureMessage, addBreadcrumb } from './lib/sentry';

// Capture an exception
try {
  // risky code
} catch (error) {
  captureException(error, { context: 'user-action' });
}

// Capture a message
captureMessage('User completed checkout', 'info');

// Add breadcrumb for debugging
addBreadcrumb('User clicked button', { buttonId: 'submit' });
```

#### Backend:

```javascript
import { captureException, addBreadcrumb } from '../lib/sentry-server.js';

try {
  // risky code
} catch (error) {
  captureException(error, {
    tags: { endpoint: '/api/chat' },
    contexts: { user: { id: userId } }
  });
}

addBreadcrumb('Processing request', { userId });
```

### Setting User Context

#### Frontend:

```typescript
import { setUser } from './lib/sentry';

// After user logs in
setUser({
  id: 'user-123',
  email: 'user@example.com',
  username: 'johndoe'
});

// On logout
setUser(null);
```

#### Backend:

```javascript
import { setUser } from '../lib/sentry-server.js';

setUser({
  id: userId,
  email: userEmail
});
```

---

## 📊 Sentry Dashboard

### What You'll See:

1. **Issues**: All errors grouped by type
2. **Performance**: Slow transactions and API calls
3. **Releases**: Errors per deployment
4. **Session Replay**: Video-like recordings of user sessions with errors
5. **Breadcrumbs**: Timeline of events before an error

### Key Metrics:

- **5,000 errors/month** - Plenty for this project size
- **50 replays/month** - Focus on error sessions
- **5M spans/month** - Performance transaction tracking
- **5 GB logs/month** - Comprehensive logging

---

## 🔒 Security & Privacy

### Data Collected:

✅ **Collected:**
- Error messages and stack traces
- Browser/OS information
- Performance metrics
- User actions (breadcrumbs)
- Request URLs and methods

❌ **NOT Collected:**
- Passwords or sensitive form data
- API keys or tokens
- Personal user data (unless explicitly set)

### Privacy Features:

- All text/media masked in replays (`maskAllText: true`)
- Sensitive errors filtered (`beforeSend`)
- Development errors not sent to Sentry
- CORS and origin restrictions maintained

---

## 🧪 Testing Sentry

### Frontend Test:

1. Open browser console
2. Run: `throw new Error('Sentry test error')`
3. Check Sentry dashboard

### Backend Test:

1. Add test endpoint:

```javascript
// api/test-sentry.js
import { withSentry, captureMessage } from '../lib/sentry-server.js';

export default withSentry(async (req, res) => {
  captureMessage('Sentry test from API', 'info');
  throw new Error('Test error from API');
});
```

2. Visit: `https://your-domain.com/api/test-sentry`
3. Check Sentry dashboard

---

## 🚨 Troubleshooting

### Errors Not Showing in Sentry?

1. **Check DSN**: Verify environment variables are set correctly
2. **Check Environment**: In development, errors are console-logged but not sent
3. **Check Sentry Dashboard**: Sometimes there's a delay (up to 1 minute)
4. **Check Browser Console**: Look for Sentry initialization messages

### Source Maps Not Uploading?

1. Set `SENTRY_AUTH_TOKEN` in Vercel
2. Verify `SENTRY_ORG` and `SENTRY_PROJECT` are correct
3. Check Vite config has Sentry plugin enabled

### High Event Volume?

Adjust sample rates in configuration:
- Reduce `tracesSampleRate` (e.g., 0.1 = 10%)
- Reduce `replaysSessionSampleRate` (e.g., 0.05 = 5%)

---

## 📈 Best Practices

### 1. Use Meaningful Contexts

```typescript
captureException(error, {
  tags: { feature: 'checkout', step: 'payment' },
  contexts: { order: { id: orderId, amount: total } }
});
```

### 2. Add Breadcrumbs

```typescript
addBreadcrumb('User started checkout', { items: cartCount });
addBreadcrumb('Payment method selected', { method: 'credit-card' });
```

### 3. Filter Sensitive Data

Update `beforeSend` in `sentry.ts` or `sentry-server.js`:

```typescript
beforeSend(event) {
  // Remove sensitive query params
  if (event.request?.url) {
    event.request.url = event.request.url.replace(/token=[^&]+/, 'token=REDACTED');
  }
  return event;
}
```

### 4. Monitor Release Health

Tag deploys with version numbers:
```bash
VITE_APP_VERSION=1.2.0 npm run build
```

---

## 🔗 Useful Links

- [Sentry Dashboard](https://sentry.io)
- [Sentry React Docs](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Sentry Node.js Docs](https://docs.sentry.io/platforms/node/)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)

---

## 📝 Summary

### Frontend:
- ✅ `src/lib/sentry.ts` - Initialization
- ✅ `src/components/ErrorBoundary.tsx` - Error UI
- ✅ `src/main.tsx` - Integration

### Backend:
- ✅ `lib/sentry-server.js` - Server module
- ✅ `api/chat.js` - Example integration

### Environment Variables:
- ✅ `VITE_SENTRY_DSN` - Frontend DSN
- ✅ `SENTRY_DSN` - Backend DSN
- ✅ `VITE_SENTRY_ENVIRONMENT` - Environment name
- ✅ `VITE_APP_VERSION` - Release tracking

### Next Steps:
1. Add `withSentry` to remaining API routes
2. Set environment variables on Vercel
3. Deploy and monitor errors
4. Adjust sample rates based on usage

---

🎉 **Sentry is now protecting your application!**

