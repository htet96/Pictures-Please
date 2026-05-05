"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
  canDelete?: boolean;
}

export function CarouselView({ photos, canDelete }: Props) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, dragFree: false });
  const [thumbRef, thumbApi] = useEmblaCarousel({
    containScroll: "keepSnaps",
    dragFree: true,
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    const i = emblaApi.selectedScrollSnap();
    setSelectedIndex(i);
    thumbApi?.scrollTo(i);
  }, [emblaApi, thumbApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    onSelect();
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const scrollToThumb = useCallback(
    (i: number) => {
      emblaApi?.scrollTo(i);
      thumbApi?.scrollTo(i);
    },
    [emblaApi, thumbApi]
  );

  if (photos.length === 0) return null;

  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">
      {/* Main carousel */}
      <div className="flex-1 relative overflow-hidden bg-black" ref={emblaRef}>
        <div className="flex h-full">
          {photos.map((photo, i) => (
            <div
              key={photo.id}
              className="relative flex-[0_0_100%] min-w-0 flex items-center justify-center"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/uploads/${photo.thumbnailPath}`}
                alt={photo.filename}
                className="max-w-full max-h-full object-contain cursor-zoom-in"
                onClick={() => setLightboxIndex(i)}
                loading={Math.abs(i - selectedIndex) <= 1 ? "eager" : "lazy"}
              />
            </div>
          ))}
        </div>

        {/* Nav buttons */}
        {photos.length > 1 && (
          <>
            <button
              onClick={scrollPrev}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 rounded-full p-2 sm:p-3 bg-black/30 hover:bg-black/60 text-white transition-colors"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={scrollNext}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 rounded-full p-2 sm:p-3 bg-black/30 hover:bg-black/60 text-white transition-colors"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}

        {/* Counter */}
        <div className="absolute bottom-4 left-0 right-0 text-center text-white/70 text-sm">
          {selectedIndex + 1} / {photos.length}
        </div>
      </div>

      {/* Thumbnail strip */}
      <div className="h-20 bg-black border-t border-white/10 overflow-hidden" ref={thumbRef}>
        <div className="flex h-full gap-1 px-1">
          {photos.map((photo, i) => (
            <button
              key={photo.id}
              onClick={() => scrollToThumb(i)}
              className={cn(
                "flex-[0_0_auto] h-full aspect-square overflow-hidden rounded transition-opacity",
                i === selectedIndex ? "opacity-100 ring-2 ring-primary" : "opacity-50 hover:opacity-80"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/uploads/${photo.thumbnailPath}`}
                alt=""
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          photos={photos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          canDelete={canDelete}
        />
      )}
    </div>
  );
}
