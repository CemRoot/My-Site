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
  inboundFiltersIntegration,
  functionToStringIntegration,
  globalHandlersIntegration,
  linkedErrorsIntegration,
  dedupeIntegration,
  httpContextIntegration,
  captureException as sentryCaptureException,
  captureMessage as sentryCaptureMessage,
  addBreadcrumb as sentryAddBreadcrumb,
  setUser as sentrySetUser,
  setTag as sentrySetTag,
  setContext as sentrySetContext,
  type SeverityLevel,
} from '@sentry/react';

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
    
    /*
      ERROR REPORTING ONLY — no browser tracing.

      `reactRouterV6BrowserTracingIntegration` used to be here. Measured on
      production with Lighthouse, sentry-*.js was the single most expensive
      script on the page: 1,873 ms of CPU time, three times three.js, and it
      was what kept desktop Total Blocking Time above 1,000 ms.

      That cost is the instrumentation, not the reporting. With its defaults the
      integration installs PerformanceObservers for long tasks, long animation
      frames and INP, patches fetch, XHR and history, and reads Resource Timing
      for every request. All of that runs for 100% of sessions — `tracesSampleRate`
      only decides whether the resulting trace is SENT. At 0.05 that meant every
      visitor paid the full main-thread cost so that 5% of them produced data.

      And there is no data to lose: PageSpeed reports "No Data" for this origin's
      real-user metrics, so 5% of that is nothing. Errors are the part worth
      having, and captureException/captureMessage below are cheap.

      To re-enable: restore the integration import, put it back in `integrations`,
      and set tracesSampleRate. Expect desktop TBT to rise again.
    */
    /*
      Removing tracing was not enough: Lighthouse still attributed two long
      tasks (229 ms + 142 ms) to sentry-*.js. That is the DEFAULT integration
      set, which wraps a lot of the platform before it can report anything.

      Dropped:
      - `BrowserApiErrors` re-wraps setTimeout, setInterval,
        requestAnimationFrame, requestIdleCallback, XMLHttpRequest and every
        addEventListener call. Its only job is prettier stack traces for errors
        thrown inside those callbacks; `GlobalHandlers` still reports the error.
      - `Breadcrumbs` wraps console, DOM events, fetch, history and XHR, and
        attaches global click/keypress listeners. Useful context, but it is
        paid on every session and this site already reports errors
        independently through lib/frontend-monitor.ts.

      Kept (the parts that actually capture errors): GlobalHandlers for uncaught
      exceptions and unhandled rejections, LinkedErrors, Dedupe, InboundFilters,
      HttpContext, FunctionToString.

      The list is explicit rather than a filter over the defaults. Filtering
      leaves the dropped integrations in the bundle and only skips installing
      them; naming what we want lets the bundler drop their code entirely.
      `defaultIntegrations: false` alone would have been the blunt version — it
      also disables automatic error capture, which is the one thing worth
      keeping, so GlobalHandlers is listed back explicitly.
    */
    defaultIntegrations: false,
    integrations: [
      inboundFiltersIntegration(),
      functionToStringIntegration(),
      globalHandlersIntegration(),
      linkedErrorsIntegration(),
      dedupeIntegration(),
      httpContextIntegration(),
    ],
    tracesSampleRate: 0,

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

