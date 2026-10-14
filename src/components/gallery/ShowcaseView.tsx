"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause, ChevronLeft, ChevronRight, Maximize, Minimize, Minus, Plus } from "lucide-react";
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
  photosPerPage: number;
  effect: string;
  background?: string;
  speed?: number;
  transition?: string;
  transitionDuration?: number;
}

// Animation keyframes for photo effects
const EFFECT_KEYFRAMES: Record<string, string> = {
  bounce: `@keyframes sc-bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-14px); }
  }`,
  jiggle: `@keyframes sc-jiggle {
    0%, 100% { transform: rotate(0deg); }
    20% { transform: rotate(-2.5deg); }
    60% { transform: rotate(2.5deg); }
    80% { transform: rotate(-1deg); }
  }`,
  pulse: `@keyframes sc-pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.06); }
  }`,
  float: `@keyframes sc-float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }`,
  spin: `@keyframes sc-spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }`,
  wobble: `@keyframes sc-wobble {
    0%, 100% { transform: rotate(0deg) translateX(0); }
    25% { transform: rotate(-3deg) translateX(-5px); }
    75% { transform: rotate(3deg) translateX(5px); }
  }`,
  sway: `@keyframes sc-sway {
    0%, 100% { transform: translateX(0px); }
    50% { transform: translateX(12px); }
  }`,
  breathe: `@keyframes sc-breathe {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.025); }
  }`,
};

const MARQUEE_KEYFRAMES = `
  @keyframes sc-marquee-left  { from { transform: translateX(0) } to { transform: translateX(-50%) } }
  @keyframes sc-marquee-right { from { transform: translateX(-50%) } to { transform: translateX(0) } }
`;

const EFFECT_DURATION: Record<string, string> = {
  bounce: "2s",
  jiggle: "0.9s",
  pulse: "2.5s",
  float: "3s",
  spin: "20s",
  wobble: "2s",
  sway: "3s",
  breathe: "4s",
  none: "0s",
};

const NUM_BG_ROWS = 8;
const MARQUEE_SPEED = "35s";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getGridDims(n: number): { cols: number; rows: number } {
  if (n <= 0) return { cols: 1, rows: 1 };
  const cols = Math.ceil(Math.sqrt(n));
  const rows = Math.ceil(n / cols);
  return { cols, rows };
}

export function ShowcaseView({
  photos,
  photosPerPage: defaultPerPage,
  effect,
  background = "scroll",
  speed = 4000,
  transition = "fade",
  transitionDuration = 500,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [shuffledPhotos, setShuffledPhotos] = useState(() => shuffle(photos));
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(defaultPerPage);
  const [playing, setPlaying] = useState(false);
  const [visible, setVisible] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const totalPages = Math.max(1, Math.ceil(shuffledPhotos.length / perPage));
  const fadeDuration = Math.round(transitionDuration / 2);

  useEffect(() => {
    setShuffledPhotos(shuffle(photos));
    setPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos.length]);

  // Reset to page 0 when perPage changes
  useEffect(() => {
    setPage(0);
  }, [perPage]);

  const changePage = useCallback(
    (newPage: number, reshuffle = false) => {
      setVisible(false);
      setTimeout(() => {
        if (reshuffle) setShuffledPhotos((prev) => shuffle(prev));
        setPage(newPage);
        setVisible(true);
      }, fadeDuration);
    },
    [fadeDuration]
  );

  const goNext = useCallback(() => {
    const next = (page + 1) % totalPages;
    changePage(next, next === 0);
  }, [page, totalPages, changePage]);

  const goPrev = useCallback(() => {
    changePage(page === 0 ? totalPages - 1 : page - 1);
  }, [page, totalPages, changePage]);

  useEffect(() => {
    if (!playing || totalPages <= 1) return;
    const t = setInterval(goNext, speed);
    return () => clearInterval(t);
  }, [playing, goNext, totalPages, speed]);

  useEffect(() => {
    const onFsChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  useEffect(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (fullscreen) {
      hideTimerRef.current = setTimeout(() => setShowControls(false), 2500);
    } else {
      setShowControls(true);
    }
  }, [fullscreen]);

  useEffect(() => () => { if (hideTimerRef.current) clearTimeout(hideTimerRef.current); }, []);

  function handleMouseMove() {
    if (!fullscreen) return;
    setShowControls(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setShowControls(false), 2500);
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  const pagePhotos = shuffledPhotos.slice(page * perPage, (page + 1) * perPage);
  const { cols, rows } = getGridDims(pagePhotos.length);

  // Random animation delays per page
  const delays = useMemo(
    () => pagePhotos.map(() => Math.random() * 2),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [page, perPage]
  );

  const gridVisibleClass = ({
    fade:  visible ? "opacity-100" : "opacity-0",
    zoom:  visible ? "opacity-100 scale-100" : "opacity-0 scale-95",
    slide: visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8",
    blur:  visible ? "opacity-100 blur-0" : "opacity-0 blur-sm",
    drop:  visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-6",
    rise:  visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
  } as Record<string, string>)[transition] ?? (visible ? "opacity-100" : "opacity-0");

  const animName = effect !== "none" ? `sc-${effect}` : undefined;
  const animDuration = EFFECT_DURATION[effect] ?? "0s";

  // Build background rows — split all photos evenly across NUM_BG_ROWS
  const bgRows = useMemo(() => {
    if (background !== "scroll" || photos.length === 0) return [];
    const rowSize = Math.max(1, Math.ceil(photos.length / NUM_BG_ROWS));
    return Array.from({ length: NUM_BG_ROWS }, (_, i) => {
      const slice = photos.slice(i * rowSize, (i + 1) * rowSize);
      // Pad short rows by cycling through photos so each row has the same count
      while (slice.length < rowSize && photos.length > 0) {
        slice.push(photos[slice.length % photos.length]);
      }
      return slice;
    });
  }, [photos, background]);

  const controls = (
    <div
      className={cn(
        "flex items-center justify-center gap-2 py-3 px-4 flex-wrap",
        "bg-card/85 backdrop-blur-md border-t border-border/40",
        "transition-all duration-300",
        fullscreen
          ? cn(
              "absolute bottom-0 left-0 right-0",
              showControls
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-2 pointer-events-none"
            )
          : "fixed bottom-0 left-0 right-0 z-30"
      )}
    >
      {/* Photos per page controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setPerPage((p) => Math.max(1, p - 1))}
          aria-label="Fewer photos per page"
        >
          <Minus className="h-3 w-3" />
        </Button>
        <span className="text-xs text-muted-foreground tabular-nums w-16 text-center">
          {perPage} / page
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setPerPage((p) => Math.min(20, p + 1))}
          aria-label="More photos per page"
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      <div className="w-px h-5 bg-border/50 hidden sm:block" />

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
  );

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={cn(
        "relative",
        fullscreen
          ? "bg-background flex flex-col h-screen"
          : "pb-24"
      )}
    >
      {/* Inject keyframes */}
      <style>{`
        ${effect !== "none" && EFFECT_KEYFRAMES[effect] ? EFFECT_KEYFRAMES[effect] : ""}
        ${background === "scroll" ? MARQUEE_KEYFRAMES : ""}
      `}</style>

      {/* Scrolling background */}
      {background === "scroll" && bgRows.length > 0 && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          {bgRows.map((row, rowIdx) => {
            const doubled = [...row, ...row];
            const dir = rowIdx % 2 === 0 ? "sc-marquee-left" : "sc-marquee-right";
            return (
              <div
                key={rowIdx}
                className="flex"
                style={{ height: `calc(100% / ${NUM_BG_ROWS})` }}
              >
                <div
                  className="flex gap-1 shrink-0"
                  style={{ animation: `${dir} ${MARQUEE_SPEED} linear infinite` }}
                >
                  {doubled.map((photo, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={`${photo.id}-${i}`}
                      src={`/api/uploads/${photo.thumbnailPath}`}
                      alt=""
                      className="h-full w-auto object-cover opacity-40 rounded"
                      loading="lazy"
                      decoding="async"
                    />
                  ))}
                </div>
              </div>
            );
          })}
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-background/55" />
        </div>
      )}

      {/* Main showcase grid */}
      <div
        className={cn("relative z-10 w-full grid gap-3 p-4 transition-all", gridVisibleClass)}
        style={{
          height: fullscreen ? "calc(100dvh - 56px)" : "calc(100dvh - 160px)",
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
          transitionDuration: `${fadeDuration}ms`,
        }}
      >
        {pagePhotos.map((photo, i) => (
          <div
            key={photo.id}
            className="flex items-center justify-center overflow-hidden"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/uploads/${photo.thumbnailPath}`}
              alt={photo.filename}
              loading="lazy"
              decoding="async"
              className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
              style={
                animName
                  ? {
                      animation: `${animName} ${animDuration} ease-in-out infinite`,
                      animationDelay: `${delays[i]}s`,
                    }
                  : undefined
              }
            />
          </div>
        ))}
      </div>

      {controls}
    </div>
  );
}
