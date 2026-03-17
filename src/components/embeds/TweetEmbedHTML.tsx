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
      if (window.twttr?.widgets) {
        onReady();
      } else {
        existingScript.addEventListener('load', onReady, { once: true });
      }
      return;
    }

    const script = document.createElement('script');
    script.src = TWITTER_WIDGET_SCRIPT_URL;
    script.async = true;
    script.charset = 'utf-8';
    script.setAttribute('data-twitter-embed', 'true');
    script.onload = onReady;
    script.onerror = () => resolve();
    document.body.appendChild(script);
  });

  return twitterScriptPromise;
}

export default function TweetEmbedHTML({ id, url }: TweetEmbedHTMLProps) {
  const tweetUrl = url || `https://twitter.com/i/status/${id}`;
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void ensureTwitterScript().then(() => {
      if (window.twttr?.widgets && containerRef.current) {
        window.twttr.widgets.load(containerRef.current);
      }
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
