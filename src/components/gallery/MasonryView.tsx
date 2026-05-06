"use client";

import Masonry from "react-masonry-css";
import { motion } from "framer-motion";
import { PhotoCard } from "./PhotoCard";

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

const breakpoints = {
  default: 4,
  1280: 3,
  768: 2,
  480: 1,
};

export function MasonryView({ photos, onPhotoClick, canDelete }: Props) {
  return (
    <div className="p-2 sm:p-4">
      <Masonry
        breakpointCols={breakpoints}
        className="flex gap-2 sm:gap-4"
        columnClassName="flex flex-col gap-2 sm:gap-4"
      >
        {photos.map((photo, i) => (
          <motion.div
            key={photo.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: Math.min(i * 0.05, 0.6) }}
          >
            <PhotoCard
              photo={photo}
              onClick={() => onPhotoClick(i)}
              canDelete={canDelete}
            />
          </motion.div>
        ))}
      </Masonry>
    </div>
  );
}
