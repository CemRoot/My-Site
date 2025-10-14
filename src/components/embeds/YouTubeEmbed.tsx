/**
 * YouTube Embed Component
 * Responsive iframe embed with aspect ratio preservation
 */

import React from 'react';

interface YouTubeEmbedProps {
  id: string;
}

export default function YouTubeEmbed({ id }: YouTubeEmbedProps) {
  const src = `https://www.youtube.com/embed/${id}`;

  return (
    <div className="my-8 mx-auto w-full max-w-3xl">
      {/* Aspect ratio wrapper prevents CLS */}
      <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-lg">
        <iframe
          className="absolute inset-0 h-full w-full"
          src={src}
          title="YouTube video"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    </div>
  );
}

