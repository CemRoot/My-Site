/**
 * Diagnostic instrumentation. INERT unless built with VITE_PERF_PROBE=1.
 *
 *     VITE_PERF_PROBE=1 npm run build
 *     npx vite preview --port 4173
 *     npx lighthouse http://localhost:4173/ --preset=desktop --output=json
 *
 * `import.meta.env.VITE_PERF_PROBE` is replaced at build time, so in a normal
 * build `PROBE` is the literal `false`, every call below collapses to a no-op
 * and terser removes it. Nothing here ships to production.
 *
 * Why it exists: production Lighthouse attributed ~994 ms of long tasks to
 * react-vendor and 295 ms to headController, but a bare stack does not say
 * WHICH component or WHICH phase. Everything is emitted as
 * `performance.measure`, which Lighthouse collects into its `user-timings`
 * audit — so the numbers come back already measured under CPU throttling
 * rather than from an unthrottled dev machine.
 */

import { Profiler, type ReactNode } from 'react';

export const PROBE = import.meta.env.VITE_PERF_PROBE === '1';

interface Row {
  name: string;
  ms: number;
  count: number;
  phase?: string;
}

const rows = new Map<string, Row>();

function record(name: string, ms: number, phase?: string): void {
  const key = phase ? `${name} (${phase})` : name;
  const existing = rows.get(key);
  if (existing) {
    existing.ms += ms;
    existing.count += 1;
  } else {
    rows.set(key, { name, ms, count: 1, phase });
  }
  if (typeof window !== 'undefined') {
    (window as unknown as { __CK_PROBE__: Row[] }).__CK_PROBE__ = [...rows.values()].sort(
      (a, b) => b.ms - a.ms,
    );
  }
}

/** Emit a `performance.measure` Lighthouse will surface in user-timings. */
function emit(name: string, startTime: number, duration: number): void {
  try {
    performance.measure(`ck:${name}`, { start: startTime, duration });
  } catch {
    /* measure with an explicit start is unsupported somewhere — ignore */
  }
}


/**
 * Time a synchronous block and attribute it by name.
 *
 * Branch on the build-time constant OUTSIDE the function body, not inside it.
 * With the check inside, terser keeps the wrapper and its label string in the
 * production bundle; selecting a bare `(_, fn) => fn()` up front lets it inline
 * the call away entirely.
 */
export const probeSpan: <T>(name: string, fn: () => T) => T = PROBE
  ? <T,>(name: string, fn: () => T): T => {
      const start = performance.now();
      try {
        return fn();
      } finally {
        const duration = performance.now() - start;
        record(name, duration);
        emit(name, start, duration);
      }
    }
  : <T,>(_name: string, fn: () => T): T => fn();

/** Same, for a phase that awaits. Measures wall time, not CPU. */
export const probeSpanAsync: <T>(name: string, fn: () => Promise<T>) => Promise<T> = PROBE
  ? async <T,>(name: string, fn: () => Promise<T>): Promise<T> => {
      const start = performance.now();
      try {
        return await fn();
      } finally {
        const duration = performance.now() - start;
        record(`${name} [wall]`, duration);
        emit(`${name} [wall]`, start, duration);
      }
    }
  : <T,>(_name: string, fn: () => Promise<T>): Promise<T> => fn();

/**
 * Wraps a subtree in React's <Profiler> when probing.
 *
 * `onRender` only reports real durations in a profiling build of react-dom —
 * vite.config.ts aliases react-dom/client to react-dom/profiling when
 * VITE_PERF_PROBE is set. Without that alias every duration comes back 0.
 */
export function ProbeTree({ id, children }: { id: string; children: ReactNode }) {
  if (!PROBE) return <>{children}</>;
  return (
    <Profiler
      id={id}
      onRender={(profilerId, phase, actualDuration, _base, startTime) => {
        record(profilerId, actualDuration, phase);
        emit(`${profilerId}:${phase}`, startTime, actualDuration);
      }}
    >
      {children}
    </Profiler>
  );
}

