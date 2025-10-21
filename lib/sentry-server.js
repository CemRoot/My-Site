/**
 * Sentry Server Configuration for Vercel Serverless Functions
 * 
 * Environment Variables Required:
 * - SENTRY_DSN: Your Sentry project DSN
 * - SENTRY_ENVIRONMENT: Environment name (development, production, staging)
 * - VERCEL_ENV: Vercel environment (automatically set)
 */

import * as Sentry from '@sentry/node';

let sentryInitialized = false;

/**
 * Initialize Sentry for serverless functions
 */
export function initSentry() {
  // Only initialize once
  if (sentryInitialized) {
    return;
  }

  const dsn = process.env.SENTRY_DSN;

  if (!dsn) {
    console.warn('⚠️ Sentry DSN not found. Skipping Sentry initialization.');
    return;
  }

  try {
    Sentry.init({
      dsn,
      
      // Environment and Release
      environment: process.env.SENTRY_ENVIRONMENT || process.env.VERCEL_ENV || 'development',
      release: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
      
      // Performance Monitoring
      tracesSampleRate: process.env.VERCEL_ENV === 'production' ? 0.2 : 1.0,
      
      // Serverless-specific settings
      attachStacktrace: true,
      
      // Custom error filtering
      beforeSend(event, hint) {
        // Don't send in development
        if (process.env.NODE_ENV === 'development') {
          console.error('Sentry Event (not sent in dev):', event);
          return null;
        }

        // Add custom context
        if (event.request) {
          event.tags = {
            ...event.tags,
            vercel_env: process.env.VERCEL_ENV,
            vercel_region: process.env.VERCEL_REGION,
          };
        }

        return event;
      },

      // Ignore certain errors
      ignoreErrors: [
        'ECONNRESET',
        'ETIMEDOUT',
        'ENOTFOUND',
        'NetworkError',
      ],

      // Enable debug in development
      debug: process.env.NODE_ENV === 'development',
    });

    sentryInitialized = true;
    console.info('✅ Sentry initialized for serverless functions');
  } catch (error) {
    console.error('❌ Failed to initialize Sentry:', error);
  }
}

/**
 * Wrapper for API routes to capture errors
 * 
 * Usage:
 * export default withSentry(async (req, res) => {
 *   // Your API logic
 * });
 */
export function withSentry(handler) {
  return async (req, res) => {
    // Initialize Sentry if not already done
    if (!sentryInitialized) {
      initSentry();
    }

    try {
      // Set request context
      Sentry.setContext('request', {
        method: req.method,
        url: req.url,
        headers: {
          'user-agent': req.headers['user-agent'],
          'x-forwarded-for': req.headers['x-forwarded-for'],
        },
        query: req.query,
      });

      // Execute the handler
      return await handler(req, res);
    } catch (error) {
      // Log error details
      console.error('API Error:', error);

      // Capture exception in Sentry
      Sentry.captureException(error, {
        contexts: {
          request: {
            method: req.method,
            url: req.url,
            query: req.query,
          },
        },
        tags: {
          endpoint: req.url,
          method: req.method,
        },
      });

      // Ensure Sentry event is sent before function ends
      await Sentry.flush(2000);

      // Return error response
      if (!res.headersSent) {
        res.status(500).json({
          error: 'Internal Server Error',
          message: process.env.NODE_ENV === 'development' 
            ? error.message 
            : 'An unexpected error occurred',
          ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
        });
      }
    }
  };
}

/**
 * Capture a custom exception
 */
export function captureException(error, context = {}) {
  if (!sentryInitialized) {
    initSentry();
  }
  
  if (sentryInitialized) {
    Sentry.captureException(error, context);
  } else {
    console.error('Exception (Sentry not initialized):', error);
  }
}

/**
 * Capture a custom message
 */
export function captureMessage(message, level = 'info') {
  if (!sentryInitialized) {
    initSentry();
  }
  
  if (sentryInitialized) {
    Sentry.captureMessage(message, level);
  } else {
    console.log(`Message (Sentry not initialized) [${level}]:`, message);
  }
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(message, data = {}) {
  if (sentryInitialized) {
    Sentry.addBreadcrumb({
      message,
      level: 'info',
      data,
    });
  }
}

/**
 * Set user context
 */
export function setUser(user) {
  if (sentryInitialized) {
    Sentry.setUser(user);
  }
}

/**
 * Flush pending events (important for serverless)
 */
export async function flushSentry(timeout = 2000) {
  if (sentryInitialized) {
    try {
      await Sentry.flush(timeout);
    } catch (error) {
      console.error('Failed to flush Sentry events:', error);
    }
  }
}

// Export Sentry for direct use if needed
export { Sentry };

