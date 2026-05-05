"use client";

import { useState } from "react";
import { toast } from "sonner";
import { UploadDropzone } from "./UploadDropzone";
import { ImageEditor } from "./ImageEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, Upload } from "lucide-react";

type Step = "dropzone" | "editor" | "name" | "uploading" | "done";

interface Props {
  galleryId: string;
  requireApproval: boolean;
}

export function UploadPage({ galleryId, requireApproval }: Props) {
  const [step, setStep] = useState<Step>("dropzone");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [editedBlob, setEditedBlob] = useState<{ blob: Blob; filename: string } | null>(null);
  const [uploaderName, setUploaderName] = useState("");
  const [uploadCount, setUploadCount] = useState(0);

  function handleFileSelected(file: File) {
    setSelectedFile(file);
    setStep("editor");
  }

  function handleEditorConfirm(blob: Blob, filename: string) {
    setEditedBlob({ blob, filename });
    setStep("name");
  }

  function handleEditorCancel() {
    setSelectedFile(null);
    setStep("dropzone");
  }

  async function handleUpload() {
    if (!editedBlob) return;
    setStep("uploading");

    const formData = new FormData();
    formData.append("file", editedBlob.blob, editedBlob.filename);
    if (uploaderName.trim()) {
      formData.append("uploaderName", uploaderName.trim());
    }

    const res = await fetch(`/api/galleries/${galleryId}/photos`, {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      setUploadCount((c) => c + 1);
      setStep("done");
    } else {
      const data = await res.json();
      toast.error(data.error ?? "Upload failed");
      setStep("name");
    }
  }

  function handleUploadAnother() {
    setSelectedFile(null);
    setEditedBlob(null);
    setUploaderName("");
    setStep("dropzone");
  }

  if (step === "done") {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="flex justify-center">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>
        <h2 className="text-xl font-semibold">Photo uploaded!</h2>
        {requireApproval && (
          <p className="text-muted-foreground text-sm">
            Your photo is pending approval and will appear in the gallery once reviewed.
          </p>
        )}
        {uploadCount > 0 && (
          <p className="text-sm text-muted-foreground">
            {uploadCount} photo{uploadCount !== 1 ? "s" : ""} uploaded this session
          </p>
        )}
        <Button onClick={handleUploadAnother} className="w-full">
          <Upload className="h-4 w-4 mr-2" />
          Upload Another Photo
        </Button>
      </div>
    );
  }

  if (step === "editor" && selectedFile) {
    return (
      <ImageEditor
        file={selectedFile}
        onConfirm={handleEditorConfirm}
        onCancel={handleEditorCancel}
      />
    );
  }

  if (step === "name") {
    return (
      <div className="space-y-6">
        {editedBlob && (
          <div className="rounded-lg overflow-hidden border">
            <img
              src={URL.createObjectURL(editedBlob.blob)}
              alt="Preview"
              className="w-full max-h-64 object-contain bg-black"
            />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="name">Your name (optional)</Label>
          <Input
            id="name"
            value={uploaderName}
            onChange={(e) => setUploaderName(e.target.value)}
            placeholder="Leave blank to upload anonymously"
            autoComplete="name"
          />
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => {
            setEditedBlob(null);
            setStep("editor");
          }}>
            Back to Editor
          </Button>
          <Button className="flex-1" onClick={handleUpload}>
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </Button>
        </div>
      </div>
    );
  }

  return (
    <UploadDropzone
      onFileSelected={handleFileSelected}
      disabled={step === "uploading"}
    />
  );
}
