"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, Circle, Loader2, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

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
    const validIds = valid.map((p) => p.id);
    localStorage.setItem(storageKey, JSON.stringify(validIds));
    setPhotos(valid);
    setLoading(false);
  }, [galleryId]);

  useEffect(() => {
    fetchMyUploads();
  }, [fetchMyUploads]);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function exitSelect() {
    setSelectMode(false);
    setSelected(new Set());
  }

  async function handleSingleDelete(photoId: string) {
    if (!confirm("Delete this photo?")) return;
    const res = await fetch(`/api/photos/${photoId}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Photo deleted");
      removePhotos([photoId]);
      router.refresh();
    } else {
      toast.error("Failed to delete photo");
    }
  }

  async function handleBulkDelete() {
    if (!confirm(`Delete ${selected.size} photo${selected.size !== 1 ? "s" : ""}?`)) return;
    setBulkDeleting(true);
    try {
      const res = await fetch("/api/photos/bulk", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Deleted ${selected.size} photo${selected.size !== 1 ? "s" : ""}`);
      removePhotos(Array.from(selected));
      exitSelect();
      router.refresh();
    } catch {
      toast.error("Failed to delete photos");
    } finally {
      setBulkDeleting(false);
    }
  }

  function removePhotos(ids: string[]) {
    const idSet = new Set(ids);
    setPhotos((prev) => prev.filter((p) => !idSet.has(p.id)));
    const storageKey = `my_uploads_${galleryId}`;
    const stored: string[] = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
    localStorage.setItem(storageKey, JSON.stringify(stored.filter((id) => !idSet.has(id))));
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
    <div className={cn("relative", selectMode && selected.size > 0 ? "pb-20" : "")}>
      {/* Toolbar */}
      {canDelete && (
        <div className="flex justify-end px-4 pt-3 pb-1">
          {!selectMode ? (
            <button
              onClick={() => setSelectMode(true)}
              className="text-xs text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded hover:bg-muted/50"
            >
              Select
            </button>
          ) : (
            <button
              onClick={exitSelect}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded hover:bg-muted/50"
            >
              <X className="h-3 w-3" /> Cancel
            </button>
          )}
        </div>
      )}

      <div className="p-2 sm:p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
          {photos.map((photo) => {
            const isSelected = selected.has(photo.id);
            return (
              <div
                key={photo.id}
                className={cn(
                  "group relative aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer transition-all duration-150",
                  isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                )}
                onClick={() => {
                  if (selectMode) toggleSelect(photo.id);
                }}
              >
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

                {/* Select mode overlay */}
                {selectMode && (
                  <div
                    className={cn(
                      "absolute inset-0 transition-colors duration-150",
                      isSelected ? "bg-primary/20" : "bg-transparent group-hover:bg-black/10"
                    )}
                  >
                    <div className="absolute top-1.5 right-1.5">
                      {isSelected ? (
                        <CheckCircle2 className="h-5 w-5 text-primary drop-shadow-sm" />
                      ) : (
                        <Circle className="h-5 w-5 text-white/80 drop-shadow-sm" />
                      )}
                    </div>
                  </div>
                )}

                {/* Single delete (non-select mode) */}
                {!selectMode && canDelete && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleSingleDelete(photo.id); }}
                    className="absolute top-1.5 right-1.5 rounded-full p-1.5 bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 focus:opacity-100"
                    aria-label="Delete photo"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bulk action bar */}
      {selectMode && selected.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-between gap-3 px-6 py-3 bg-card/95 backdrop-blur-sm border-t border-border shadow-sharp">
          <span className="text-sm font-medium text-foreground">
            {selected.size} selected
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {bulkDeleting ? "Deleting…" : "Delete"}
            </Button>
            <Button size="sm" variant="ghost" onClick={exitSelect}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
