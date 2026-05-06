"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Play, Pause, ChevronLeft, ChevronRight, Maximize, Minimize } from "lucide-react";
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
  onPhotoClick: (index: number) => void;
  speed?: number;
  transition?: string;
  transitionDuration?: number;
}

type Cell = { gridColumn: string; gridRow: string };

// 4-column × 4-row grid: 2 big (2×2) + 8 small (1×1) = 10 photos per page
// Pattern A: big top-left + big bottom-right
const PATTERN_A: Cell[] = [
  { gridColumn: "1 / 3", gridRow: "1 / 3" }, // Big 1 — top-left
  { gridColumn: "3 / 5", gridRow: "3 / 5" }, // Big 2 — bottom-right
  { gridColumn: "3",     gridRow: "1" },
  { gridColumn: "4",     gridRow: "1" },
  { gridColumn: "3",     gridRow: "2" },
  { gridColumn: "4",     gridRow: "2" },
  { gridColumn: "1",     gridRow: "3" },
  { gridColumn: "2",     gridRow: "3" },
  { gridColumn: "1",     gridRow: "4" },
  { gridColumn: "2",     gridRow: "4" },
];

// Pattern B: big top-right + big bottom-left
const PATTERN_B: Cell[] = [
  { gridColumn: "3 / 5", gridRow: "1 / 3" }, // Big 1 — top-right
  { gridColumn: "1 / 3", gridRow: "3 / 5" }, // Big 2 — bottom-left
  { gridColumn: "1",     gridRow: "1" },
  { gridColumn: "2",     gridRow: "1" },
  { gridColumn: "1",     gridRow: "2" },
  { gridColumn: "2",     gridRow: "2" },
  { gridColumn: "3",     gridRow: "3" },
  { gridColumn: "4",     gridRow: "3" },
  { gridColumn: "3",     gridRow: "4" },
  { gridColumn: "4",     gridRow: "4" },
];

const PATTERNS = [PATTERN_A, PATTERN_B];
const PAGE_SIZE = 10;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function MosaicView({ photos, onPhotoClick, speed = 4000, transition = "fade", transitionDuration = 500 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shuffledPhotos, setShuffledPhotos] = useState(() => shuffle(photos));
  const [page, setPage] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [visible, setVisible] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);

  const totalPages = Math.max(1, Math.ceil(shuffledPhotos.length / PAGE_SIZE));
  const fadeDuration = Math.round(transitionDuration / 2);

  // Reshuffle and reset when the photos list changes
  useEffect(() => {
    setShuffledPhotos(shuffle(photos));
    setPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos.length]);

  const changePage = useCallback((newPage: number, reshuffle = false) => {
    setVisible(false);
    setTimeout(() => {
      if (reshuffle) setShuffledPhotos((prev) => shuffle(prev));
      setPage(newPage);
      setVisible(true);
    }, fadeDuration);
  }, [fadeDuration]);

  const goNext = useCallback(() => {
    const next = (page + 1) % totalPages;
    changePage(next, next === 0); // reshuffle when wrapping to first page
  }, [page, totalPages, changePage]);

  const goPrev = useCallback(() => {
    changePage(page === 0 ? totalPages - 1 : page - 1);
  }, [page, totalPages, changePage]);

  useEffect(() => {
    if (!playing || totalPages <= 1) return;
    const t = setInterval(goNext, speed);
    return () => clearInterval(t);
  }, [playing, goNext, totalPages, speed]);

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

  const pagePhotos = shuffledPhotos.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const pattern = PATTERNS[page % PATTERNS.length];

  // In fullscreen: fill viewport minus ~72px for the controls bar
  const cellHeight = fullscreen
    ? "calc((100vh - 72px) / 4)"
    : "clamp(70px, calc(22vw - 8px), 220px)";

  const gridVisibleClass = ({
    fade:  visible ? "opacity-100" : "opacity-0",
    zoom:  visible ? "opacity-100 scale-100" : "opacity-0 scale-95",
    slide: visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8",
    blur:  visible ? "opacity-100 blur-0" : "opacity-0 blur-sm",
    drop:  visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-6",
    rise:  visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
  } as Record<string, string>)[transition] ?? (visible ? "opacity-100" : "opacity-0");

  return (
    <div
      ref={containerRef}
      className={cn("p-4", fullscreen && "bg-background flex flex-col justify-center min-h-screen")}
    >
      <div
        className={cn("w-full grid grid-cols-4 gap-2 transition-all", gridVisibleClass)}
        style={{
          gridTemplateRows: `repeat(4, ${cellHeight})`,
          transitionDuration: `${fadeDuration}ms`,
        }}
      >
        {pagePhotos.map((photo, i) => (
          <div
            key={photo.id}
            style={pattern[i]}
            className="relative overflow-hidden rounded-lg bg-muted group cursor-pointer"
            onClick={() => {
              const originalIndex = photos.findIndex((p) => p.id === photo.id);
              onPhotoClick(originalIndex >= 0 ? originalIndex : i);
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/uploads/${photo.thumbnailPath}`}
              alt={photo.filename}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-3 mt-4">
        {totalPages > 1 && (
          <Button variant="outline" size="icon" onClick={goPrev} aria-label="Previous page">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
        {totalPages > 1 && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2 min-w-[90px]"
            onClick={() => setPlaying((p) => !p)}
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {playing ? "Pause" : "Play"}
          </Button>
        )}
        {totalPages > 1 && (
          <span className="text-sm text-muted-foreground tabular-nums">
            {page + 1} / {totalPages}
          </span>
        )}
        {totalPages > 1 && (
          <Button variant="outline" size="icon" onClick={goNext} aria-label="Next page">
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="outline"
          size="icon"
          onClick={toggleFullscreen}
          title={fullscreen ? "Exit fullscreen" : "Fullscreen"}
        >
          {fullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
