/**
 * Twitter/X Tweet Embed Component
 * Uses react-tweet for lightweight, script-free embedding
 */

import React from 'react';
import { Tweet } from 'react-tweet';

interface TweetEmbedProps {
  id: string;
}

export default function TweetEmbed({ id }: TweetEmbedProps) {
  return (
    <div className="my-8 mx-auto max-w-[560px]">
      <Tweet id={id} />
    </div>
  );
}

