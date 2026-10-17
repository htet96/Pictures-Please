"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play, Maximize, Minimize } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const TRANSITION_OPTIONS = [
  { value: "fade",      label: "Fade" },
  { value: "zoom",      label: "Zoom In" },
  { value: "slide",     label: "Slide" },
  { value: "blur",      label: "Blur" },
  { value: "drop",      label: "Drop" },
  { value: "rise",      label: "Rise" },
  { value: "kenburns",  label: "Ken Burns" },
  { value: "crossblur", label: "Cross Blur" },
  { value: "iris",      label: "Iris Wipe" },
  { value: "cube",      label: "Cube" },
  { value: "tiles",     label: "Tiles" },
];

const SPEED_OPTIONS = [
  { value: 2000,  label: "2s" },
  { value: 3000,  label: "3s" },
  { value: 4000,  label: "4s" },
  { value: 5000,  label: "5s" },
  { value: 7000,  label: "7s" },
  { value: 10000, label: "10s" },
];

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
  isAdmin?: boolean;
}

// ---------------------------------------------------------------------------
// Ken Burns: random zoom/pan presets cycled per image
// ---------------------------------------------------------------------------
const KB_PRESETS = [
  { from: "scale(1) translate(0,0)",       to: "scale(1.15) translate(-2%,-1%)" },
  { from: "scale(1.12) translate(-2%,1%)", to: "scale(1) translate(0,0)" },
  { from: "scale(1) translate(0,0)",       to: "scale(1.1) translate(2%,-2%)" },
  { from: "scale(1.1) translate(1%,2%)",   to: "scale(1) translate(0,0)" },
];

// ---------------------------------------------------------------------------
// Tile reveal helpers
// ---------------------------------------------------------------------------
const TILE_COLS = 4;
const TILE_ROWS = 3;
const TILE_COUNT = TILE_COLS * TILE_ROWS;

function shuffledOrder(seed: number): number[] {
  const arr = Array.from({ length: TILE_COUNT }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.abs(Math.round(Math.sin(seed * (i + 1) * 9301 + 49297) * 233280)) % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function SlideshowView({
  photos,
  speed = 4000,
  transition = "fade",
  transitionDuration = 500,
  isAdmin,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(800);

  // Visitor-adjustable overrides (initialized from admin defaults)
  const [localTransition, setLocalTransition] = useState(transition);
  const [localSpeed, setLocalSpeed] = useState(speed);

  // Dual-slot state
  const [activeSlot, setActiveSlot] = useState<"a" | "b">("a");
  const [slotAIndex, setSlotAIndex] = useState(0);
  const [slotBIndex, setSlotBIndex] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [slotAReady, setSlotAReady] = useState(false);
  const [slotBReady, setSlotBReady] = useState(false);
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ken Burns preset cycling
  const kbCounter = useRef(0);
  const [kbPresetIdx, setKbPresetIdx] = useState(0);

  // Tile reveal seed
  const [tileSeed, setTileSeed] = useState(0);
  const tileOrder = useMemo(() => shuffledOrder(tileSeed), [tileSeed]);

  const [playing, setPlaying] = useState(true);
  const [nativeFullscreen, setNativeFullscreen] = useState(false);
  const [cssFullscreen, setCssFullscreen] = useState(false);
  const fullscreen = nativeFullscreen || cssFullscreen;

  // Reduced motion
  const prefersReducedMotion = useRef(false);
  useEffect(() => {
    prefersReducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  // Current display index (the slot that is "front")
  const currentIndex = activeSlot === "a" ? slotAIndex : slotBIndex;

  // Measure container for cube rotate
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setContainerWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Preload next image
  useEffect(() => {
    if (photos.length <= 1) return;
    const nextIdx = (currentIndex + 1) % photos.length;
    const img = new Image();
    img.src = `/api/uploads/${photos[nextIdx].originalPath}`;
  }, [currentIndex, photos]);

  // Start a transition to a new index
  const goTo = useCallback(
    (newIndex: number) => {
      if (transitioning || photos.length <= 1 || newIndex === currentIndex) return;
      const inactiveSlot = activeSlot === "a" ? "b" : "a";

      if (inactiveSlot === "a") {
        setSlotAReady(false);
        setSlotAIndex(newIndex);
      } else {
        setSlotBReady(false);
        setSlotBIndex(newIndex);
      }

      kbCounter.current += 1;
      setKbPresetIdx(kbCounter.current % KB_PRESETS.length);
      setTileSeed(kbCounter.current);
      setTransitioning(true);

      if (transitionTimer.current) clearTimeout(transitionTimer.current);
      const dur = prefersReducedMotion.current ? 300 : transitionDuration;
      transitionTimer.current = setTimeout(() => {
        setActiveSlot(inactiveSlot);
        setTransitioning(false);
      }, dur);
    },
    [activeSlot, transitioning, photos.length, transitionDuration, currentIndex],
  );

  const next = useCallback(() => {
    goTo((currentIndex + 1) % photos.length);
  }, [goTo, currentIndex, photos.length]);

  const prev = useCallback(() => {
    goTo(currentIndex === 0 ? photos.length - 1 : currentIndex - 1);
  }, [goTo, currentIndex, photos.length]);

  // Autoplay
  useEffect(() => {
    if (!playing || photos.length <= 1) return;
    const t = setInterval(next, localSpeed);
    return () => clearInterval(t);
  }, [playing, next, photos.length, localSpeed]);

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
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchend", onEnd);
    };
  }, [next, prev]);

  // Fullscreen
  useEffect(() => {
    const onFsChange = () => setNativeFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  function toggleFullscreen() {
    if (cssFullscreen) { setCssFullscreen(false); return; }
    if (nativeFullscreen) { document.exitFullscreen(); return; }
    const el = containerRef.current;
    if (el?.requestFullscreen) {
      el.requestFullscreen().catch(() => setCssFullscreen(true));
    } else {
      setCssFullscreen(true);
    }
  }

  // Cleanup
  useEffect(() => () => {
    if (transitionTimer.current) clearTimeout(transitionTimer.current);
  }, []);

  if (photos.length === 0) return null;

  const effectiveTransition = prefersReducedMotion.current ? "fade" : localTransition;
  const dur = prefersReducedMotion.current ? 300 : transitionDuration;

  // ---------------------------------------------------------------------------
  // Render a slot
  // ---------------------------------------------------------------------------
  function renderSlot(
    slot: "a" | "b",
    photoIndex: number,
    isReady: boolean,
    setReady: (v: boolean) => void,
  ) {
    const photo = photos[photoIndex];
    if (!photo) return null;

    const isFront = activeSlot === slot;
    const isIncoming = transitioning && !isFront;
    const isOutgoing = transitioning && isFront;

    const zBase = isIncoming ? 2 : isFront ? 1 : 0;

    const style: React.CSSProperties = {
      transitionDuration: `${dur}ms`,
      transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
      zIndex: zBase,
    };
    let extraClass = "";
    const imgStyle: React.CSSProperties = {};
    let hideImg = false;
    let tileOverlay: React.ReactNode = null;

    switch (effectiveTransition) {
      // ---- Existing transitions ----
      case "fade": {
        style.transitionProperty = "opacity";
        if (isIncoming) style.opacity = isReady ? 1 : 0;
        else if (isOutgoing) style.opacity = 1;
        else style.opacity = isFront ? 1 : 0;
        break;
      }
      case "zoom": {
        style.transitionProperty = "opacity, transform";
        if (isIncoming) {
          style.opacity = isReady ? 1 : 0;
          style.transform = isReady ? "scale(1)" : "scale(0.95)";
        } else if (isOutgoing) {
          style.opacity = 1;
          style.transform = "scale(1)";
        } else {
          style.opacity = isFront ? 1 : 0;
        }
        break;
      }
      case "slide": {
        style.transitionProperty = "opacity, transform";
        if (isIncoming) {
          style.opacity = isReady ? 1 : 0;
          style.transform = isReady ? "translateX(0)" : "translateX(40px)";
        } else if (isOutgoing) {
          style.opacity = 1;
        } else {
          style.opacity = isFront ? 1 : 0;
        }
        break;
      }
      case "blur": {
        style.transitionProperty = "opacity, filter";
        if (isIncoming) {
          style.opacity = isReady ? 1 : 0;
          style.filter = isReady ? "blur(0)" : "blur(8px)";
        } else if (isOutgoing) {
          style.opacity = 1;
          style.filter = "blur(0)";
        } else {
          style.opacity = isFront ? 1 : 0;
          style.filter = "blur(0)";
        }
        break;
      }
      case "drop": {
        style.transitionProperty = "opacity, transform";
        if (isIncoming) {
          style.opacity = isReady ? 1 : 0;
          style.transform = isReady ? "translateY(0)" : "translateY(-30px)";
        } else if (isOutgoing) {
          style.opacity = 1;
        } else {
          style.opacity = isFront ? 1 : 0;
        }
        break;
      }
      case "rise": {
        style.transitionProperty = "opacity, transform";
        if (isIncoming) {
          style.opacity = isReady ? 1 : 0;
          style.transform = isReady ? "translateY(0)" : "translateY(30px)";
        } else if (isOutgoing) {
          style.opacity = 1;
        } else {
          style.opacity = isFront ? 1 : 0;
        }
        break;
      }

      // ---- New transitions ----
      case "kenburns": {
        style.transitionProperty = "opacity";
        if (isIncoming) {
          style.opacity = isReady ? 1 : 0;
        } else if (isOutgoing) {
          style.opacity = 0;
        } else if (isFront) {
          style.opacity = 1;
          imgStyle.animation = `kb-${slot} ${localSpeed}ms linear forwards`;
        } else {
          style.opacity = 0;
        }
        break;
      }
      case "crossblur": {
        if (isIncoming) {
          style.opacity = isReady ? 1 : 0;
          style.transitionProperty = "opacity";
        } else if (isOutgoing) {
          style.opacity = 0;
          style.filter = "blur(12px)";
          style.transitionProperty = "opacity, filter";
        } else {
          style.opacity = isFront ? 1 : 0;
          style.filter = "blur(0)";
          style.transitionProperty = "opacity, filter";
        }
        break;
      }
      case "iris": {
        style.transitionProperty = "clip-path";
        style.transitionTimingFunction = "ease-in-out";
        if (isIncoming) {
          style.clipPath = isReady ? "circle(75% at 50% 50%)" : "circle(0% at 50% 50%)";
          style.opacity = 1;
          style.zIndex = 2;
        } else if (isOutgoing) {
          style.opacity = 1;
          style.zIndex = 1;
        } else {
          style.opacity = isFront ? 1 : 0;
        }
        break;
      }
      case "cube": {
        extraClass = " [backface-visibility:hidden]";
        style.transitionProperty = "transform";
        style.transitionTimingFunction = "ease-in-out";
        if (isIncoming) {
          style.transform = isReady
            ? "perspective(1200px) rotateY(0deg)"
            : "perspective(1200px) rotateY(90deg)";
          style.opacity = 1;
          style.zIndex = 2;
        } else if (isOutgoing) {
          style.transform = "perspective(1200px) rotateY(-90deg)";
          style.opacity = 1;
          style.zIndex = 1;
        } else {
          style.opacity = isFront ? 1 : 0;
          style.transform = "perspective(1200px) rotateY(0deg)";
        }
        break;
      }
      case "tiles": {
        if (isIncoming) {
          const src = `/api/uploads/${photo.originalPath}`;
          style.opacity = 1;
          style.zIndex = 2;
          hideImg = true;
          tileOverlay = (
            <div
              className="absolute inset-0 grid"
              style={{
                gridTemplateColumns: `repeat(${TILE_COLS}, 1fr)`,
                gridTemplateRows: `repeat(${TILE_ROWS}, 1fr)`,
              }}
            >
              {tileOrder.map((tileIdx, orderIdx) => {
                const col = tileIdx % TILE_COLS;
                const row = Math.floor(tileIdx / TILE_COLS);
                return (
                  <div
                    key={tileIdx}
                    style={{
                      gridColumn: col + 1,
                      gridRow: row + 1,
                      backgroundImage: `url(${src})`,
                      backgroundSize: `${TILE_COLS * 100}% ${TILE_ROWS * 100}%`,
                      backgroundPosition: `${(col / Math.max(1, TILE_COLS - 1)) * 100}% ${(row / Math.max(1, TILE_ROWS - 1)) * 100}%`,
                      opacity: isReady ? 1 : 0,
                      transition: `opacity ${dur * 0.6}ms ease`,
                      transitionDelay: isReady ? `${(orderIdx / TILE_COUNT) * dur * 0.8}ms` : "0ms",
                    }}
                  />
                );
              })}
            </div>
          );
        } else if (isOutgoing) {
          style.opacity = 1;
          style.zIndex = 1;
        } else {
          style.opacity = isFront ? 1 : 0;
        }
        break;
      }
      default: {
        style.transitionProperty = "opacity";
        if (isIncoming) style.opacity = isReady ? 1 : 0;
        else style.opacity = isFront ? 1 : 0;
      }
    }

    return (
      <div
        key={`slot-${slot}`}
        className={`absolute inset-0 flex items-center justify-center${extraClass}`}
        style={style}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/uploads/${photo.originalPath}`}
          alt={photo.filename}
          onLoad={() => setReady(true)}
          className={cn("max-w-full max-h-full object-contain", hideImg && "opacity-0")}
          style={imgStyle}
          draggable={false}
        />
        {tileOverlay}
      </div>
    );
  }

  // Ken Burns keyframe injection
  const kbStyle = effectiveTransition === "kenburns" ? (() => {
    const preset = KB_PRESETS[kbPresetIdx];
    return `
      @keyframes kb-a { from { transform: ${preset.from}; } to { transform: ${preset.to}; } }
      @keyframes kb-b { from { transform: ${preset.from}; } to { transform: ${preset.to}; } }
    `;
  })() : "";

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative bg-black flex items-center justify-center select-none overflow-hidden",
        fullscreen ? "h-screen" : "h-[calc(100vh-56px)]",
        cssFullscreen && "fixed inset-0 z-[9999]",
      )}
    >
      {kbStyle && <style>{kbStyle}</style>}

      {/* Dual image slots */}
      <div className="absolute inset-0">
        {renderSlot("a", slotAIndex, slotAReady, setSlotAReady)}
        {renderSlot("b", slotBIndex, slotBReady, setSlotBReady)}
      </div>

      {/* Overlay controls */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between p-4 bg-gradient-to-t from-black/70 to-transparent z-10 flex-wrap gap-2">
        <span className="text-white/70 text-sm tabular-nums">
          {currentIndex + 1} / {photos.length}
        </span>
        <div className="flex items-center gap-2 flex-wrap">
          {isAdmin && (
            <>
              <Select value={localTransition} onValueChange={(v) => setLocalTransition(v ?? localTransition)}>
                <SelectTrigger className="h-8 w-[110px] text-xs bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRANSITION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={String(localSpeed)} onValueChange={(v) => setLocalSpeed(Number(v))}>
                <SelectTrigger className="h-8 w-[70px] text-xs bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SPEED_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}
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
            className="absolute left-2 sm:left-4 rounded-full p-2 sm:p-3 bg-black/30 hover:bg-black/60 text-white transition-colors z-10"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={next}
            className="absolute right-2 sm:right-4 rounded-full p-2 sm:p-3 bg-black/30 hover:bg-black/60 text-white transition-colors z-10"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Thumbnail dots */}
      {photos.length > 1 && photos.length <= 20 && (
        <div className="absolute bottom-14 left-0 right-0 flex justify-center gap-1.5 px-4 z-10">
          {photos.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={cn(
                "rounded-full transition-all",
                i === currentIndex ? "w-4 h-2 bg-white" : "w-2 h-2 bg-white/40",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
