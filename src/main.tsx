import { createRoot } from "react-dom/client";
import { lazy, Suspense } from "react";
import App from "./App.tsx";
import "./index.css";
import { initSentry } from "./lib/sentry";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Initialize Sentry before rendering
initSentry();

// Lazy load SpeedInsights to not block initial render
const SpeedInsights = lazy(() =>
  import("@vercel/speed-insights/react").then((mod) => ({
    default: mod.SpeedInsights,
  }))
);

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
    <Suspense fallback={null}>
      <SpeedInsights />
    </Suspense>
  </ErrorBoundary>
);