/**
 * Run work once the page has finished loading AND the main thread is free.
 *
 * `requestIdleCallback` alone is not late enough. Idle callbacks fire during
 * loading whenever there is a gap between tasks, and with a timeout they fire
 * regardless — which is how Sentry's envelope ended up on the network at
 * ~2.5 s, inside the LCP window, on a page that had not painted its hero yet.
 * Waiting for `load` first means nothing here can compete with the content.
 *
 * Also guards `requestIdleCallback` itself: Safari only shipped it in 16.4, and
 * calling it unguarded threw a ReferenceError that silently disabled
 * observability on older Safari.
 */
export function afterLoad(run: () => void): () => void {
  let idleHandle: number | undefined;
  let timeoutHandle: number | undefined;
  let cancelled = false;

  const schedule = () => {
    if (cancelled) return;
    if (typeof requestIdleCallback === 'function') {
      idleHandle = requestIdleCallback(run, { timeout: IDLE_TIMEOUT_MS });
    } else {
      timeoutHandle = window.setTimeout(run, FALLBACK_DELAY_MS);
    }
  };

  if (document.readyState === 'complete') {
    schedule();
  } else {
    window.addEventListener('load', schedule, { once: true });
  }

  return () => {
    cancelled = true;
    window.removeEventListener('load', schedule);
    if (idleHandle !== undefined && typeof cancelIdleCallback === 'function') {
      cancelIdleCallback(idleHandle);
    }
    if (timeoutHandle !== undefined) clearTimeout(timeoutHandle);
  };
}

const IDLE_TIMEOUT_MS = 3000;
const FALLBACK_DELAY_MS = 1200;
