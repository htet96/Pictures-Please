"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play, Maximize, Minimize } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Photo {
  id: string;
  thumbnailPath: string;
  originalPath: string;
  filename: string;
  width: number;
  height: number;
}

interface Props {
  photos: Photo[];
  speed?: number;
  transition?: string;
  transitionDuration?: number;
}

export function SlideshowView({ photos, speed = 4000, transition = "fade", transitionDuration = 500 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const photo = photos[index];

  const next = useCallback(() => {
    setLoaded(false);
    setIndex((i) => (i + 1) % photos.length);
  }, [photos.length]);

  const prev = useCallback(() => {
    setLoaded(false);
    setIndex((i) => (i === 0 ? photos.length - 1 : i - 1));
  }, [photos.length]);

  useEffect(() => {
    if (!playing || photos.length <= 1) return;
    const t = setInterval(next, speed);
    return () => clearInterval(t);
  }, [playing, next, photos.length, speed]);

  // Touch swipe
  useEffect(() => {
    let startX = 0;
    const onStart = (e: TouchEvent) => { startX = e.touches[0].clientX; };
    const onEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) { dx < 0 ? next() : prev(); }
    };
    window.addEventListener("touchstart", onStart);
    window.addEventListener("touchend", onEnd);
    return () => { window.removeEventListener("touchstart", onStart); window.removeEventListener("touchend", onEnd); };
  }, [next, prev]);

  // Fullscreen API
  useEffect(() => {
    const onFsChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  if (photos.length === 0) return null;

  const transitionClass = ({
    fade:  loaded ? "opacity-100" : "opacity-0",
    zoom:  loaded ? "opacity-100 scale-100" : "opacity-0 scale-95",
    slide: loaded ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8",
    blur:  loaded ? "opacity-100 blur-0" : "opacity-0 blur-sm",
    drop:  loaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-6",
    rise:  loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
  } as Record<string, string>)[transition] ?? (loaded ? "opacity-100" : "opacity-0");

  return (
    <div
      ref={containerRef}
      className="relative h-[calc(100vh-56px)] bg-black flex items-center justify-center select-none"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={photo.id}
        src={`/api/uploads/${photo.originalPath}`}
        alt={photo.filename}
        onLoad={() => setLoaded(true)}
        style={{ transitionDuration: `${transitionDuration}ms` }}
        className={cn("max-w-full max-h-full object-contain transition-all", transitionClass)}
      />

      {/* Overlay controls */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between p-4 bg-gradient-to-t from-black/70 to-transparent">
        <span className="text-white/70 text-sm">
          {index + 1} / {photos.length}
        </span>
        <div className="flex items-center gap-2">
          {photos.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => setPlaying((p) => !p)}
            >
              {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={toggleFullscreen}
            title={fullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {fullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {photos.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 sm:left-4 rounded-full p-2 sm:p-3 bg-black/30 hover:bg-black/60 text-white transition-colors"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={next}
            className="absolute right-2 sm:right-4 rounded-full p-2 sm:p-3 bg-black/30 hover:bg-black/60 text-white transition-colors"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Thumbnail dots */}
      {photos.length > 1 && photos.length <= 20 && (
        <div className="absolute bottom-14 left-0 right-0 flex justify-center gap-1.5 px-4">
          {photos.map((_, i) => (
            <button
              key={i}
              onClick={() => { setIndex(i); setLoaded(false); }}
              className={cn(
                "rounded-full transition-all",
                i === index ? "w-4 h-2 bg-white" : "w-2 h-2 bg-white/40"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
