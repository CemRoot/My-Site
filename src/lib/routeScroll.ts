/**
 * Route-level scroll policy.
 *
 * - New navigation (PUSH / REPLACE)  → start the new page at the top.
 * - Back / forward (POP)             → resume where the reader left that entry.
 * - /tech-news list ← article        → handled by the list itself (async data,
 *                                      see techNewsListRestore.ts).
 *
 * Decisions are made ONCE per history entry (location.key), never per render.
 * Deriving them from render-time refs made them flip on unrelated re-renders
 * (e.g. the scroll-to-top button appearing at 500px), which re-fired the
 * scroll-to-top effect while the reader was scrolling.
 */

const POSITIONS_STORAGE_KEY = 'route-scroll-positions';
const MAX_ENTRIES = 50;
/** Give async content (lazy chunks, API data, images) this long to grow tall enough. */
const RESTORE_TIMEOUT_MS = 2500;

export function isTechNewsDetailPath(path: string | undefined): boolean {
  return typeof path === 'string' && path.startsWith('/tech-news/') && path.length > '/tech-news/'.length;
}

/**
 * History entries are identified by pathname + location.key. The key alone is
 * not unique: every freshly loaded document starts at key "default".
 */
export function routeEntryId(pathname: string, key: string): string {
  return `${pathname}#${key}`;
}

type PositionMap = Record<string, number>;

function readPositions(): PositionMap {
  try {
    const raw = sessionStorage.getItem(POSITIONS_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    return parsed && typeof parsed === 'object' ? (parsed as PositionMap) : {};
  } catch {
    return {};
  }
}

export function saveRoutePosition(key: string, y: number): void {
  try {
    const map = readPositions();
    delete map[key];
    map[key] = Math.max(0, Math.round(y));
    const keys = Object.keys(map);
    for (const old of keys.slice(0, Math.max(0, keys.length - MAX_ENTRIES))) delete map[old];
    sessionStorage.setItem(POSITIONS_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore quota / private mode
  }
}

export function readRoutePosition(key: string): number | null {
  const y = readPositions()[key];
  return typeof y === 'number' && Number.isFinite(y) ? y : null;
}

/** Jump without animation — `html { scroll-behavior: smooth }` would otherwise animate it. */
export function jumpTo(top: number): void {
  window.scrollTo({ top, left: 0, behavior: 'instant' });
}

/**
 * Scroll to `target` as soon as the page is tall enough. Gives up on timeout,
 * and immediately on any reader input so it can never fight the reader.
 * Returns a cancel function.
 */
export function restoreScrollWhenReady(target: number): () => void {
  if (target <= 0) {
    if (window.scrollY !== 0) jumpTo(0);
    return () => {};
  }

  let done = false;
  let raf = 0;
  const started = performance.now();
  const inputEvents = ['wheel', 'touchstart', 'pointerdown', 'keydown'] as const;

  const stop = () => {
    if (done) return;
    done = true;
    cancelAnimationFrame(raf);
    for (const ev of inputEvents) window.removeEventListener(ev, stop, true);
  };

  const tick = () => {
    if (done) return;
    const maxY = document.documentElement.scrollHeight - window.innerHeight;
    if (maxY >= target - 1) {
      jumpTo(target);
      stop();
      return;
    }
    if (performance.now() - started > RESTORE_TIMEOUT_MS) {
      jumpTo(Math.max(0, maxY));
      stop();
      return;
    }
    raf = requestAnimationFrame(tick);
  };

  for (const ev of inputEvents) window.addEventListener(ev, stop, { capture: true, passive: true });
  tick();
  return stop;
}
