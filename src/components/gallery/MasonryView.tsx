"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Masonry from "react-masonry-css";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { usePinch } from "@use-gesture/react";
import { CheckCircle2, Circle, Download, Loader2, Minus, Plus, Trash2, X } from "lucide-react";
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
  canDelete?: boolean;
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
}

const ZOOM_KEY = "gallery-zoom-level";
const MIN_ZOOM = 1;
const MAX_ZOOM = 6;
const DEFAULT_ZOOM = 4;

function getBreakpoints(level: number): Record<string, number> {
  switch (level) {
    case 1: return { default: 1 };
    case 2: return { default: 2, 480: 1 };
    case 3: return { default: 3, 768: 2, 480: 1 };
    case 4: return { default: 4, 1280: 3, 768: 2, 480: 1 };
    case 5: return { default: 5, 1280: 4, 768: 3, 480: 2 };
    case 6: return { default: 6, 1280: 5, 768: 4, 480: 2 };
    default: return { default: 4, 1280: 3, 768: 2, 480: 1 };
  }
}

export function MasonryView({ photos, onPhotoClick, canDelete, hasMore, loadingMore, onLoadMore }: Props) {
  const router = useRouter();
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Zoom level state with localStorage persistence
  const [zoomLevel, setZoomLevel] = useState(DEFAULT_ZOOM);
  useEffect(() => {
    const saved = localStorage.getItem(ZOOM_KEY);
    if (saved) {
      const n = parseInt(saved, 10);
      if (n >= MIN_ZOOM && n <= MAX_ZOOM) setZoomLevel(n);
    }
  }, []);

  const changeZoom = useCallback((delta: number) => {
    setZoomLevel((prev) => {
      const next = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev + delta));
      localStorage.setItem(ZOOM_KEY, String(next));
      return next;
    });
  }, []);

  const breakpoints = useMemo(() => getBreakpoints(zoomLevel), [zoomLevel]);

  // Pinch-to-zoom on the masonry container
  const containerRef = useRef<HTMLDivElement>(null);
  const lastPinchScale = useRef(1);

  usePinch(
    ({ offset: [scale], first }) => {
      if (first) {
        lastPinchScale.current = 1;
        return;
      }
      const delta = scale - lastPinchScale.current;
      if (Math.abs(delta) >= 0.3) {
        // Pinch out (scale > 1) = zoom in = fewer columns = decrement
        // Pinch in (scale < 1) = zoom out = more columns = increment
        changeZoom(delta > 0 ? -1 : 1);
        lastPinchScale.current = scale;
      }
    },
    {
      target: containerRef,
      eventOptions: { passive: false },
      scaleBounds: { min: 0.3, max: 3 },
    }
  );

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function exitSelect() {
    setSelectMode(false);
    setSelected(new Set());
  }

  async function handleBulkDownload() {
    const toDownload = photos.filter((p) => selected.has(p.id));
    for (const p of toDownload) {
      await new Promise<void>((resolve) => {
        const a = document.createElement("a");
        a.href = `/api/photos/${p.id}/download`;
        a.download = p.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(resolve, 300);
      });
    }
    toast.success(`Downloaded ${toDownload.length} photo${toDownload.length !== 1 ? "s" : ""}`);
  }

  async function handleBulkDelete() {
    if (!confirm(`Delete ${selected.size} photo${selected.size !== 1 ? "s" : ""}?`)) return;
    setBulkDeleting(true);
    try {
      const res = await fetch("/api/photos/bulk", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Deleted ${selected.size} photo${selected.size !== 1 ? "s" : ""}`);
      exitSelect();
      router.refresh();
    } catch {
      toast.error("Failed to delete photos");
    } finally {
      setBulkDeleting(false);
    }
  }

  async function handleSingleDelete(e: React.MouseEvent, photoId: string) {
    e.stopPropagation();
    if (!confirm("Delete this photo?")) return;
    const res = await fetch(`/api/photos/${photoId}`, { method: "DELETE" });
    if (res.ok) { toast.success("Photo deleted"); router.refresh(); }
    else toast.error("Failed to delete photo");
  }

  // Infinite scroll sentinel
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!hasMore || !onLoadMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loadingMore) onLoadMore();
      },
      { rootMargin: "400px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, onLoadMore]);

  return (
    <div className={cn("relative", selectMode && selected.size > 0 ? "pb-20" : "")}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        {/* Zoom controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => changeZoom(-1)}
            disabled={zoomLevel <= MIN_ZOOM}
            className="rounded p-1.5 text-muted-foreground hover:text-primary hover:bg-muted/50 transition-colors disabled:opacity-30 disabled:pointer-events-none"
            aria-label="Zoom in (fewer columns)"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => changeZoom(1)}
            disabled={zoomLevel >= MAX_ZOOM}
            className="rounded p-1.5 text-muted-foreground hover:text-primary hover:bg-muted/50 transition-colors disabled:opacity-30 disabled:pointer-events-none"
            aria-label="Zoom out (more columns)"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Select toggle */}
        {!selectMode ? (
          <button
            onClick={() => setSelectMode(true)}
            className="text-xs text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded hover:bg-muted/50"
          >
            Select
          </button>
        ) : (
          <button
            onClick={exitSelect}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded hover:bg-muted/50"
          >
            <X className="h-3 w-3" /> Cancel
          </button>
        )}
      </div>

      <div ref={containerRef} className="p-2 sm:p-4" style={{ touchAction: "pan-y" }}>
        <Masonry
          breakpointCols={breakpoints}
          className="flex gap-2 sm:gap-4"
          columnClassName="flex flex-col gap-2 sm:gap-4"
        >
          {photos.map((photo, i) => {
            const isSelected = selected.has(photo.id);
            return (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: Math.min(i * 0.05, 0.6) }}
              >
                <div
                  className={cn(
                    "group relative overflow-hidden rounded-lg bg-muted cursor-pointer",
                    "transition-all duration-200 hover:scale-[1.01]",
                    isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                  )}
                  onClick={() => {
                    if (selectMode) toggleSelect(photo.id);
                    else onPhotoClick(i);
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/uploads/${photo.thumbnailPath}`}
                    alt={photo.filename}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-auto object-cover transition-opacity duration-300"
                  />

                  {/* Select mode overlay */}
                  {selectMode && (
                    <div
                      className={cn(
                        "absolute inset-0 transition-colors duration-150",
                        isSelected ? "bg-primary/20" : "bg-transparent group-hover:bg-black/10"
                      )}
                    >
                      <div className="absolute top-2 left-2">
                        {isSelected ? (
                          <CheckCircle2 className="h-5 w-5 text-primary drop-shadow-sm" />
                        ) : (
                          <Circle className="h-5 w-5 text-white/80 drop-shadow-sm" />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Single delete (non-select mode) */}
                  {!selectMode && canDelete && (
                    <button
                      onClick={(e) => handleSingleDelete(e, photo.id)}
                      className="absolute top-2 right-2 rounded-full p-1.5 bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 focus:opacity-100"
                      aria-label="Delete photo"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </Masonry>

        {/* Infinite scroll sentinel + spinner */}
        {hasMore && (
          <div ref={sentinelRef} className="flex justify-center py-8">
            {loadingMore && <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />}
          </div>
        )}
      </div>

      {/* Bulk action bar */}
      {selectMode && selected.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-between gap-3 px-6 py-3 bg-card/95 backdrop-blur-sm border-t border-border shadow-sharp">
          <span className="text-sm font-medium text-foreground">
            {selected.size} selected
          </span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleBulkDownload} className="gap-1.5">
              <Download className="h-3.5 w-3.5" />
              Download
            </Button>
            {canDelete && (
              <Button
                size="sm"
                variant="destructive"
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
                className="gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {bulkDeleting ? "Deleting…" : "Delete"}
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={exitSelect}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
