"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Photo {
  id: string;
  thumbnailPath: string;
  filename: string;
  status: string;
}

interface Props {
  galleryId: string;
  canDelete?: boolean;
}

export function MyUploads({ galleryId, canDelete }: Props) {
  const router = useRouter();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMyUploads = useCallback(async () => {
    const storageKey = `my_uploads_${galleryId}`;
    const ids: string[] = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
    if (ids.length === 0) {
      setPhotos([]);
      setLoading(false);
      return;
    }

    const results = await Promise.all(
      ids.map((id) =>
        fetch(`/api/photos/${id}`)
          .then((r) => (r.ok ? r.json() : null))
          .then((data) => data?.photo as Photo | null)
          .catch(() => null)
      )
    );

    const valid = results.filter((p): p is Photo => p !== null);
    // Clean up localStorage to remove deleted photos
    const validIds = valid.map((p) => p.id);
    localStorage.setItem(storageKey, JSON.stringify(validIds));
    setPhotos(valid);
    setLoading(false);
  }, [galleryId]);

  useEffect(() => {
    fetchMyUploads();
  }, [fetchMyUploads]);

  async function handleDelete(photoId: string) {
    if (!confirm("Delete this photo?")) return;
    const res = await fetch(`/api/photos/${photoId}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Photo deleted");
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      // Update localStorage
      const storageKey = `my_uploads_${galleryId}`;
      const ids: string[] = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
      localStorage.setItem(storageKey, JSON.stringify(ids.filter((id) => id !== photoId)));
      router.refresh();
    } else {
      toast.error("Failed to delete photo");
    }
  }

  const statusColor = (s: string) => {
    switch (s) {
      case "APPROVED": return "bg-green-500";
      case "PENDING": return "bg-yellow-500";
      case "REJECTED": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const statusLabel = (s: string) => {
    switch (s) {
      case "APPROVED": return "Approved";
      case "PENDING": return "Pending";
      case "REJECTED": return "Rejected";
      default: return s;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground text-center px-4">
        <p className="text-sm">No uploads from this device.</p>
        <p className="text-xs mt-1 text-muted-foreground/60">Photos you upload will appear here.</p>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
        {photos.map((photo) => (
          <div key={photo.id} className="group relative aspect-square rounded-lg overflow-hidden bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/uploads/${photo.thumbnailPath}`}
              alt={photo.filename}
              loading="lazy"
              className="w-full h-full object-cover"
            />

            {/* Status badge */}
            <div className="absolute top-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-black/50 text-[10px] font-medium text-white">
              <div className={cn("h-1.5 w-1.5 rounded-full", statusColor(photo.status))} />
              {statusLabel(photo.status)}
            </div>

            {/* Delete button */}
            {canDelete && (
              <button
                onClick={() => handleDelete(photo.id)}
                className="absolute top-1.5 right-1.5 rounded-full p-1.5 bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 focus:opacity-100"
                aria-label="Delete photo"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
