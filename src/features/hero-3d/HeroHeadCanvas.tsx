/**
 * Hero wire head stage.
 *
 * Poster first, canvas second. A static WebP of the assembled bust ships in the
 * HTML and paints with first paint; three.js and the 251 KB GLB are fetched only
 * once the hero is in view AND the main thread is idle, then cross-fade in over
 * the poster and take over the scatter/assemble and pointer wake.
 *
 * The 1,200 ms idle timeout this used to carry always expired on a mid-range
 * phone — the main thread is never idle while React is booting — so ~430 KB of
 * 3D landed in the middle of the LCP window for a decoration nobody could see
 * yet. The poster removes the reason to hurry.
 */

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import posterMetrics from './posterMetrics.json';
import { probeSpanAsync } from '../../lib/perfProbe';

const POSTER_SRC = `/models/${posterMetrics.file}`;
/**
 * A JSON import widens every value to `string`, and React types properties like
 * `pointerEvents` as unions of literals. The generator only ever writes valid
 * CSS here, so the cast is asserting what the file already guarantees.
 */
const POSTER_STYLE = posterMetrics.style as CSSProperties;

/**
 * How long to wait for an idle main thread before loading anyway. Long enough
 * to clear hydration and the LCP window; the poster is on screen throughout, so
 * there is nothing to race.
 */
const IDLE_TIMEOUT_MS = 3500;
/** Same intent for browsers without requestIdleCallback (Safari < 16.4). */
const FALLBACK_DELAY_MS = 2500;
/** Start loading slightly before the stage scrolls into view. */
const ROOT_MARGIN = '200px';

interface HeroHeadCanvasProps {
  className?: string;
  /**
   * Element whose pointer movement drives the scatter. The canvas is a
   * full-bleed layer sitting *under* the hero copy, so it must not capture
   * events itself — otherwise it would either swallow clicks on the CTAs or,
   * with the copy layered above it, go dead everywhere text sits. Pointing this
   * at the hero section gives the whole area an active surface.
   */
  pointerTargetRef?: React.RefObject<HTMLElement | null>;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function canLoad3D(): boolean {
  if (typeof window === 'undefined') return false;

  /*
    Under reduced motion the controller renders one static frame of the
    assembled bust and disables the pointer wake — which is precisely what the
    poster already shows. Loading three.js to redraw it would cost ~430 KB for
    no visible difference, so the poster simply stays.
  */
  if (prefersReducedMotion()) return false;

  const connection = (
    navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }
  ).connection;
  if (connection?.saveData) return false;
  if (connection?.effectiveType && /^(slow-)?2g$/.test(connection.effectiveType)) return false;

  return true;
}

export function HeroHeadCanvas({ className, pointerTargetRef }: HeroHeadCanvasProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const [live3d, setLive3d] = useState(false);

  useEffect(() => {
    const host = canvasHostRef.current;
    const stage = stageRef.current;
    if (!host || !stage || !canLoad3D()) return;

    let dispose: (() => void) | undefined;
    let canvas: HTMLCanvasElement | undefined;
    let cancelled = false;
    let idleHandle: number | undefined;
    let timeoutHandle: number | undefined;
    let observer: IntersectionObserver | undefined;

    const start = () => {
      requestAnimationFrame(() => {
        if (cancelled || !host.isConnected) return;
        host.replaceChildren();
        canvas = document.createElement('canvas');
        canvas.setAttribute('aria-hidden', 'true');
        // Full-bleed inside the stage — no max-width shrink.
        canvas.className = 'pointer-events-none absolute inset-0 h-full w-full';
        host.appendChild(canvas);

        probeSpanAsync('head.moduleImport', () => import('./headController'))
          .then(({ mountHead }) => {
            const el = canvas;
            if (cancelled || !el?.isConnected) return;
            return probeSpanAsync('head.mountHead', () => mountHead(el, {
              pointerTarget: pointerTargetRef?.current ?? stage,
            })).then((d) => {
              if (cancelled) {
                d();
                return;
              }
              dispose = d;
              // Only now is there something to look at. Revealing the canvas
              // when it was merely *created* used to blank the stage for the
              // whole GLB fetch.
              setLive3d(true);
            });
          })
          .catch((error) => {
            console.warn('[hero-3d] skipped', error);
            host.replaceChildren();
            setLive3d(false);
          });
      });
    };

    const startWhenIdle = () => {
      if (cancelled) return;
      if (typeof requestIdleCallback === 'function') {
        idleHandle = requestIdleCallback(start, { timeout: IDLE_TIMEOUT_MS });
      } else {
        timeoutHandle = window.setTimeout(start, FALLBACK_DELAY_MS);
      }
    };

    if (typeof IntersectionObserver === 'function') {
      observer = new IntersectionObserver(
        (entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return;
          observer?.disconnect();
          observer = undefined;
          startWhenIdle();
        },
        { rootMargin: ROOT_MARGIN },
      );
      observer.observe(stage);
    } else {
      startWhenIdle();
    }

    return () => {
      cancelled = true;
      observer?.disconnect();
      if (idleHandle !== undefined) cancelIdleCallback(idleHandle);
      if (timeoutHandle !== undefined) clearTimeout(timeoutHandle);
      dispose?.();
      host.replaceChildren();
      setLive3d(false);
    };
  }, []);

  return (
    <div
      ref={stageRef}
      aria-hidden="true"
      className={`pointer-events-none touch-none ${className ?? ''}`}
    >
      {/*
        Matches the markup homeShell() writes into #root, so React's swap is a
        no-op repaint. Kept mounted rather than unmounted on hand-off: it is the
        fallback whenever the canvas never arrives (reduced motion, save-data,
        2G, WebGL failure), and it fades under the assembling bust instead of
        cutting out.
      */}
      <img
        src={POSTER_SRC}
        alt=""
        width={posterMetrics.pixels.width}
        height={posterMetrics.pixels.height}
        decoding="async"
        fetchPriority="high"
        className="absolute transition-opacity duration-500 ease-out"
        style={{
          // Position, size and transform all come from posterMetrics.json so the
          // shell's copy of this image and React's copy cannot disagree.
          ...POSTER_STYLE,
          opacity: live3d ? 0 : 1,
          transitionDelay: live3d ? '220ms' : '0ms',
        }}
      />
      <div
        ref={canvasHostRef}
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 transition-opacity duration-500 ease-out ${
          live3d ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
}
