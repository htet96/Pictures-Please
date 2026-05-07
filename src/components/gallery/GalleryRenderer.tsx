"use client";

import { useState } from "react";
import { motion } from "framer-motion";
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
      {/* Animated tab switcher */}
      <div className="flex justify-center px-4 border-b border-border/60 bg-card/70 backdrop-blur-sm sticky top-[57px] z-20">
        {MODES.map((mode) => (
          <button
            key={mode.value}
            onClick={() => setActiveMode(mode.value)}
            className={cn(
              "relative px-5 py-3.5 text-sm font-medium transition-colors",
              activeMode === mode.value
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {mode.label}
            {activeMode === mode.value && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                transition={{ type: "spring", stiffness: 500, damping: 40 }}
              />
            )}
          </button>
        ))}
      </div>

      {activeMode === "MASONRY" && (
        <MasonryView photos={photos} onPhotoClick={handleOpen} canDelete={canDelete} />
      )}
      {activeMode === "GRID" && (
        <MosaicView
          photos={photos}
          onPhotoClick={handleOpen}
          speed={slideshowSpeed}
          transition={slideshowTransition}
          transitionDuration={transitionDuration}
        />
      )}
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
