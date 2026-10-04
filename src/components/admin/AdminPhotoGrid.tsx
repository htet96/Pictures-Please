"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { CheckCircle2, Circle, Download, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Photo {
  id: string;
  thumbnailPath: string;
  filename: string;
  status: string;
  createdAt: string;
}

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "APPROVED", label: "Approved" },
  { value: "PENDING", label: "Pending" },
  { value: "REJECTED", label: "Rejected" },
];

export function AdminPhotoGrid({ galleryId }: { galleryId: string }) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const fetchPhotos = useCallback(async (status: string) => {
    setLoading(true);
    try {
      const url = `/api/galleries/${galleryId}/photos${status ? `?status=${status}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      setPhotos(data.photos ?? []);
    } finally {
      setLoading(false);
    }
  }, [galleryId]);

  useEffect(() => {
    fetchPhotos(statusFilter);
  }, [fetchPhotos, statusFilter]);

  function handleStatusChange(status: string) {
    setStatusFilter(status);
    setSelected(new Set());
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === photos.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(photos.map((p) => p.id)));
    }
  }

  async function handleBulkDelete() {
    if (!confirm(`Delete ${selected.size} photo${selected.size !== 1 ? "s" : ""}? This cannot be undone.`)) return;
    setBulkDeleting(true);
    try {
      const res = await fetch("/api/photos/bulk", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Deleted ${selected.size} photo${selected.size !== 1 ? "s" : ""}`);
      setSelected(new Set());
      fetchPhotos(statusFilter);
    } catch {
      toast.error("Failed to delete photos");
    } finally {
      setBulkDeleting(false);
    }
  }

  async function handleDownloadZip() {
    setDownloading(true);
    try {
      const res = await fetch("/api/photos/download-zip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "photos.zip";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Downloading ${selected.size} photo${selected.size !== 1 ? "s" : ""}`);
    } catch {
      toast.error("Failed to download photos");
    } finally {
      setDownloading(false);
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

  return (
    <div>
      {/* Status filter tabs */}
      <div className="flex items-center gap-1 mb-4">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleStatusChange(tab.value)}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
              statusFilter === tab.value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Selection controls */}
      {photos.length > 0 && (
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={toggleSelectAll}
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            {selected.size === photos.length ? "Deselect all" : "Select all"}
          </button>
          {selected.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{selected.size} selected</span>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDownloadZip}
                disabled={downloading}
                className="gap-1.5"
              >
                <Download className="h-3.5 w-3.5" />
                {downloading ? "Zipping…" : "Download ZIP"}
              </Button>
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
            </div>
          )}
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : photos.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No photos found.</p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          {photos.map((photo) => {
            const isSelected = selected.has(photo.id);
            return (
              <div
                key={photo.id}
                onClick={() => toggleSelect(photo.id)}
                className={cn(
                  "group relative aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer transition-all duration-150",
                  isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/uploads/${photo.thumbnailPath}`}
                  alt={photo.filename}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />

                {/* Selection checkbox */}
                <div className="absolute top-1.5 left-1.5">
                  {isSelected ? (
                    <CheckCircle2 className="h-5 w-5 text-primary drop-shadow-sm" />
                  ) : (
                    <Circle className="h-5 w-5 text-white/60 opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-sm" />
                  )}
                </div>

                {/* Status dot */}
                <div className={cn("absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full border border-white/50", statusColor(photo.status))} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
