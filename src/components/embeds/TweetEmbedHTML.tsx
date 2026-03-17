/**
 * Twitter (X) Embed using Native HTML
 * Renders Twitter's official embed HTML with script loader
 */

import React, { useEffect, useRef } from 'react';
import { TWITTER_WIDGET_SCRIPT_URL } from '../../lib/constants/urls';

interface TweetEmbedHTMLProps {
  id: string;
  url?: string;
}

let twitterScriptLoaded = false;
let twitterScriptPromise: Promise<void> | null = null;

function waitForTwitterWidgets(timeoutMs = 3000): Promise<void> {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const checkReady = () => {
      if (window.twttr?.widgets || Date.now() - startedAt >= timeoutMs) {
        resolve();
        return true;
      }
      return false;
    };

    if (checkReady()) {
      return;
    }

    const interval = window.setInterval(() => {
      if (checkReady()) {
        window.clearInterval(interval);
      }
    }, 50);
  });
}

function ensureTwitterScript() {
  if (twitterScriptLoaded && window.twttr?.widgets) {
    return Promise.resolve();
  }

  if (twitterScriptPromise) {
    return twitterScriptPromise;
  }

  twitterScriptPromise = new Promise((resolve) => {
    const existingScript = document.querySelector('[data-twitter-embed="true"]') as HTMLScriptElement | null;

    const onReady = () => {
      twitterScriptLoaded = true;
      resolve();
    };

    if (existingScript) {
      existingScript.addEventListener('load', onReady, { once: true });
      void waitForTwitterWidgets().then(onReady);
      return;
    }

    const script = document.createElement('script');
    script.src = TWITTER_WIDGET_SCRIPT_URL;
    script.async = true;
    script.charset = 'utf-8';
    script.setAttribute('data-twitter-embed', 'true');
    script.onload = () => {
      void waitForTwitterWidgets().then(onReady);
    };
    script.onerror = () => {
      console.warn('Twitter widget script failed to load');
      resolve();
    };
    document.body.appendChild(script);
  });

  return twitterScriptPromise;
}

export default function TweetEmbedHTML({ id, url }: TweetEmbedHTMLProps) {
  const tweetUrl = url || `https://twitter.com/i/status/${id}`;
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ensureTwitterScript().then(() => {
      if (window.twttr?.widgets && containerRef.current) {
        window.twttr.widgets.load(containerRef.current);
      }
    }).catch((error) => {
      console.warn('Twitter widget initialization failed', error);
    });
  }, [id]);

  return (
    <div ref={containerRef} className="my-8 mx-auto w-full max-w-[550px]">
      <blockquote className="twitter-tweet" data-theme="light">
        <p lang="en" dir="ltr">Loading tweet...</p>
        <a href={tweetUrl}>View on Twitter</a>
      </blockquote>
    </div>
  );
}
