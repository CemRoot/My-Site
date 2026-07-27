/**
 * <SpeedInsights /> injects a script from va.vercel-scripts.com the moment it
 * mounts. Rendering it in the initial React tree put that request in the
 * critical path — it showed up in the network tree alongside the Sentry
 * envelope while the hero was still blank.
 *
 * Mounting it after `load` + idle moves the script out of the LCP window.
 *
 * Safe for the metrics themselves: Speed Insights reads Web Vitals through
 * PerformanceObserver with `buffered: true`, so LCP, FCP and CLS entries that
 * occurred before it registered are replayed to it. Interaction timings are the
 * one class that cannot be recovered retroactively, so very early clicks may go
 * unmeasured — an acceptable trade for not competing with first paint.
 */

import { useEffect, useState } from 'react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { afterLoad } from '../lib/afterLoad';

export function DeferredSpeedInsights() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => afterLoad(() => setMounted(true)), []);

  return mounted ? <SpeedInsights /> : null;
}
