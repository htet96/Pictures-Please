"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { MasonryView } from "./MasonryView";
import { MosaicView } from "./MosaicView";
import { SlideshowView } from "./SlideshowView";
import { Lightbox } from "./Lightbox";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

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
  galleryId: string;
  totalCount: number;
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

export function GalleryRenderer({
  photos: initialPhotos,
  galleryId,
  totalCount,
  displayMode,
  canDelete,
  slideshowSpeed,
  slideshowTransition,
  transitionDuration,
}: Props) {
  const [activeMode, setActiveMode] = useState(displayMode);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Pagination state
  const [photos, setPhotos] = useState(initialPhotos);
  const [allLoaded, setAllLoaded] = useState(initialPhotos.length >= totalCount);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingAll, setLoadingAll] = useState(false);

  const hasMore = !allLoaded && photos.length < totalCount;

  // Fetch the next page (cursor-based, for infinite scroll in Photos mode)
  const loadNextPage = useCallback(async () => {
    if (loadingMore || allLoaded) return;
    setLoadingMore(true);
    try {
      const lastId = photos[photos.length - 1]?.id;
      const res = await fetch(
        `/api/galleries/${galleryId}/photos?cursor=${lastId}&limit=50`
      );
      if (!res.ok) return;
      const data = await res.json();
      setPhotos((prev) => [...prev, ...data.photos]);
      if (!data.nextCursor) setAllLoaded(true);
    } finally {
      setLoadingMore(false);
    }
  }, [galleryId, photos, loadingMore, allLoaded]);

  // Fetch ALL photos at once (for Mosaic / Slideshow)
  const loadAll = useCallback(async () => {
    if (allLoaded || loadingAll) return;
    setLoadingAll(true);
    try {
      const res = await fetch(
        `/api/galleries/${galleryId}/photos?all=true`
      );
      if (!res.ok) return;
      const data = await res.json();
      setPhotos(data.photos);
      setAllLoaded(true);
    } finally {
      setLoadingAll(false);
    }
  }, [galleryId, allLoaded, loadingAll]);

  // When switching to Mosaic or Slideshow, pre-load all photos
  function handleModeSwitch(mode: string) {
    setActiveMode(mode);
    if ((mode === "GRID" || mode === "SLIDESHOW" || mode === "CAROUSEL") && !allLoaded) {
      loadAll();
    }
  }

  const handleOpen = (index: number) => setLightboxIndex(index);
  const handleClose = () => setLightboxIndex(null);

  // Show a loading spinner while fetching all photos for Mosaic/Slideshow
  const showFullLoader = (activeMode === "GRID" || activeMode === "SLIDESHOW" || activeMode === "CAROUSEL") && loadingAll;

  return (
    <>
      {/* Animated tab switcher */}
      <div className="flex justify-center px-4 border-b border-border/60 bg-card/70 backdrop-blur-sm sticky top-[57px] z-20">
        {MODES.map((mode) => (
          <button
            key={mode.value}
            onClick={() => handleModeSwitch(mode.value)}
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

      {showFullLoader ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {activeMode === "MASONRY" && (
            <MasonryView
              photos={photos}
              onPhotoClick={handleOpen}
              canDelete={canDelete}
              hasMore={hasMore}
              loadingMore={loadingMore}
              onLoadMore={loadNextPage}
            />
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
        </>
      )}

      {lightboxIndex !== null && (
        <Lightbox
          photos={photos}
          initialIndex={lightboxIndex}
          onClose={handleClose}
          canDelete={canDelete}
          hasMore={hasMore}
          onLoadMore={loadNextPage}
        />
      )}
    </>
  );
}
