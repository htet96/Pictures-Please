"use client";

import { useState } from "react";
import { MasonryView } from "./MasonryView";
import { GridView } from "./GridView";
import { SlideshowView } from "./SlideshowView";
import { CarouselView } from "./CarouselView";
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
}

const MODES = [
  { value: "MASONRY", label: "Masonry" },
  { value: "GRID", label: "Grid" },
  { value: "SLIDESHOW", label: "Slideshow" },
  { value: "CAROUSEL", label: "Carousel" },
];

export function GalleryRenderer({ photos, displayMode, canDelete }: Props) {
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

      {activeMode === "MASONRY" && <MasonryView {...sharedProps} />}
      {activeMode === "GRID" && <GridView {...sharedProps} />}
      {activeMode === "SLIDESHOW" && <SlideshowView photos={photos} canDelete={canDelete} />}
      {activeMode === "CAROUSEL" && <CarouselView photos={photos} canDelete={canDelete} />}

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
