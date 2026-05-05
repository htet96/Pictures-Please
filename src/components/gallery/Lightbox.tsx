"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X, ChevronLeft, ChevronRight, Trash2, ZoomIn } from "lucide-react";
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
  initialIndex: number;
  onClose: () => void;
  canDelete?: boolean;
}

export function Lightbox({ photos, initialIndex, onClose, canDelete }: Props) {
  const router = useRouter();
  const [index, setIndex] = useState(initialIndex);
  const [loaded, setLoaded] = useState(false);
  const [zoomed, setZoomed] = useState(false);

  const photo = photos[index];

  const prev = useCallback(() => {
    setLoaded(false);
    setZoomed(false);
    setIndex((i) => (i > 0 ? i - 1 : photos.length - 1));
  }, [photos.length]);

  const next = useCallback(() => {
    setLoaded(false);
    setZoomed(false);
    setIndex((i) => (i < photos.length - 1 ? i + 1 : 0));
  }, [photos.length]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, prev, next]);

  // Touch swipe support
  useEffect(() => {
    let startX = 0;
    function onTouchStart(e: TouchEvent) { startX = e.touches[0].clientX; }
    function onTouchEnd(e: TouchEvent) {
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) dx < 0 ? next() : prev();
    }
    window.addEventListener("touchstart", onTouchStart);
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [next, prev]);

  async function handleDelete() {
    if (!confirm("Delete this photo?")) return;
    const res = await fetch(`/api/photos/${photo.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Photo deleted");
      if (photos.length === 1) { onClose(); router.refresh(); return; }
      const newPhotos = photos.filter((_, i) => i !== index);
      setIndex(Math.min(index, newPhotos.length - 1));
      router.refresh();
      onClose();
    } else {
      toast.error("Failed to delete");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Controls */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-3 sm:p-4 z-10">
        <span className="text-white/70 text-sm">
          {index + 1} / {photos.length}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoomed((z) => !z)}
            className="rounded-full p-2 bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Toggle zoom"
          >
            <ZoomIn className="h-5 w-5" />
          </button>
          {canDelete && (
            <button
              onClick={handleDelete}
              className="rounded-full p-2 bg-white/10 hover:bg-red-600 text-white transition-colors"
              aria-label="Delete photo"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded-full p-2 bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Navigation arrows */}
      {photos.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 sm:left-4 z-10 rounded-full p-2 sm:p-3 bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Previous photo"
          >
            <ChevronLeft className="h-6 w-6 sm:h-8 sm:w-8" />
          </button>
          <button
            onClick={next}
            className="absolute right-2 sm:right-4 z-10 rounded-full p-2 sm:p-3 bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Next photo"
          >
            <ChevronRight className="h-6 w-6 sm:h-8 sm:w-8" />
          </button>
        </>
      )}

      {/* Image */}
      <div
        className={cn(
          "relative max-w-full max-h-full px-14 sm:px-20 py-16 transition-transform",
          zoomed ? "overflow-auto" : "flex items-center justify-center"
        )}
      >
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          </div>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={photo.id}
          src={`/api/uploads/${photo.originalPath}`}
          alt={photo.filename}
          onLoad={() => setLoaded(true)}
          className={cn(
            "rounded object-contain transition-opacity duration-300",
            loaded ? "opacity-100" : "opacity-0",
            zoomed
              ? "max-w-none max-h-none cursor-zoom-out"
              : "max-w-full max-h-[80vh] cursor-zoom-in"
          )}
          onClick={() => setZoomed((z) => !z)}
        />
      </div>
    </div>
  );
}
