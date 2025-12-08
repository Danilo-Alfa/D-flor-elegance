"use client";

import React, { useState } from "react";

interface ImageFrameProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
}

export function ImageFrame({ src, alt, className = "", style }: ImageFrameProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Check if the src is a direct image URL or needs iframe
  const isDirectImage = src.match(/\.(jpg|jpeg|png|gif|webp|svg|avif)(\?.*)?$/i) ||
                        src.includes("unsplash.com") ||
                        src.includes("cloudinary.com") ||
                        src.includes("imgur.com");

  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-[var(--secondary)] text-[var(--muted)] ${className}`}
        style={style}
      >
        <div className="text-center p-4">
          <svg
            className="w-12 h-12 mx-auto mb-2 opacity-50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-xs">{alt}</p>
        </div>
      </div>
    );
  }

  if (isDirectImage) {
    return (
      <div className={`relative ${className}`} style={style}>
        {!loaded && (
          <div className="absolute inset-0 bg-[var(--secondary)] animate-pulse" />
        )}
        <img
          src={src}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          loading="lazy"
        />
      </div>
    );
  }

  // Use iframe for other URLs
  return (
    <div className={`image-frame relative ${className}`} style={style}>
      {!loaded && (
        <div className="absolute inset-0 bg-[var(--secondary)] animate-pulse" />
      )}
      <iframe
        src={src}
        title={alt}
        className="w-full h-full border-none"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        sandbox="allow-same-origin"
        loading="lazy"
      />
    </div>
  );
}
