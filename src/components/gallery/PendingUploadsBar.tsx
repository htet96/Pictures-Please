"use client";

import { useEffect, useState } from "react";
import { Clock, X } from "lucide-react";

interface PendingPhoto {
  id: string;
  thumbnailPath: string;
  status: string;
}

interface Props {
  galleryId: string;
  approvedPhotoIds: string[];
}

export function PendingUploadsBar({ galleryId, approvedPhotoIds }: Props) {
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const storageKey = `pending_uploads_${galleryId}`;
    const storedIds: string[] = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
    if (storedIds.length === 0) return;

    // Remove any IDs that are now approved (visible in gallery)
    const stillPending = storedIds.filter((id) => !approvedPhotoIds.includes(id));
    if (stillPending.length !== storedIds.length) {
      localStorage.setItem(storageKey, JSON.stringify(stillPending));
    }
    if (stillPending.length === 0) return;

    // Fetch actual status from server to confirm still pending
    Promise.all(
      stillPending.map((id) =>
        fetch(`/api/photos/${id}`)
          .then((r) => (r.ok ? r.json() : null))
          .then((data) => data?.photo as PendingPhoto | null)
          .catch(() => null)
      )
    ).then((results) => {
      const photos = results.filter(
        (p): p is PendingPhoto => p !== null && p.status === "PENDING"
      );
      // Update localStorage to only keep confirmed pending IDs
      const confirmedIds = photos.map((p) => p.id);
      localStorage.setItem(storageKey, JSON.stringify(confirmedIds));
      setPendingPhotos(photos);
    });
  }, [galleryId, approvedPhotoIds]);

  function handleDismiss() {
    setDismissed(true);
  }

  if (dismissed || pendingPhotos.length === 0) return null;

  return (
    <div className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-start gap-3">
        <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
            {pendingPhotos.length} photo{pendingPhotos.length !== 1 ? "s" : ""} pending approval
          </p>
          <p className="text-xs text-amber-700/70 dark:text-amber-400/70 mt-0.5">
            Your upload{pendingPhotos.length !== 1 ? "s" : ""} will appear once reviewed by an admin.
          </p>
          <div className="flex gap-2 mt-2 flex-wrap">
            {pendingPhotos.map((photo) => (
              <img
                key={photo.id}
                src={`/api/uploads/${photo.thumbnailPath}`}
                alt="Pending photo"
                className="h-12 w-12 rounded object-cover opacity-60 border border-amber-400/40"
              />
            ))}
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="shrink-0 text-amber-700/60 hover:text-amber-700 dark:text-amber-400/60 dark:hover:text-amber-400 transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
