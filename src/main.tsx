// Polyfills for older browsers (Chrome 79, etc.)
// Object.hasOwn was introduced in ES2022
if (!Object.hasOwn) {
  Object.hasOwn = (obj: object, prop: PropertyKey) => 
    Object.prototype.hasOwnProperty.call(obj, prop);
}

import { createRoot } from "react-dom/client";
import { SpeedInsights } from "@vercel/speed-insights/react";
import App from "./App.tsx";
import "./fonts.css";
import "./index.css";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Render app immediately for fast FCP
createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
    <SpeedInsights />
  </ErrorBoundary>
);

// Defer heavy initializations until after first paint
// This improves FCP by ~500ms
requestIdleCallback(() => {
  // Initialize Sentry after first paint
  import("./lib/sentry").then(({ initSentry }) => {
    initSentry();
  });

  // Initialize frontend monitoring after first paint
  import("./lib/frontend-monitor").then(({ initFrontendMonitoring }) => {
    initFrontendMonitoring();
  });
}, { timeout: 2000 });