import { createRoot } from "react-dom/client";
import { SpeedInsights } from "@vercel/speed-insights/react";
import App from "./App.tsx";
import "./index.css";
import { initSentry } from "./lib/sentry";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { initFrontendMonitoring } from "./lib/frontend-monitor";

// Initialize Sentry before rendering
initSentry();

// Initialize frontend monitoring for error tracking and Telegram notifications
initFrontendMonitoring();

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
    <SpeedInsights />
  </ErrorBoundary>
);