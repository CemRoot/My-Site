/*
  Named imports, not `import * as Sentry`.

  This module is a lazily-imported chunk, and a namespace import forces the
  bundler to keep the SDK's shape across that boundary: measured at 465 KiB
  as a namespace import. Every wrapper below shares a name with the SDK
  function it wraps, so the imports are aliased — without the alias,
  `setContext` would call itself.
*/
import {
  init,
  reactRouterV6BrowserTracingIntegration,
  captureException as sentryCaptureException,
  captureMessage as sentryCaptureMessage,
  addBreadcrumb as sentryAddBreadcrumb,
  setUser as sentrySetUser,
  setTag as sentrySetTag,
  setContext as sentrySetContext,
  type SeverityLevel,
} from '@sentry/react';
import { useEffect } from 'react';
import {
  createRoutesFromChildren,
  matchRoutes,
  useLocation,
  useNavigationType,
} from 'react-router-dom';

/**
 * Sentry Configuration
 * 
 * Environment Variables Required:
 * - VITE_SENTRY_DSN: Your Sentry project DSN
 * - VITE_SENTRY_ENVIRONMENT: Environment name (development, production, staging)
 * - VITE_APP_VERSION: App version for release tracking
 */

export function initSentry() {
  // Only initialize if DSN is provided
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  
  if (!dsn) {
    console.warn('Sentry DSN not found. Skipping Sentry initialization.');
    return;
  }

  init({
    dsn,
    
    // Environment and Release tracking
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || 'development',
    release: import.meta.env.VITE_APP_VERSION || 'unknown',
    
    // Performance Monitoring
    integrations: [
      // React Router integration for navigation tracking
      reactRouterV6BrowserTracingIntegration({
        useEffect,
        useLocation,
        useNavigationType,
        createRoutesFromChildren,
        matchRoutes,
      }),
      
      // Replay integration DISABLED for better performance
      // Only enable when debugging specific issues
      // Sentry.replayIntegration({
      //   maskAllText: true,
      //   blockAllMedia: true,
      //   replaysSessionSampleRate: 0,
      //   replaysOnErrorSampleRate: 0.5,
      // }),
    ],

    // Performance traces sample rate - reduced for better INP
    // Lower sample rate = less overhead on main thread
    tracesSampleRate: import.meta.env.PROD ? 0.05 : 0.5,

    // Capture unhandled promise rejections
    attachStacktrace: true,

    // Custom error filtering
    beforeSend(event, hint) {
      // Don't send errors in development (optional)
      if (import.meta.env.DEV) {
        console.error('Sentry Event (not sent in dev):', event, hint);
        return null;
      }

      // Filter out known errors or add custom logic
      if (event.exception) {
        const error = hint.originalException;

        // Ignore network errors from ad blockers
        if (error instanceof Error && error.message.includes('ad')) {
          return null;
        }

        // Tag chunk loading errors for better tracking
        if (error instanceof Error && (
          error.message.includes('Failed to fetch dynamically imported module') ||
          error.message.includes('Importing a module script failed') ||
          error.message.includes('error loading dynamically imported module')
        )) {
          event.tags = {
            ...event.tags,
            chunkLoadError: true,
            deploymentIssue: true,
          };
          event.fingerprint = ['chunk-load-error'];
        }

        // Add custom tags
        event.tags = {
          ...event.tags,
          userAgent: navigator.userAgent,
        };
      }

      return event;
    },

    // Ignore certain errors
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      'originalCreateNotification',
      'canvas.contentDocument',
      'MyApp_RemoveAllHighlights',
      'atomicFindClose',
      // Network errors (but NOT chunk loading errors - we want to track those)
      'NetworkError',
      'Network request failed',
      // Random plugins/extensions
      'jigsaw is not defined',
      'ComboSearch is not defined',
      'http://tt.epicplay.com',
      'Can\'t find variable: ZiteReader',
      'Non-Error promise rejection captured',
    ],

    // Limit breadcrumbs to control data usage
    maxBreadcrumbs: 50,

    // Enable debug mode in development
    debug: import.meta.env.DEV,
  });

  // Set user context if available (e.g., from auth)
  // You can call this from your auth system
  // sentrySetUser({ id: 'user-id', email: 'user@example.com' });

  console.info('✅ Sentry initialized successfully');
}

/**
 * Capture a custom exception with additional context
 */
export function captureException(error: Error, context?: Record<string, any>) {
  if (context) {
    sentrySetContext('custom', context);
  }
  sentryCaptureException(error);
}

/**
 * Capture a custom message
 */
export function captureMessage(message: string, level: SeverityLevel = 'info') {
  sentryCaptureMessage(message, level);
}

/**
 * Add a breadcrumb for debugging
 */
export function addBreadcrumb(message: string, data?: Record<string, any>) {
  sentryAddBreadcrumb({
    message,
    level: 'info',
    data,
  });
}

/**
 * Set user context
 */
export function setUser(user: { id?: string; email?: string; username?: string } | null) {
  sentrySetUser(user);
}

/**
 * Set custom tags
 */
export function setTag(key: string, value: string) {
  sentrySetTag(key, value);
}

/**
 * Set custom context
 */
export function setContext(name: string, context: Record<string, any>) {
  sentrySetContext(name, context);
}

