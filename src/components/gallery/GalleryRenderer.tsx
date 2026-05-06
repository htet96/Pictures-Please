"use client";

import { useState } from "react";
import { GridView } from "./GridView";
import { MosaicView } from "./MosaicView";
import { SlideshowView } from "./SlideshowView";
import { Lightbox } from "./Lightbox";
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
  displayMode: string;
  canDelete?: boolean;
  slideshowSpeed?: number;
  slideshowTransition?: string;
}

const MODES = [
  { value: "MASONRY", label: "Photos" },
  { value: "GRID", label: "Mosaic" },
  { value: "SLIDESHOW", label: "Slideshow" },
];

export function GalleryRenderer({ photos, displayMode, canDelete, slideshowSpeed, slideshowTransition }: Props) {
  const [activeMode, setActiveMode] = useState(displayMode);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const handleOpen = (index: number) => setLightboxIndex(index);
  const handleClose = () => setLightboxIndex(null);

  const sharedProps = { photos, onPhotoClick: handleOpen, canDelete };

  return (
    <>
      <div className="flex justify-center gap-1 py-3 px-4 border-b bg-background/80 sticky top-[57px] z-20">
        {MODES.map((mode) => (
          <button
            key={mode.value}
            onClick={() => setActiveMode(mode.value)}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              activeMode === mode.value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {mode.label}
          </button>
        ))}
      </div>

      {/* MASONRY = Photos (uniform grid) */}
      {(activeMode === "MASONRY") && <GridView {...sharedProps} />}
      {/* GRID = Mosaic (8-per-page patterns with play/pause) */}
      {(activeMode === "GRID") && <MosaicView {...sharedProps} speed={slideshowSpeed} />}
      {/* SLIDESHOW and CAROUSEL both use SlideshowView */}
      {(activeMode === "SLIDESHOW" || activeMode === "CAROUSEL") && (
        <SlideshowView photos={photos} canDelete={canDelete} speed={slideshowSpeed} transition={slideshowTransition} />
      )}

      {lightboxIndex !== null && (
        <Lightbox
          photos={photos}
          initialIndex={lightboxIndex}
          onClose={handleClose}
          canDelete={canDelete}
        />
      )}
    </>
  );
}
