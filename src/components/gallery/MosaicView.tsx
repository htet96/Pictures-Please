"use client";

import { useCallback, useEffect, useState } from "react";
import { Play, Pause, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
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

export function MosaicView({ photos, onPhotoClick, canDelete }: Props) {
  const router = useRouter();
  const totalPages = Math.max(1, Math.ceil(photos.length / PAGE_SIZE));
  const [page, setPage] = useState(0);
  const [playing, setPlaying] = useState(false);

  const goNext = useCallback(
    () => setPage((p) => (p + 1) % totalPages),
    [totalPages]
  );
  const goPrev = useCallback(
    () => setPage((p) => (p === 0 ? totalPages - 1 : p - 1)),
    [totalPages]
  );

  useEffect(() => {
    if (!playing || totalPages <= 1) return;
    const t = setInterval(goNext, 4000);
    return () => clearInterval(t);
  }, [playing, goNext, totalPages]);

  // Reset to first page when photos change
  useEffect(() => { setPage(0); }, [photos.length]);

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
    <div className="p-4">
      <div
        className="w-full grid grid-cols-4 gap-2"
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

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4">
          <Button variant="outline" size="icon" onClick={goPrev} aria-label="Previous page">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 min-w-[90px]"
            onClick={() => setPlaying((p) => !p)}
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {playing ? "Pause" : "Play"}
          </Button>
          <span className="text-sm text-muted-foreground tabular-nums">
            {page + 1} / {totalPages}
          </span>
          <Button variant="outline" size="icon" onClick={goNext} aria-label="Next page">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
