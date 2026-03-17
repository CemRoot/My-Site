/**
 * Twitter (X) Embed using Native HTML
 * Renders Twitter's official embed HTML with script loader
 */

import React, { useEffect } from 'react';
import { TWITTER_WIDGET_SCRIPT_URL } from '../../lib/constants/urls';

interface TweetEmbedHTMLProps {
  id: string;
  url?: string;
}

let twitterScriptLoaded = false;

function ensureTwitterScript() {
  if (twitterScriptLoaded) {
    // Script already loaded, trigger widget reload
    if (window.twttr?.widgets) {
      window.twttr.widgets.load();
    }
    return;
  }

  if (document.querySelector('[data-twitter-embed="true"]')) {
    twitterScriptLoaded = true;
    if (window.twttr?.widgets) {
      window.twttr.widgets.load();
    }
    return;
  }

  const script = document.createElement('script');
  script.src = TWITTER_WIDGET_SCRIPT_URL;
  script.async = true;
  script.charset = 'utf-8';
  script.onload = () => {
    twitterScriptLoaded = true;
    if (window.twttr?.widgets) {
      window.twttr.widgets.load();
    }
  };
  script.setAttribute('data-twitter-embed', 'true');
  document.body.appendChild(script);
}

export default function TweetEmbedHTML({ id, url }: TweetEmbedHTMLProps) {
  const tweetUrl = url || `https://twitter.com/i/status/${id}`;

  useEffect(() => {
    ensureTwitterScript();
  }, [id]);

  return (
    <div className="my-8 mx-auto w-full max-w-[550px]">
      <blockquote className="twitter-tweet" data-theme="light">
        <p lang="en" dir="ltr">Loading tweet...</p>
        <a href={tweetUrl}>View on Twitter</a>
      </blockquote>
    </div>
  );
}

