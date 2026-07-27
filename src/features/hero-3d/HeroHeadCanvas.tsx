/**
 * Hero wire head stage — idle-loads the GLB, runs scatter→assemble, then
 * pointer-repels bars while the cursor is over the stage.
 */

import { useEffect, useRef, useState } from 'react';

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

function canLoad3D(): boolean {
  if (typeof window === 'undefined') return false;

  const connection = (
    navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }
  ).connection;
  if (connection?.saveData) return false;
  if (connection?.effectiveType && /^(slow-)?2g$/.test(connection.effectiveType)) return false;

  return true;
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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

    const start = () => {
      requestAnimationFrame(() => {
        if (cancelled || !host.isConnected) return;
        host.replaceChildren();
        canvas = document.createElement('canvas');
        canvas.setAttribute('aria-hidden', 'true');
        // Full-bleed inside the stage — no max-width shrink.
        canvas.className = 'pointer-events-none absolute inset-0 h-full w-full';
        host.appendChild(canvas);
        setLive3d(true);

        const reducedMotion = prefersReducedMotion();

        import('./headController')
          .then(({ mountHead }) => {
            if (cancelled || !canvas?.isConnected) return;
            return mountHead(canvas, {
              reducedMotion,
              pointerTarget: pointerTargetRef?.current ?? stage,
            }).then((d) => {
              if (cancelled) {
                d();
                return;
              }
              dispose = d;
            });
          })
          .catch((error) => {
            console.warn('[hero-3d] skipped', error);
            host.replaceChildren();
            setLive3d(false);
          });
      });
    };

    if (typeof requestIdleCallback === 'function') {
      idleHandle = requestIdleCallback(start, { timeout: 1200 });
    } else {
      timeoutHandle = window.setTimeout(start, 350);
    }

    return () => {
      cancelled = true;
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
      <div
        ref={canvasHostRef}
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 ${live3d ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
}
