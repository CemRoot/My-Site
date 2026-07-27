/**
 * Chunk Loading Error Handler
 *
 * Handles "Failed to fetch dynamically imported module" errors that occur when:
 * 1. A new deployment changes chunk file hashes
 * 2. User has cached HTML with old chunk references
 * 3. Old chunks are no longer available on the server
 *
 * Solution: Automatically reload the page to fetch fresh HTML with new chunk references
 */

import React from 'react';

/**
 * Sentry is reached through a dynamic import, never a static one.
 *
 * This module is imported by App.tsx, so a static `import { captureException }
 * from './sentry'` put the whole @sentry/react SDK in the ENTRY chunk — every
 * visitor downloaded and parsed it on first paint. Deferring `initSentry()`
 * (main.tsx) only delayed the network call; the code was already there.
 *
 * Nothing below needs Sentry unless a chunk has actually failed to load, which
 * is a rare recovery path and can afford one more request.
 */
function reportToSentry(use: (sentry: typeof import('./sentry')) => void): void {
  // Error reporting must never be able to break error recovery.
  import('./sentry').then(use).catch(() => {});
}

const CHUNK_LOAD_ERROR_PATTERNS = [
  'Failed to fetch dynamically imported module',
  'Importing a module script failed',
  'error loading dynamically imported module',
  'Failed to fetch',
];

const RELOAD_KEY = 'chunk_reload_attempted';
const MAX_RELOAD_ATTEMPTS = 2;

/**
 * Check if error is a chunk loading error
 */
export function isChunkLoadError(error: Error): boolean {
  const errorMessage = error.message.toLowerCase();
  return CHUNK_LOAD_ERROR_PATTERNS.some(pattern =>
    errorMessage.includes(pattern.toLowerCase())
  );
}

/**
 * Handle chunk loading errors with automatic reload
 */
export function handleChunkError(error: Error): void {
  if (!isChunkLoadError(error)) {
    return;
  }

  // Track reload attempts to prevent infinite loops
  const reloadCount = Number(sessionStorage.getItem(RELOAD_KEY) || '0');

  if (reloadCount >= MAX_RELOAD_ATTEMPTS) {
    // Max attempts reached, log to Sentry and show error
    reportToSentry(({ captureException }) =>
      captureException(error, {
        chunkError: true,
        reloadAttempts: reloadCount,
        userAgent: navigator.userAgent,
      }),
    );

    console.error('Failed to load application chunks after multiple attempts. Please refresh the page manually.');
    return;
  }

  // Log breadcrumb before reload. Best-effort: the reload below will usually win
  // the race, and an in-memory breadcrumb does not survive it either way — the
  // captureException above is the branch that actually reports.
  reportToSentry(({ addBreadcrumb }) =>
    addBreadcrumb('Chunk load error detected, reloading page', {
      error: error.message,
      reloadAttempt: reloadCount + 1,
    }),
  );

  // Increment reload counter
  sessionStorage.setItem(RELOAD_KEY, String(reloadCount + 1));

  // Reload the page to get fresh HTML with new chunk references
  console.warn('Chunk loading failed. Reloading page to fetch updated resources...');
  window.location.reload();
}

/**
 * Reset reload counter (call this when app successfully loads)
 */
export function resetChunkErrorCounter(): void {
  sessionStorage.removeItem(RELOAD_KEY);
}

/**
 * Create error handler for lazy imports
 */
export function lazyWithRetry<T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  return React.lazy(async () => {
    try {
      const module = await importFunc();
      // Success! Reset counter
      resetChunkErrorCounter();
      return module;
    } catch (error) {
      if (error instanceof Error && isChunkLoadError(error)) {
        handleChunkError(error);
        // Return a dummy component that won't render (page will reload anyway)
        return { default: (() => null) as T };
      }
      throw error;
    }
  });
}
