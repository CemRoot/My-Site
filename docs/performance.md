# Performance

How to measure this site, what the numbers currently are, and where we
deliberately stopped.

Written after an investigation that started from a Lighthouse report and spent
most of its time discovering that the Lighthouse report was pointing at the
wrong file. Read [The two traps](#the-two-traps) before trusting any tool here.

---

## Current numbers

Measured on production (`cemkoyluoglu.codes`), PageSpeed Insights:

| | Mobile | Desktop |
|---|---|---|
| Performance | 78 – 95 | 69 – 71 |
| First Contentful Paint | 1.8 – 2.4 s | 0.3 – 0.4 s |
| Largest Contentful Paint | **2.6 – 2.9 s** | **0.3 – 0.6 s** |
| Cumulative Layout Shift | **0** | 0 – 0.005 |
| Total Blocking Time | 80 – 430 ms | **1,090 – 1,770 ms** |

Baseline before the work: mobile **66** (LCP 5.3 s), desktop **71** (TBT 890 ms).

**Read the score as a range, not a number.** TBT is 30% of the weighting and
Speed Index another 10%, and both depend on how loaded the measuring machine
happens to be. The same build scored 78 and 95 on two consecutive mobile runs
minutes apart. LCP and CLS barely moved across every run — those are the signal.

Take the median of three runs, and skip the first run after a deploy (cold CDN).

---

## The two traps

### 1. Lighthouse attributes long tasks to the wrong file

The `long-tasks` audit assigns a task to whichever script was on top of the
stack **when the task started**. A task that begins in React's scheduler and
spends its time elsewhere is labelled `react-vendor.js`.

This is not a small distortion. Production reported **994 ms across five long
tasks** for `react-vendor.js`. A sampling profiler put React's real self time at
**261 ms**, and the page's own components at **~7 ms** total. The obvious next
move — memoising and lazy-mounting the eight homepage sections — would have
achieved nothing.

**Bundle-level attribution is a hint. Function-level attribution is evidence.**

### 2. Lighthouse's default throttling does not throttle

`--throttling-method=simulate` (the default, and what PSI uses) runs the browser
at full speed and multiplies observed task times afterwards. Two consequences:

- `performance.now()` inside the page measures **real, unthrottled** time.
  Lighthouse reports **simulated** time. A 57 ms block becomes a "295 ms long
  task" at 4x. Both numbers are correct; they are not the same number.
- The trace contains **no sampling profile** — only ~380 `FunctionCall` events.
  You cannot get function-level attribution out of it.

`scripts/cpu-profile.mjs` avoids both by using
`Emulation.setCPUThrottlingRate`, which slows the CPU for real.

---

## Running the profiler

```bash
VITE_PERF_PROBE=1 npm run build
npx vite preview --port 4173
node scripts/cpu-profile.mjs http://localhost:4173/ 16
```

Arguments: `<url> [cpuRate] [captureMs]` — defaults `16` and `9000`.

`VITE_PERF_PROBE=1` changes three things, all build-time:

1. `src/lib/perfProbe.tsx` starts recording. `<ProbeTree id>` wraps each section
   in React's `<Profiler>`; `probeSpan` / `probeSpanAsync` emit
   `performance.measure` around the 3D mount phases.
2. `vite.config.ts` aliases `react-dom/client` → `react-dom/profiling`.
   **Without this every `<Profiler>` duration is 0** — the timing code is
   compiled out of normal production React.
3. Terser keeps function names, so the profile is readable instead of a list of
   one-letter identifiers.

Never set the flag for a real build: profiling react-dom is measurably slower.

### Choosing a CPU rate

`16` reproduces the production desktop symptom on a fast Mac (score ~75,
TBT ~610 ms against production's 69 / 1,770 ms). `4` is what Lighthouse mobile
simulates. Lower rates on a fast machine produce zero long tasks and tell you
nothing.

### Reading the output

```
SELF TIME BY FILE            ← where the work is. Idle and V8 bookkeeping
                               are excluded; including them makes every real
                               cost look tiny.
HOTTEST FUNCTIONS            ← self = time in this function's own frames
                               total = self + everything it called
```

Rank by **self** to find the code that is actually running. Use **total** to
understand what a function pulls in behind it.

---

## What is actually expensive

Measured at a real 16x CPU throttle:

| File | self | share of real work |
|---|---|---|
| `headController-*.js` | 1,983 ms | **71.7%** |
| `react-vendor-*.js` | 249 ms | 9.0% |
| `index-*.js` (app) | 227 ms | 8.2% |
| `rolldown-runtime-*.js` | 61 ms | 2.2% |

| Function | self | What it is |
|---|---|---|
| `tick` | 738.8 ms | The scatter → assemble loop, ~150 frames |
| `isUniqueEdge` | 364.1 ms | three.js `WireframeGeometry` dedup — **one call** |
| `easeOutCubic` | 166.4 ms | Per-segment easing, ~6M calls |
| `scrollTo` | 93.0 ms | Native, from the route-change scroll (now guarded) |
| `updateBuffer` | 80.8 ms | **Every** GPU upload, combined |

React's hottest frames are `renderWithHooks`, `beginWork`,
`commitHookEffectListMount`, `commitPassiveMountOnFiber`, `completeWork` — plain
react-dom reconciliation. The only router entry is `LinkWithRef` at 6.8 ms.
`framer-motion` is not a dependency; `lucide-react` is not in that chunk.

---

## Hypotheses that were tested and rejected

Each of these looked plausible and cost real time to disprove. They are recorded
so nobody re-runs them.

**"The 953 KB per-frame buffer upload is the bottleneck."**
No. `updateBuffer` totals 80.8 ms for the whole animation — 0.1–0.2 ms per
frame at peak, with 13,515 segments moving. three.js uses `bufferSubData` on an
existing buffer, so there is no orphaning; there is one draw call; the tick
allocates nothing (total GC across the capture: 105 ms). `DynamicDrawUsage`,
`updateRange`, interleaved attributes and instancing all optimise a cost that is
already ~1% of the page.

**"The eight homepage sections are expensive to render."**
No. All of them together: ~7 ms.

**"Splitting the 3D mount across frames will help."**
It removes the long task — `headController` went from 1 long task to 0 — but TBT
got **worse** (median 783 ms vs 661 ms over 3 runs each). Reverted.

**"Delay the 3D past the measurement window."**
A 5 s delay after `load` takes desktop from 74 to **99**. The CPU work still
happens; Lighthouse just stops watching first, and a visitor stares at a static
poster for five seconds. Rejected as metric-gaming.

---

## What we kept

- **Poster-first 3D.** A 28.7 KB WebP of the assembled bust ships in the HTML
  shell and paints at first paint; three.js and the 251 KB GLB load only once
  the hero is in view and the thread is idle. See `HeroHeadCanvas.tsx`.
- **Skip inactive segments in `tick`.** `STAGGER = 0.78` means each segment only
  moves during 22% of the timeline; the rest are already at their scatter or
  final position. Output is bit-identical, `headController` CPU dropped 31%.
- **`scrollTo` guard.** The route-change scroll ran on first mount where the page
  was already at the top — a forced scroll and layout that moved nothing.

---

## What we deliberately did not do

**Precompute the wireframe edges offline.** `isUniqueEdge` is 364 ms at 16x, and
it is one call to `new WireframeGeometry()` that could be replaced by shipping
the 39,721 edge pairs in the GLB. Costs ~60–100 KB of download to remove ~110 ms
of production TBT. With FCP and LCP already at 0.3 s and CLS at 0.005, that
trade is not worth the extra build-pipeline coupling today.

> ⚠️ If this is ever revisited: **the edge order must be preserved.**
> `delays[s]` is derived from the segment index, so reordering changes which
> segment flies in when — a visibly different intro.
> `scripts/generate-hero-poster.mjs` already computes the same 39,721 edges and
> can be used to verify ordering against three.js's output.

**Inline `easeOutCubic`.** 166 ms at 16x, but the loop becomes harder to read.

**Reduce the segment count or shorten the animation.** Both would cut CPU
proportionally. Both change the hero, which is the point of the site.

---

## Why we stopped

The remaining work is marginal. FCP, LCP and CLS are good on both form factors;
mobile scores 78–95; the desktop score is held down by TBT, which is dominated
by a deliberate visual effect that we are not willing to degrade.

Desktop Lighthouse is also the harshest possible framing for this page: it
downloads everything instantly, so all the JavaScript lands inside the
measurement window at once. Real desktop visitors have fast connections **and**
fast CPUs, and see none of it.

**From here, measure user experience rather than Lighthouse:** INP, sustained
frame rate during the intro, dropped frames, memory. A visitor never sees
"TBT 1,770 ms" — they see whether the animation is smooth.

---

## What ships in a normal build

Verified on every build (`grep` over `build/assets/*.js`):

| | In production |
|---|---|
| Recording machinery (`__CK_PROBE__`) | 0 |
| React `<Profiler>` wrappers (`ProbeTree`) | 0 |
| `react-dom/profiling` | 0 |
| Per-frame `performance.now()` in `tick` | 0 |
| Inert `probeSpan` wrappers | **10 labels, ~200 bytes** |

The last row is honest rather than zero. `probeSpanAsync` inlines away
completely; three `probeSpan` call sites do not, so their label strings and a
`(_, fn) => fn()` wrapper survive minification. They execute once, at 3D mount,
and cost microseconds. Everything that ran per frame has been removed.
