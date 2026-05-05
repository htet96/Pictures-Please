"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
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
  photo: Photo;
  onClick: () => void;
  canDelete?: boolean;
  square?: boolean;
}

export function PhotoCard({ photo, onClick, canDelete, square }: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Delete this photo?")) return;
    setDeleting(true);
    const res = await fetch(`/api/photos/${photo.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Photo deleted");
      router.refresh();
    } else {
      toast.error("Failed to delete photo");
    }
    setDeleting(false);
  }

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-lg bg-muted cursor-pointer",
        "transition-transform duration-200 hover:scale-[1.01]"
      )}
      onClick={onClick}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/api/uploads/${photo.thumbnailPath}`}
        alt={photo.filename}
        loading="lazy"
        decoding="async"
        className={cn(
          "w-full object-cover transition-opacity duration-300",
          square ? "h-full" : "h-auto"
        )}
      />
      {canDelete && (
        <button
          onClick={handleDelete}
          disabled={deleting}
          className={cn(
            "absolute top-2 right-2 rounded-full p-1.5 bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity",
            "hover:bg-red-600 focus:opacity-100"
          )}
          aria-label="Delete photo"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
