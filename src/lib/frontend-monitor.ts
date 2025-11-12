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

/**
 * Check if site is black screen (no content rendered)
 */
function checkBlackScreen(): void {
  setTimeout(() => {
    const root = document.getElementById('root');
    
    if (!root || root.children.length === 0) {
      reportError({
        type: 'crash',
        message: 'Black screen detected - Root element is empty',
        severity: 'critical',
        additionalData: {
          rootExists: !!root,
          childrenCount: root?.children.length || 0,
          bodyHTML: document.body.innerHTML.substring(0, 200),
        },
      });
    }
  }, 3000); // Wait 3 seconds for React to render
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

