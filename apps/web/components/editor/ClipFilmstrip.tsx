"use client";

import React, { useEffect, useState } from "react";

interface ClipFilmstripProps {
  sourceUrl: string;
  start: number;
  end: number;
  width: number;
}

// Global in-memory cache to prevent re-extracting frames for the same video
const filmstripCache = new Map<string, string[]>();

export function ClipFilmstrip({ sourceUrl, start, end, width }: ClipFilmstripProps) {
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const duration = Math.max(0.5, end - start);

  // Number of thumbnail tiles to show based on width (each ~50px wide)
  const tileCount = Math.max(2, Math.min(8, Math.floor(width / 55)));
  const cacheKey = `${sourceUrl}-${Math.round(start)}-${Math.round(end)}-${tileCount}`;

  useEffect(() => {
    if (!sourceUrl) return;

    // Check cache first
    if (filmstripCache.has(cacheKey)) {
      setThumbnails(filmstripCache.get(cacheKey)!);
      return;
    }

    let isCancelled = false;

    // Asynchronous background extraction without blocking UI thread
    const generateFilmstrip = async () => {
      try {
        const video = document.createElement("video");
        video.crossOrigin = "anonymous";
        video.muted = true;
        video.playsInline = true;
        video.preload = "auto";
        video.src = sourceUrl;

        await new Promise<void>((resolve, reject) => {
          video.onloadeddata = () => resolve();
          video.onerror = () => reject();
          setTimeout(() => resolve(), 1500); // safety timeout
        });

        if (isCancelled) return;

        const canvas = document.createElement("canvas");
        canvas.width = 64;
        canvas.height = 36;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const frames: string[] = [];
        const timeStep = duration / tileCount;

        for (let i = 0; i < tileCount; i++) {
          if (isCancelled) return;
          const seekTime = Math.min(video.duration || duration, start + i * timeStep + 0.1);

          video.currentTime = seekTime;
          await new Promise<void>((resolve) => {
            const onSeeked = () => {
              video.removeEventListener("seeked", onSeeked);
              resolve();
            };
            video.addEventListener("seeked", onSeeked);
            setTimeout(() => {
              video.removeEventListener("seeked", onSeeked);
              resolve();
            }, 300); // 300ms max per frame
          });

          if (isCancelled) return;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          frames.push(canvas.toDataURL("image/jpeg", 0.6));
        }

        if (!isCancelled && frames.length > 0) {
          filmstripCache.set(cacheKey, frames);
          setThumbnails(frames);
        }
      } catch {
        // Silently fallback to placeholder filmstrip if browser blocks canvas extraction
      }
    };

    // Run in idle callback or next tick so UI never stutters
    if ("requestIdleCallback" in window) {
      (window as any).requestIdleCallback(() => generateFilmstrip());
    } else {
      setTimeout(generateFilmstrip, 50);
    }

    return () => {
      isCancelled = true;
    };
  }, [sourceUrl, start, end, duration, tileCount, cacheKey]);

  return (
    <div className="absolute inset-0 flex overflow-hidden opacity-35 pointer-events-none select-none">
      {thumbnails.length > 0 ? (
        thumbnails.map((thumb, idx) => (
          <div
            key={idx}
            className="h-full flex-1 border-r border-black/30 bg-cover bg-center"
            style={{ backgroundImage: `url(${thumb})` }}
          />
        ))
      ) : (
        <div className="w-full h-full bg-gradient-to-r from-neutral-900/40 via-neutral-800/30 to-neutral-900/40 animate-pulse" />
      )}
    </div>
  );
}
