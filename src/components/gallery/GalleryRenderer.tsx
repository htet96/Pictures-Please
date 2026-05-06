"use client";

import { useState } from "react";
import { MasonryView } from "./MasonryView";
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
  transitionDuration?: number;
}

const MODES = [
  { value: "MASONRY", label: "Photos" },
  { value: "GRID", label: "Mosaic" },
  { value: "SLIDESHOW", label: "Slideshow" },
];

export function GalleryRenderer({ photos, displayMode, canDelete, slideshowSpeed, slideshowTransition, transitionDuration }: Props) {
  const [activeMode, setActiveMode] = useState(displayMode);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const handleOpen = (index: number) => setLightboxIndex(index);
  const handleClose = () => setLightboxIndex(null);

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

      {/* MASONRY = Photos — delete enabled here only */}
      {activeMode === "MASONRY" && (
        <MasonryView photos={photos} onPhotoClick={handleOpen} canDelete={canDelete} />
      )}
      {/* GRID = Mosaic — no delete */}
      {activeMode === "GRID" && (
        <MosaicView
          photos={photos}
          onPhotoClick={handleOpen}
          speed={slideshowSpeed}
          transition={slideshowTransition}
          transitionDuration={transitionDuration}
        />
      )}
      {/* SLIDESHOW — no delete */}
      {(activeMode === "SLIDESHOW" || activeMode === "CAROUSEL") && (
        <SlideshowView
          photos={photos}
          speed={slideshowSpeed}
          transition={slideshowTransition}
          transitionDuration={transitionDuration}
        />
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
