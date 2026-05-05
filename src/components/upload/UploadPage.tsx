"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { UploadDropzone } from "./UploadDropzone";
import { ImageEditor } from "./ImageEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, Upload, Pencil, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ItemStatus = "pending" | "uploading" | "done" | "error";

interface QueueItem {
  id: string;
  file: File;
  previewUrl: string;
  edited: Blob | null;
  editedFilename: string | null;
  status: ItemStatus;
}

type View = "dropzone" | "queue" | "editing";

interface Props {
  galleryId: string;
  requireApproval: boolean;
}

export function UploadPage({ galleryId, requireApproval }: Props) {
  const [view, setView] = useState<View>("dropzone");
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploaderName, setUploaderName] = useState("");
  const [allDone, setAllDone] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);

  function handleFilesSelected(files: File[]) {
    const items: QueueItem[] = files.map((file) => ({
      id: Math.random().toString(36).slice(2),
      file,
      previewUrl: URL.createObjectURL(file),
      edited: null,
      editedFilename: null,
      status: "pending",
    }));
    setQueue(items);
    setView("queue");
  }

  function handleEditItem(id: string) {
    setEditingId(id);
    setView("editing");
  }

  function handleEditorConfirm(blob: Blob, filename: string) {
    setQueue((q) =>
      q.map((item) =>
        item.id === editingId
          ? { ...item, edited: blob, editedFilename: filename }
          : item
      )
    );
    setEditingId(null);
    setView("queue");
  }

  function handleEditorCancel() {
    setEditingId(null);
    setView("queue");
  }

  function handleRemoveItem(id: string) {
    setQueue((q) => {
      const updated = q.filter((item) => item.id !== id);
      if (updated.length === 0) {
        setView("dropzone");
      }
      return updated;
    });
  }

  const uploadItem = useCallback(
    async (item: QueueItem, name: string): Promise<boolean> => {
      const blob = item.edited ?? item.file;
      const filename = item.editedFilename ?? item.file.name;
      const formData = new FormData();
      formData.append("file", blob, filename);
      if (name.trim()) formData.append("uploaderName", name.trim());

      const res = await fetch(`/api/galleries/${galleryId}/photos`, {
        method: "POST",
        body: formData,
      });
      return res.ok;
    },
    [galleryId]
  );

  async function handleUploadAll() {
    const pending = queue.filter((item) => item.status === "pending");
    if (pending.length === 0) return;

    let successCount = 0;

    for (const item of pending) {
      setQueue((q) =>
        q.map((i) => (i.id === item.id ? { ...i, status: "uploading" } : i))
      );
      const ok = await uploadItem(item, uploaderName);
      setQueue((q) =>
        q.map((i) =>
          i.id === item.id ? { ...i, status: ok ? "done" : "error" } : i
        )
      );
      if (ok) successCount++;
      else toast.error(`Failed to upload ${item.file.name}`);
    }

    setUploadedCount((c) => c + successCount);
    const allSucceeded = queue.every(
      (i) => i.status === "done" || (i.status === "error" && !pending.find((p) => p.id === i.id))
    );
    const updatedQueue = queue.map((i) => {
      const wasUploading = pending.find((p) => p.id === i.id);
      return wasUploading ? { ...i, status: ("done" as ItemStatus) } : i;
    });
    const anyError = updatedQueue.some((i) => i.status === "error");
    if (!anyError) setAllDone(true);
  }

  function handleReset() {
    setQueue([]);
    setView("dropzone");
    setAllDone(false);
    setUploadedCount(0);
    setUploaderName("");
  }

  // All done screen
  if (allDone) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="flex justify-center">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>
        <h2 className="text-xl font-semibold">
          {uploadedCount} photo{uploadedCount !== 1 ? "s" : ""} uploaded!
        </h2>
        {requireApproval && (
          <p className="text-muted-foreground text-sm">
            Photos are pending approval and will appear once reviewed.
          </p>
        )}
        <Button onClick={handleReset} className="w-full">
          <Upload className="h-4 w-4 mr-2" />
          Upload More Photos
        </Button>
      </div>
    );
  }

  // Editing a single item
  if (view === "editing" && editingId) {
    const item = queue.find((i) => i.id === editingId);
    if (item) {
      return (
        <ImageEditor
          file={item.file}
          onConfirm={handleEditorConfirm}
          onCancel={handleEditorCancel}
        />
      );
    }
  }

  // Queue screen
  if (view === "queue") {
    const allUploading = queue.some((i) => i.status === "uploading");
    const pendingCount = queue.filter((i) => i.status === "pending").length;

    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {queue.map((item) => (
            <div key={item.id} className="relative group rounded-lg overflow-hidden border bg-muted aspect-square">
              <img
                src={item.edited ? URL.createObjectURL(item.edited) : item.previewUrl}
                alt={item.file.name}
                className="w-full h-full object-cover"
              />
              {item.status === "uploading" && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                </div>
              )}
              {item.status === "done" && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-400" />
                </div>
              )}
              {item.status === "error" && (
                <div className="absolute bottom-0 left-0 right-0 bg-destructive/80 text-destructive-foreground text-xs text-center py-1">
                  Failed
                </div>
              )}
              {item.status === "pending" && (
                <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEditItem(item.id)}
                    className="rounded bg-black/60 p-1 text-white hover:bg-black/80"
                    title="Edit photo"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    className="rounded bg-black/60 p-1 text-white hover:bg-black/80"
                    title="Remove"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              {item.edited && item.status === "pending" && (
                <div className="absolute bottom-0 left-0 right-0 bg-primary/80 text-primary-foreground text-xs text-center py-0.5">
                  Edited
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <Label htmlFor="uploaderName">Your name (optional)</Label>
          <Input
            id="uploaderName"
            value={uploaderName}
            onChange={(e) => setUploaderName(e.target.value)}
            placeholder="Leave blank to upload anonymously"
            autoComplete="name"
            disabled={allUploading}
          />
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={allUploading}
            className="flex-1"
          >
            Start Over
          </Button>
          <Button
            onClick={handleUploadAll}
            disabled={allUploading || pendingCount === 0}
            className="flex-1"
          >
            {allUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload {pendingCount > 1 ? `All ${pendingCount}` : "Photo"}
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Dropzone screen
  return (
    <UploadDropzone
      onFilesSelected={handleFilesSelected}
      disabled={false}
    />
  );
}
