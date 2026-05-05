"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
}

export function UploadDropzone({ onFileSelected, disabled }: Props) {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setError(null);
      if (acceptedFiles[0]) {
        onFileSelected(acceptedFiles[0]);
      }
    },
    [onFileSelected]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
      "image/gif": [".gif"],
      "image/heic": [".heic"],
    },
    maxSize: 20 * 1024 * 1024,
    maxFiles: 1,
    disabled,
    onDropRejected: (rejections) => {
      const err = rejections[0]?.errors[0];
      if (err?.code === "file-too-large") setError("File must be under 20MB");
      else if (err?.code === "file-invalid-type") setError("Only images are allowed");
      else setError("Invalid file");
    },
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-10 text-center cursor-pointer transition-colors",
        isDragActive
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <input {...getInputProps()} />
      <div className="rounded-full bg-muted p-4">
        {isDragActive ? (
          <ImageIcon className="h-8 w-8 text-primary" />
        ) : (
          <Upload className="h-8 w-8 text-muted-foreground" />
        )}
      </div>
      <div>
        <p className="font-medium">
          {isDragActive ? "Drop your photo here" : "Drag & drop a photo here"}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          or tap to browse your camera roll
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          JPG, PNG, WebP, GIF, HEIC up to 20MB
        </p>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
