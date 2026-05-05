"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, User } from "lucide-react";

interface Photo {
  id: string;
  thumbnailPath: string;
  filename: string;
  uploaderName: string | null;
  createdAt: Date;
  gallery: { name: string; slug: string };
}

export function ModerationGrid({ photos }: { photos: Photo[] }) {
  const router = useRouter();
  const [processing, setProcessing] = useState<Set<string>>(new Set());
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  async function act(photoId: string, action: "approve" | "reject") {
    setProcessing((p) => new Set(p).add(photoId));
    const res = await fetch(`/api/photos/${photoId}/${action}`, {
      method: "POST",
    });
    setProcessing((p) => {
      const next = new Set(p);
      next.delete(photoId);
      return next;
    });
    if (res.ok) {
      setDismissed((d) => new Set(d).add(photoId));
      toast.success(action === "approve" ? "Photo approved" : "Photo rejected");
      router.refresh();
    } else {
      toast.error("Action failed");
    }
  }

  const visible = photos.filter((p) => !dismissed.has(p.id));

  if (visible.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Check className="h-12 w-12 mx-auto mb-4 opacity-30" />
        <p>No photos pending approval.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {visible.map((photo) => (
        <div key={photo.id} className="border rounded-lg overflow-hidden bg-card">
          <div className="aspect-square relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/uploads/${photo.thumbnailPath}`}
              alt={photo.filename}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-3 space-y-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Badge variant="outline" className="text-xs">
                {photo.gallery.name}
              </Badge>
            </div>
            {photo.uploaderName && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <User className="h-3 w-3" />
                {photo.uploaderName}
              </div>
            )}
            <p className="text-xs text-muted-foreground truncate">{photo.filename}</p>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1"
                onClick={() => act(photo.id, "approve")}
                disabled={processing.has(photo.id)}
              >
                <Check className="h-4 w-4 mr-1" /> Approve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="flex-1"
                onClick={() => act(photo.id, "reject")}
                disabled={processing.has(photo.id)}
              >
                <X className="h-4 w-4 mr-1" /> Reject
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
