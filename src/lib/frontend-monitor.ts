/**
 * Frontend Monitoring Library
 * 
 * Monitors frontend health and reports critical issues to backend
 * Integrates with Sentry and custom monitoring
 */

import * as Sentry from '@sentry/react';

interface ErrorReport {
  type: 'error' | 'crash' | 'performance' | 'network';
  message: string;
  stack?: string;
  componentStack?: string;
  userAgent?: string;
  pageUrl?: string;
  sentryUrl?: string;
  severity?: 'critical' | 'warning' | 'info';
  additionalData?: Record<string, any>;
}

let isMonitoringInitialized = false;
const reportedErrors = new Set<string>();

/**
 * Report error to backend monitoring API
 */
async function reportError(errorData: ErrorReport): Promise<void> {
  try {
    // Deduplication: Don't report same error multiple times
    const errorKey = `${errorData.type}_${errorData.message}`;
    if (reportedErrors.has(errorKey)) {
      return;
    }
    reportedErrors.add(errorKey);

    // Clear old errors from Set (keep last 50)
    if (reportedErrors.size > 50) {
      const firstKey = reportedErrors.values().next().value;
      reportedErrors.delete(firstKey);
    }

    // Add context
    const report: ErrorReport = {
      ...errorData,
      userAgent: navigator.userAgent,
      pageUrl: window.location.href,
    };

    // Send to backend
    await fetch('/api/frontend-health-monitor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(report),
    }).catch(err => {
      console.error('Failed to report error to monitoring API:', err);
    });
  } catch (error) {
    console.error('Error reporting failed:', error);
  }
}

/**
 * Monitor window errors
 */
function monitorWindowErrors(): void {
  window.addEventListener('error', (event) => {
    reportError({
      type: 'error',
      message: event.message,
      stack: event.error?.stack,
      severity: 'critical',
      additionalData: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    reportError({
      type: 'error',
      message: `Unhandled Promise Rejection: ${event.reason}`,
      stack: event.reason?.stack,
      severity: 'critical',
    });
  });
}

/**
 * Monitor performance issues
 */
function monitorPerformance(): void {
  // Check if page load is too slow
  window.addEventListener('load', () => {
    setTimeout(() => {
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (perfData) {
        const loadTime = perfData.loadEventEnd - perfData.fetchStart;
        
        // Report if page load took more than 5 seconds
        if (loadTime > 5000) {
          reportError({
            type: 'performance',
            message: `Slow page load: ${Math.round(loadTime)}ms`,
            severity: 'warning',
            additionalData: {
              loadTime,
              domContentLoaded: perfData.domContentLoadedEventEnd - perfData.fetchStart,
              firstPaint: performance.getEntriesByType('paint')[0]?.startTime || 0,
            },
          });
        }
      }
    }, 100);
  });
}

/**
 * Monitor network errors
 */
function monitorNetworkErrors(): void {
  // Monitor failed fetch requests
  const originalFetch = window.fetch;
  
  window.fetch = async (...args) => {
    try {
      const response = await originalFetch(...args);
      
      // Report 5xx errors from our APIs
      if (response.status >= 500 && typeof args[0] === 'string' && args[0].startsWith('/api/')) {
        reportError({
          type: 'network',
          message: `API Error: ${args[0]} returned ${response.status}`,
          severity: 'critical',
          additionalData: {
            url: args[0],
            status: response.status,
            statusText: response.statusText,
          },
        });
      }
      
      return response;
    } catch (error) {
      // Report network failures
      if (typeof args[0] === 'string' && args[0].startsWith('/api/')) {
        reportError({
          type: 'network',
          message: `Network failure: ${args[0]}`,
          severity: 'critical',
          additionalData: {
            url: args[0],
            error: error instanceof Error ? error.message : String(error),
          },
        });
      }
      throw error;
    }
  };
}

const BOT_UA_RE =
  /bot|crawl|spider|slurp|headless|wget|curl|python-requests|scrapy|bytespider|gptbot|claude|perplexity|semrush|ahrefs|bingpreview|facebookexternalhit|twitterbot|linkedinbot|slackbot|discordbot|preview|lighthouse|pagespeed|pingdom|uptimerobot|vercel-screenshot|google-inspection|storebot|chrome-lighthouse/i;

function isLikelyAutomatedClient(): boolean {
  try {
    const ua = navigator.userAgent || '';
    if (BOT_UA_RE.test(ua)) return true;
    if ((navigator as Navigator & { webdriver?: boolean }).webdriver) return true;
    // Prefetch / prerender / background tabs often never paint React fully
    if (document.visibilityState === 'hidden') return true;
  } catch {
    // ignore
  }
  return false;
}

function hasRenderableApp(): boolean {
  const root = document.getElementById('root');
  if (!root) return false;
  if (root.children.length > 0) return true;
  // React 18 may briefly have text/comment nodes before element children
  if ((root.textContent || '').trim().length > 0) return true;
  return false;
}

/**
 * Check if site is black screen (no content rendered).
 * Retries to avoid false positives from slow chunk loads and bot/prerender clients.
 */
function checkBlackScreen(): void {
  if (isLikelyAutomatedClient()) {
    return;
  }

  const delaysMs = [5000, 8000, 12000];
  let attempt = 0;

  const runCheck = () => {
    if (hasRenderableApp()) {
      return;
    }

    // Still empty — schedule another check unless this was the last attempt
    if (attempt < delaysMs.length - 1) {
      attempt += 1;
      setTimeout(runCheck, delaysMs[attempt] - delaysMs[attempt - 1]);
      return;
    }

    // Final confirmation: ignore bots/hidden tabs that appeared mid-check
    if (isLikelyAutomatedClient() || document.visibilityState === 'hidden') {
      return;
    }

    const root = document.getElementById('root');
    reportError({
      type: 'crash',
      message: 'Black screen detected - Root element is empty',
      severity: 'critical',
      additionalData: {
        rootExists: !!root,
        childrenCount: root?.children.length || 0,
        bodyHTML: document.body.innerHTML.substring(0, 200),
        visibilityState: document.visibilityState,
        readyState: document.readyState,
      },
    });
  };

  setTimeout(runCheck, delaysMs[0]);
}

/**
 * Monitor React rendering errors
 */
export function reportReactError(error: Error, errorInfo: React.ErrorInfo): void {
  reportError({
    type: 'crash',
    message: error.message,
    stack: error.stack,
    componentStack: errorInfo.componentStack,
    severity: 'critical',
  });
}

/**
 * Initialize frontend monitoring
 */
export function initFrontendMonitoring(): void {
  if (isMonitoringInitialized) {
    return;
  }

  // Only monitor in production
  if (import.meta.env.PROD) {
    monitorWindowErrors();
    monitorPerformance();
    monitorNetworkErrors();
    checkBlackScreen();
    
    console.info('✅ Frontend monitoring initialized');
  } else {
    console.info('ℹ️ Frontend monitoring disabled in development');
  }

  isMonitoringInitialized = true;
}

/**
 * Manually report custom errors
 */
export function reportCustomError(message: string, additionalData?: Record<string, any>): void {
  reportError({
    type: 'error',
    message,
    severity: 'warning',
    additionalData,
  });
}

/**
 * Check site health and report status
 */
export async function performHealthCheck(): Promise<boolean> {
  try {
    // Check if critical APIs are responding
    const healthChecks = await Promise.all([
      fetch('/api/chat', { method: 'OPTIONS' }).then(r => r.ok).catch(() => false),
      fetch('/api/telegram-webhook', { method: 'OPTIONS' }).then(r => r.ok).catch(() => false),
    ]);

    const allHealthy = healthChecks.every(check => check);

    if (!allHealthy) {
      reportError({
        type: 'error',
        message: 'Health check failed - Some APIs are not responding',
        severity: 'critical',
        additionalData: {
          healthChecks: {
            chat: healthChecks[0],
            telegram: healthChecks[1],
          },
        },
      });
    }

    return allHealthy;
  } catch (error) {
    reportError({
      type: 'error',
      message: 'Health check failed with exception',
      severity: 'critical',
      additionalData: {
        error: error instanceof Error ? error.message : String(error),
      },
    });
    return false;
  }
}

