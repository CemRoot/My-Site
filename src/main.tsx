import { lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./fonts.css";
import "./styles/globals.css";
import ErrorBoundary from "./components/ErrorBoundary";
import { DeferredSpeedInsights } from "./components/DeferredSpeedInsights";
import { afterLoad } from "./lib/afterLoad";

/*
  There used to be an Object.hasOwn polyfill above these imports, for Chrome 79.
  react-markdown really does call Object.hasOwn, so it was load-bearing — but
  only for browsers below Chrome 93 / Firefox 92 / Safari 15.4, and the
  stylesheet already rules those out: globals.css uses color-mix() (Chrome 111,
  Safari 16.2) and :has() (Chrome 105, Safari 15.4). The build target now says
  es2022, which matches what the CSS has been demanding all along, so the
  polyfill is dead weight and the bundle no longer carries downlevel helpers.
*/

const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

// Render app immediately for fast FCP
createRoot(document.getElementById("root")!).render(
  <ErrorBoundary
    fallback={
      <Suspense
        fallback={<div className="min-h-screen bg-background" aria-hidden />}
      >
        <NotFoundPage bare />
      </Suspense>
    }
  >
    <App />
    <DeferredSpeedInsights />
  </ErrorBoundary>
);

/*
  Observability, once the page has actually loaded.

  This was `requestIdleCallback(..., { timeout: 2000 })`, which fires during
  loading whenever a gap appears — and unconditionally at 2 s. Measured on
  production that put frontend-*.js at 2,530 ms chaining into a Sentry envelope
  at 2,515 ms, both inside the LCP window. Neither reports anything a visitor
  can see, so neither has any claim on that bandwidth.
*/
afterLoad(() => {
  import("./lib/sentry").then(({ initSentry }) => {
    initSentry();
  });

  import("./lib/frontend-monitor").then(({ initFrontendMonitoring }) => {
    initFrontendMonitoring();
  });
});
