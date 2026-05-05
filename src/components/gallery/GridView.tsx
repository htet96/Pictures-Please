"use client";

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

export function GridView({ photos, onPhotoClick, canDelete }: Props) {
  return (
    <div className="p-2 sm:p-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3">
        {photos.map((photo, i) => (
          <div key={photo.id} className="aspect-square overflow-hidden rounded-lg">
            <PhotoCard
              photo={photo}
              onClick={() => onPhotoClick(i)}
              canDelete={canDelete}
              square
            />
          </div>
        ))}
      </div>
    </div>
  );
}
