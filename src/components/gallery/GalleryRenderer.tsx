"use client";

import { useState } from "react";
import { MasonryView } from "./MasonryView";
import { GridView } from "./GridView";
import { SlideshowView } from "./SlideshowView";
import { CarouselView } from "./CarouselView";
import { Lightbox } from "./Lightbox";

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

export function GalleryRenderer({ photos, displayMode, canDelete }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const handleOpen = (index: number) => setLightboxIndex(index);
  const handleClose = () => setLightboxIndex(null);

  const sharedProps = { photos, onPhotoClick: handleOpen, canDelete };

  return (
    <>
      {displayMode === "MASONRY" && <MasonryView {...sharedProps} />}
      {displayMode === "GRID" && <GridView {...sharedProps} />}
      {displayMode === "SLIDESHOW" && <SlideshowView photos={photos} canDelete={canDelete} />}
      {displayMode === "CAROUSEL" && <CarouselView photos={photos} canDelete={canDelete} />}

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
