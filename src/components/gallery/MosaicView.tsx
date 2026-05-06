"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Play, Pause, ChevronLeft, ChevronRight, Trash2, Maximize, Minimize } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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
  speed?: number;
}

type Cell = { gridColumn: string; gridRow: string };

// Three mosaic patterns for 8 photos on a 4-col × 3-row grid
const PATTERNS: Cell[][] = [
  // Pattern A: large 2×2 top-left
  [
    { gridColumn: "1 / 3", gridRow: "1 / 3" },
    { gridColumn: "3",     gridRow: "1" },
    { gridColumn: "4",     gridRow: "1" },
    { gridColumn: "3",     gridRow: "2" },
    { gridColumn: "4",     gridRow: "2" },
    { gridColumn: "1",     gridRow: "3" },
    { gridColumn: "2 / 4", gridRow: "3" },
    { gridColumn: "4",     gridRow: "3" },
  ],
  // Pattern B: large 2×2 top-right
  [
    { gridColumn: "1",     gridRow: "1" },
    { gridColumn: "2",     gridRow: "1" },
    { gridColumn: "3 / 5", gridRow: "1 / 3" },
    { gridColumn: "1",     gridRow: "2" },
    { gridColumn: "2",     gridRow: "2" },
    { gridColumn: "1 / 3", gridRow: "3" },
    { gridColumn: "3",     gridRow: "3" },
    { gridColumn: "4",     gridRow: "3" },
  ],
  // Pattern C: tall 1×2 left, wide strip top-centre
  [
    { gridColumn: "1",     gridRow: "1 / 3" },
    { gridColumn: "2 / 4", gridRow: "1" },
    { gridColumn: "4",     gridRow: "1" },
    { gridColumn: "2",     gridRow: "2" },
    { gridColumn: "3",     gridRow: "2" },
    { gridColumn: "4",     gridRow: "2" },
    { gridColumn: "1 / 3", gridRow: "3" },
    { gridColumn: "3 / 5", gridRow: "3" },
  ],
];

const PAGE_SIZE = 8;
const CELL_HEIGHT = "clamp(80px, calc(22vw - 8px), 220px)";

export function MosaicView({ photos, onPhotoClick, canDelete, speed = 4000 }: Props) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const totalPages = Math.max(1, Math.ceil(photos.length / PAGE_SIZE));
  const [page, setPage] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [visible, setVisible] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);

  const changePage = useCallback((newPage: number) => {
    setVisible(false);
    setTimeout(() => {
      setPage(newPage);
      setVisible(true);
    }, 200);
  }, []);

  const goNext = useCallback(
    () => changePage((page + 1) % totalPages),
    [page, totalPages, changePage]
  );
  const goPrev = useCallback(
    () => changePage(page === 0 ? totalPages - 1 : page - 1),
    [page, totalPages, changePage]
  );

  useEffect(() => {
    if (!playing || totalPages <= 1) return;
    const t = setInterval(goNext, speed);
    return () => clearInterval(t);
  }, [playing, goNext, totalPages, speed]);

  // Reset to first page when photos change
  useEffect(() => { setPage(0); }, [photos.length]);

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

  const pagePhotos = photos.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const pattern = PATTERNS[page % PATTERNS.length];

  async function handleDelete(photoId: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Delete this photo?")) return;
    const res = await fetch(`/api/photos/${photoId}`, { method: "DELETE" });
    if (res.ok) { toast.success("Photo deleted"); router.refresh(); }
    else toast.error("Failed to delete");
  }

  return (
    <div ref={containerRef} className={cn("p-4", fullscreen && "bg-background min-h-screen flex flex-col justify-center")}>
      <div
        className={cn("w-full grid grid-cols-4 gap-2 transition-opacity duration-200", visible ? "opacity-100" : "opacity-0")}
        style={{ gridTemplateRows: `repeat(3, ${CELL_HEIGHT})` }}
      >
        {pagePhotos.map((photo, i) => (
          <div
            key={photo.id}
            style={pattern[i]}
            className="relative overflow-hidden rounded-lg bg-muted group cursor-pointer"
            onClick={() => onPhotoClick(page * PAGE_SIZE + i)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/uploads/${photo.thumbnailPath}`}
              alt={photo.filename}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
            {canDelete && (
              <button
                onClick={(e) => handleDelete(photo.id, e)}
                className={cn(
                  "absolute top-2 right-2 rounded-full p-1.5 bg-black/50 text-white",
                  "opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                )}
                aria-label="Delete photo"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
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
