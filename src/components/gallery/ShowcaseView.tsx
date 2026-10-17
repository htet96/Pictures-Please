"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause, ChevronLeft, ChevronRight, Maximize, Minimize, Minus, Plus, ArrowLeftRight, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  isAdmin?: boolean;
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
  @keyframes sc-marquee-up    { from { transform: translateY(0) } to { transform: translateY(-50%) } }
  @keyframes sc-marquee-down  { from { transform: translateY(-50%) } to { transform: translateY(0) } }
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

const NUM_BG_STRIPS = 8;
const MARQUEE_SPEED = "35s";
// Repeat photos 6× per strip — ensures the strip is always long/tall enough to
// fill the viewport even with very few photos. The loop is seamless because the
// animation translates exactly -50%, and 6 = 3 pairs so both halves are identical.
const REPEAT_FACTOR = 6;

const PAGE_TRANSITION_OPTIONS = [
  { value: "fade",  label: "Fade" },
  { value: "zoom",  label: "Zoom In" },
  { value: "slide", label: "Slide" },
  { value: "blur",  label: "Blur" },
  { value: "drop",  label: "Drop" },
  { value: "rise",  label: "Rise" },
];

const SPEED_OPTIONS = [
  { value: 2000,  label: "2s" },
  { value: 3000,  label: "3s" },
  { value: 4000,  label: "4s" },
  { value: 5000,  label: "5s" },
  { value: 7000,  label: "7s" },
  { value: 10000, label: "10s" },
];

const EFFECT_OPTIONS = [
  { value: "float",   label: "Float" },
  { value: "bounce",  label: "Bounce" },
  { value: "jiggle",  label: "Jiggle" },
  { value: "pulse",   label: "Pulse" },
  { value: "sway",    label: "Sway" },
  { value: "wobble",  label: "Wobble" },
  { value: "breathe", label: "Breathe" },
  { value: "spin",    label: "Spin" },
  { value: "none",    label: "None" },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// --- Justified layout -----------------------------------------------------------
// Distributes photos across rows so aspect-ratio proportions are preserved and
// the container is filled with minimal whitespace (Google Photos style).

interface LayoutRect { x: number; y: number; w: number; h: number; }

function computeJustifiedLayout(
  photos: { width: number; height: number }[],
  containerW: number,
  containerH: number,
  gap: number,
): LayoutRect[] {
  if (photos.length === 0 || containerW <= 0 || containerH <= 0) return [];

  // Guard against zero dimensions
  const aspects = photos.map(p => Math.max(0.1, p.width / Math.max(1, p.height)));
  const totalAspect = aspects.reduce((a, b) => a + b, 0);

  // Ideal number of rows: balances row heights to roughly match the container ratio
  const nRows = Math.max(1, Math.round(Math.sqrt(totalAspect * containerH / containerW)));

  // Greedy linear partition: target aspect-sum per row = totalAspect / nRows
  const targetPerRow = totalAspect / nRows;
  const rowGroups: number[][] = [];
  let currentRow: number[] = [];
  let currentSum = 0;

  for (let i = 0; i < photos.length; i++) {
    currentRow.push(i);
    currentSum += aspects[i];

    const remaining = photos.length - i - 1;
    const rowsNeeded = nRows - rowGroups.length - 1;
    if (rowsNeeded > 0 && remaining >= rowsNeeded) {
      const withNext = i + 1 < photos.length ? currentSum + aspects[i + 1] : currentSum;
      if (Math.abs(currentSum - targetPerRow) <= Math.abs(withNext - targetPerRow)) {
        rowGroups.push(currentRow);
        currentRow = [];
        currentSum = 0;
      }
    }
  }
  if (currentRow.length > 0) rowGroups.push(currentRow);

  // Natural row heights: each row fills usableW
  const usableW = containerW - gap * 2;
  const naturalHeights = rowGroups.map(indices => {
    const rowAspectSum = indices.reduce((s, i) => s + aspects[i], 0);
    const rowGaps = (indices.length - 1) * gap;
    return (usableW - rowGaps) / rowAspectSum;
  });

  // Scale DOWN only to fit height — never scale up, which would push rows wider than the container
  const usableH = containerH - gap * 2;
  const totalNaturalH = naturalHeights.reduce((a, b) => a + b, 0) + (rowGroups.length - 1) * gap;
  const scale = Math.min(1, usableH / Math.max(1, totalNaturalH));

  // Vertically center the photo block when it doesn't fill the container
  const scaledTotalH = totalNaturalH * scale;
  const yOffset = gap + Math.max(0, (usableH - scaledTotalH) / 2);

  // Build absolute rects
  const rects: LayoutRect[] = new Array(photos.length);
  let y = yOffset;
  for (let r = 0; r < rowGroups.length; r++) {
    const h = naturalHeights[r] * scale;
    const indices = rowGroups[r];

    // Widths preserve aspect ratios relative to scaled height
    const rowWidths = indices.map(i => h * aspects[i]);
    const totalRowW = rowWidths.reduce((a, b) => a + b, 0) + (indices.length - 1) * gap;

    // Horizontally center each row — handles last row and cases with few photos
    let x = gap + Math.max(0, (usableW - totalRowW) / 2);

    for (let j = 0; j < indices.length; j++) {
      const idx = indices[j];
      rects[idx] = { x, y, w: rowWidths[j], h };
      x += rowWidths[j] + gap;
    }
    y += h + gap;
  }
  return rects;
}
// -------------------------------------------------------------------------------

export function ShowcaseView({
  photos,
  photosPerPage: defaultPerPage,
  effect,
  background = "scroll",
  speed = 4000,
  transition = "fade",
  transitionDuration = 500,
  isAdmin,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [shuffledPhotos, setShuffledPhotos] = useState(() => shuffle(photos));
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(defaultPerPage);
  const [playing, setPlaying] = useState(false);
  const [visible, setVisible] = useState(true);
  // nativeFullscreen = browser Fullscreen API; cssFullscreen = fixed-overlay fallback for iOS
  const [nativeFullscreen, setNativeFullscreen] = useState(false);
  const [cssFullscreen, setCssFullscreen] = useState(false);
  const fullscreen = nativeFullscreen || cssFullscreen;
  const [showControls, setShowControls] = useState(true);
  const [bgVertical, setBgVertical] = useState(false);
  const [localEffect, setLocalEffect] = useState(effect);
  const [localTransition, setLocalTransition] = useState(transition);
  const [localSpeed, setLocalSpeed] = useState(speed);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });

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

  // Measure the grid container so the justified layout can fill it exactly
  useEffect(() => {
    const el = gridContainerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setContainerSize({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

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
    const t = setInterval(goNext, localSpeed);
    return () => clearInterval(t);
  }, [playing, goNext, totalPages, localSpeed]);

  useEffect(() => {
    const onFsChange = () => setNativeFullscreen(!!document.fullscreenElement);
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

  function revealControls() {
    if (!fullscreen) return;
    setShowControls(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setShowControls(false), 2500);
  }

  function toggleFullscreen() {
    if (cssFullscreen) {
      setCssFullscreen(false);
      return;
    }
    if (nativeFullscreen) {
      document.exitFullscreen();
      return;
    }
    // Try native fullscreen; fall back to CSS overlay for iOS Safari
    const el = containerRef.current;
    if (el?.requestFullscreen) {
      el.requestFullscreen().catch(() => setCssFullscreen(true));
    } else {
      setCssFullscreen(true);
    }
  }

  const pagePhotos = shuffledPhotos.slice(page * perPage, (page + 1) * perPage);

  // Random animation delays per page
  const delays = useMemo(
    () => pagePhotos.map(() => Math.random() * 2),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [page, perPage]
  );

  // Justified layout — recomputes when photos or container size changes
  const layout = useMemo(
    () => computeJustifiedLayout(pagePhotos, containerSize.w, containerSize.h, 12),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pagePhotos, containerSize.w, containerSize.h]
  );

  // Map new slideshow-only transitions to page-level equivalents
  const pageTransition = ({ kenburns: "fade", crossblur: "blur", iris: "fade", cube: "zoom", tiles: "fade" } as Record<string, string>)[localTransition] ?? localTransition;
  const gridVisibleClass = ({
    fade:  visible ? "opacity-100" : "opacity-0",
    zoom:  visible ? "opacity-100 scale-100" : "opacity-0 scale-95",
    slide: visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8",
    blur:  visible ? "opacity-100 blur-0" : "opacity-0 blur-sm",
    drop:  visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-6",
    rise:  visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
  } as Record<string, string>)[pageTransition] ?? (visible ? "opacity-100" : "opacity-0");

  const animName = localEffect !== "none" ? `sc-${localEffect}` : undefined;
  const animDuration = EFFECT_DURATION[localEffect] ?? "0s";

  // Build background strips — split all photos evenly across NUM_BG_STRIPS
  const bgStrips = useMemo(() => {
    if (background !== "scroll" || photos.length === 0) return [];
    const stripSize = Math.max(1, Math.ceil(photos.length / NUM_BG_STRIPS));
    return Array.from({ length: NUM_BG_STRIPS }, (_, i) => {
      const slice = photos.slice(i * stripSize, (i + 1) * stripSize);
      // Pad short strips by cycling through photos so each strip has the same count
      while (slice.length < stripSize && photos.length > 0) {
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
              "absolute bottom-0 left-0 right-0 z-20",
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

      {/* Background direction toggle — only shown when scrolling background is active */}
      {background === "scroll" && (
        <>
          <div className="w-px h-5 bg-border/50 hidden sm:block" />
          <Button
            variant="outline"
            size="icon"
            onClick={() => setBgVertical((v) => !v)}
            title={bgVertical ? "Switch to horizontal background" : "Switch to vertical background"}
          >
            {bgVertical ? <ArrowLeftRight className="h-4 w-4" /> : <ArrowUpDown className="h-4 w-4" />}
          </Button>
        </>
      )}

      {isAdmin && (
        <>
          <div className="w-px h-5 bg-border/50 hidden sm:block" />
          <Select value={localTransition} onValueChange={(v) => setLocalTransition(v ?? localTransition)}>
            <SelectTrigger className="h-8 w-[100px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_TRANSITION_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(localSpeed)} onValueChange={(v) => setLocalSpeed(Number(v))}>
            <SelectTrigger className="h-8 w-[65px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SPEED_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={localEffect} onValueChange={(v) => setLocalEffect(v ?? localEffect)}>
            <SelectTrigger className="h-8 w-[95px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EFFECT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </>
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
      onMouseMove={revealControls}
      onTouchStart={revealControls}
      className={cn(
        "relative",
        fullscreen
          ? "bg-background flex flex-col h-screen"
          : "pb-24",
        cssFullscreen && "fixed inset-0 z-[9999]"
      )}
    >
      {/* Inject keyframes */}
      <style>{`
        ${localEffect !== "none" && EFFECT_KEYFRAMES[localEffect] ? EFFECT_KEYFRAMES[localEffect] : ""}
        ${background === "scroll" ? MARQUEE_KEYFRAMES : ""}
      `}</style>

      {/* Scrolling background */}
      {background === "scroll" && bgStrips.length > 0 && (
        <div
          className={cn(
            "absolute inset-0 overflow-hidden pointer-events-none z-0",
            bgVertical ? "flex flex-row" : "flex flex-col"
          )}
        >
          {bgStrips.map((strip, stripIdx) => {
            // Repeat photos REPEAT_FACTOR times — fills the screen regardless of gallery size.
            // REPEAT_FACTOR must be even so the -50% translate loop point is seamless.
            const repeated = Array.from({ length: REPEAT_FACTOR }, () => strip).flat();

            if (bgVertical) {
              const dir = stripIdx % 2 === 0 ? "sc-marquee-up" : "sc-marquee-down";
              return (
                <div
                  key={stripIdx}
                  className="flex flex-col overflow-hidden"
                  style={{ width: `calc(100% / ${NUM_BG_STRIPS})` }}
                >
                  <div
                    className="flex flex-col gap-1 shrink-0"
                    style={{ animation: `${dir} ${MARQUEE_SPEED} linear infinite` }}
                  >
                    {repeated.map((photo, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={`${photo.id}-${i}`}
                        src={`/api/uploads/${photo.thumbnailPath}`}
                        alt=""
                        className="w-full h-auto object-cover opacity-40 rounded"
                        loading="lazy"
                        decoding="async"
                      />
                    ))}
                  </div>
                </div>
              );
            } else {
              const dir = stripIdx % 2 === 0 ? "sc-marquee-left" : "sc-marquee-right";
              return (
                <div
                  key={stripIdx}
                  className="flex overflow-hidden"
                  style={{ height: `calc(100% / ${NUM_BG_STRIPS})` }}
                >
                  <div
                    className="flex gap-1 shrink-0"
                    style={{ animation: `${dir} ${MARQUEE_SPEED} linear infinite` }}
                  >
                    {repeated.map((photo, i) => (
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
            }
          })}
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-background/55" />
        </div>
      )}

      {/* Main showcase — justified layout with absolute positioning */}
      <div
        ref={gridContainerRef}
        className={cn("relative z-10 w-full overflow-hidden transition-all", gridVisibleClass)}
        style={{
          height: fullscreen ? "calc(100dvh - 56px)" : "calc(100dvh - 160px)",
          transitionDuration: `${fadeDuration}ms`,
        }}
      >
        {layout.map((rect, i) => {
          const photo = pagePhotos[i];
          if (!photo || !rect) return null;
          return (
            <div
              key={photo.id}
              className="absolute overflow-hidden rounded-lg shadow-sm"
              style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/uploads/${photo.thumbnailPath}`}
                alt={photo.filename}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
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
          );
        })}
      </div>

      {controls}
    </div>
  );
}
