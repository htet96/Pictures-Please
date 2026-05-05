"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Cropper, { ReactCropperElement } from "react-cropper";
import "cropperjs/dist/cropper.css";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  RotateCcw,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Check,
  X,
} from "lucide-react";

const FILTERS = [
  { name: "Normal", value: "" },
  { name: "Grayscale", value: "grayscale(100%)" },
  { name: "Sepia", value: "sepia(100%)" },
  { name: "Warm", value: "saturate(150%) hue-rotate(-10deg)" },
  { name: "Cool", value: "saturate(120%) hue-rotate(20deg)" },
  { name: "Fade", value: "opacity(80%) saturate(80%)" },
  { name: "Vivid", value: "saturate(200%) contrast(110%)" },
];

interface Props {
  file: File;
  onConfirm: (blob: Blob, filename: string) => void;
  onCancel: () => void;
}

export function ImageEditor({ file, onConfirm, onCancel }: Props) {
  const cropperRef = useRef<ReactCropperElement>(null);
  const [filter, setFilter] = useState("");
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [imageSrc] = useState(() => URL.createObjectURL(file));

  useEffect(() => {
    return () => URL.revokeObjectURL(imageSrc);
  }, [imageSrc]);

  const combinedFilter = [
    filter,
    brightness !== 100 ? `brightness(${brightness}%)` : "",
    contrast !== 100 ? `contrast(${contrast}%)` : "",
    saturation !== 100 ? `saturate(${saturation}%)` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const handleConfirm = useCallback(() => {
    const cropper = cropperRef.current?.cropper;
    if (!cropper) return;

    const canvas = cropper.getCroppedCanvas({ maxWidth: 3000, maxHeight: 3000 });
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new window.Image();
    img.onload = () => {
      const finalCanvas = document.createElement("canvas");
      finalCanvas.width = canvas.width;
      finalCanvas.height = canvas.height;
      const fCtx = finalCanvas.getContext("2d")!;
      fCtx.filter = combinedFilter || "none";
      fCtx.drawImage(img, 0, 0);
      finalCanvas.toBlob(
        (blob) => {
          if (blob) onConfirm(blob, file.name.replace(/\.[^.]+$/, ".jpg"));
        },
        "image/jpeg",
        0.92
      );
    };
    img.src = canvas.toDataURL("image/jpeg", 0.92);
  }, [combinedFilter, file.name, onConfirm]);

  return (
    <div className="flex flex-col gap-4">
      <Tabs defaultValue="crop">
        <TabsList className="w-full">
          <TabsTrigger value="crop" className="flex-1">Crop & Rotate</TabsTrigger>
          <TabsTrigger value="adjust" className="flex-1">Adjust</TabsTrigger>
          <TabsTrigger value="filter" className="flex-1">Filters</TabsTrigger>
        </TabsList>

        <TabsContent value="crop" className="space-y-3">
          <div className="rounded-lg overflow-hidden border bg-black max-h-64 sm:max-h-96">
            <Cropper
              ref={cropperRef}
              src={imageSrc}
              style={{ height: "100%", maxHeight: "384px", width: "100%" }}
              guides
              viewMode={1}
              responsive
              autoCropArea={1}
              checkOrientation={false}
            />
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => cropperRef.current?.cropper.rotate(-90)}
            >
              <RotateCcw className="h-4 w-4 mr-1" /> 90°
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => cropperRef.current?.cropper.rotate(90)}
            >
              <RotateCw className="h-4 w-4 mr-1" /> 90°
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => cropperRef.current?.cropper.scaleX(-1)}
            >
              <FlipHorizontal className="h-4 w-4 mr-1" /> Flip H
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => cropperRef.current?.cropper.scaleY(-1)}
            >
              <FlipVertical className="h-4 w-4 mr-1" /> Flip V
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="adjust" className="space-y-4">
          <div className="rounded-lg overflow-hidden border bg-black" style={{ maxHeight: "300px" }}>
            <img
              src={imageSrc}
              alt="Preview"
              className="w-full h-full object-contain"
              style={{ filter: combinedFilter || "none", maxHeight: "300px" }}
            />
          </div>
          {[
            { label: "Brightness", value: brightness, setter: setBrightness, min: 20, max: 200 },
            { label: "Contrast", value: contrast, setter: setContrast, min: 20, max: 200 },
            { label: "Saturation", value: saturation, setter: setSaturation, min: 0, max: 200 },
          ].map(({ label, value, setter, min, max }) => (
            <div key={label} className="space-y-1">
              <div className="flex justify-between text-sm">
                <Label>{label}</Label>
                <span className="text-muted-foreground">{value}%</span>
              </div>
              <input
                type="range"
                min={min}
                max={max}
                value={value}
                onChange={(e) => setter(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
          ))}
          <Button variant="ghost" size="sm" onClick={() => { setBrightness(100); setContrast(100); setSaturation(100); }}>
            Reset adjustments
          </Button>
        </TabsContent>

        <TabsContent value="filter" className="space-y-4">
          <div className="rounded-lg overflow-hidden border bg-black" style={{ maxHeight: "200px" }}>
            <img
              src={imageSrc}
              alt="Preview"
              className="w-full h-full object-contain"
              style={{ filter: combinedFilter || "none", maxHeight: "200px" }}
            />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.name}
                onClick={() => setFilter(f.value)}
                className={`flex flex-col items-center gap-1 rounded-lg overflow-hidden border-2 transition-colors ${
                  filter === f.value ? "border-primary" : "border-transparent"
                }`}
              >
                <img
                  src={imageSrc}
                  alt={f.name}
                  className="w-full aspect-square object-cover"
                  style={{ filter: f.value || "none" }}
                />
                <span className="text-xs pb-1">{f.name}</span>
              </button>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex gap-3 pt-2 border-t">
        <Button variant="outline" className="flex-1" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" /> Cancel
        </Button>
        <Button className="flex-1" onClick={handleConfirm}>
          <Check className="h-4 w-4 mr-2" /> Apply & Upload
        </Button>
      </div>
    </div>
  );
}
