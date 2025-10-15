/**
 * YouTube Embed using Native HTML
 * Renders YouTube's official iframe embed
 */

import React from 'react';

interface YouTubeEmbedHTMLProps {
  videoId: string;
}

export default function YouTubeEmbedHTML({ videoId }: YouTubeEmbedHTMLProps) {
  const embedUrl = `https://www.youtube.com/embed/${videoId}`;

  return (
    <div className="my-8 mx-auto w-full max-w-3xl">
      <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
        <iframe
          className="absolute inset-0 w-full h-full rounded-xl shadow-lg"
          src={embedUrl}
          title={`YouTube video ${videoId}`}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    </div>
  );
}

