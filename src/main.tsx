import { createRoot } from "react-dom/client";
import { SpeedInsights } from "@vercel/speed-insights/react";
import App from "./App.tsx";
import "./index.css";
import { initSentry } from "./lib/sentry";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Initialize Sentry before rendering
initSentry();

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
    <SpeedInsights />
  </ErrorBoundary>
);