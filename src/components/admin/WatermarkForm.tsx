"use client";

import { useState, useRef } from "react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { RotateCcw, Upload, X } from "lucide-react";

interface WatermarkSettings {
  watermarkEnabled: boolean;
  watermarkType: string;
  watermarkText: string;
  watermarkImagePath: string | null;
  watermarkOpacity: number;
  watermarkX: number;
  watermarkY: number;
  watermarkRotation: number;
  watermarkSize: number;
}

const POSITION_PRESETS = [
  { x: 5,  y: 10, label: "Top left" },
  { x: 50, y: 10, label: "Top center" },
  { x: 95, y: 10, label: "Top right" },
  { x: 5,  y: 50, label: "Middle left" },
  { x: 50, y: 50, label: "Center" },
  { x: 95, y: 50, label: "Middle right" },
  { x: 5,  y: 90, label: "Bottom left" },
  { x: 50, y: 90, label: "Bottom center" },
  { x: 95, y: 90, label: "Bottom right" },
];

function matchesPreset(x: number, y: number) {
  return POSITION_PRESETS.findIndex((p) => p.x === x && p.y === y);
}

function renderMarkdown(text: string): ReactNode[] {
  const lines = text.split("\n");
  return lines.flatMap((line, lineIdx) => {
    const tokens = line.split(/(\*\*[^*\n]+\*\*|\*[^*\n]+\*)/g);
    const parts: ReactNode[] = tokens.map((token, i) => {
      if (token.startsWith("**") && token.endsWith("**"))
        return <strong key={`${lineIdx}-${i}`}>{token.slice(2, -2)}</strong>;
      if (token.startsWith("*") && token.endsWith("*"))
        return <em key={`${lineIdx}-${i}`}>{token.slice(1, -1)}</em>;
      return token;
    });
    if (lineIdx < lines.length - 1) parts.push(<br key={`br-${lineIdx}`} />);
    return parts;
  });
}

export function WatermarkForm({ settings: initial }: { settings: WatermarkSettings }) {
  const [s, setS] = useState<WatermarkSettings>(initial);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    initial.watermarkImagePath ? `/api/uploads/${initial.watermarkImagePath}` : null
  );
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function set<K extends keyof WatermarkSettings>(key: K, value: WatermarkSettings[K]) {
    setS((prev) => ({ ...prev, [key]: value }));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  }

  async function handleRemoveImage() {
    await fetch("/api/settings/watermark-image", { method: "DELETE" });
    setPendingFile(null);
    setPreviewUrl(null);
    set("watermarkImagePath", null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSave() {
    setSaving(true);
    try {
      let imagePath = s.watermarkImagePath;

      if (s.watermarkType === "image" && pendingFile) {
        const formData = new FormData();
        formData.append("file", pendingFile);
        const res = await fetch("/api/settings/watermark-image", { method: "POST", body: formData });
        if (!res.ok) throw new Error("Image upload failed");
        const data = await res.json();
        imagePath = data.path;
      }

      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...s, watermarkImagePath: imagePath }),
      });
      if (!res.ok) throw new Error("Save failed");
      setS((prev) => ({ ...prev, watermarkImagePath: imagePath }));
      setPendingFile(null);
      toast.success("Watermark settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  const activePresetIdx = matchesPreset(s.watermarkX, s.watermarkY);

  const watermarkStyle: React.CSSProperties = {
    position: "absolute",
    left: `${s.watermarkX}%`,
    top: `${s.watermarkY}%`,
    transform: `translate(-50%, -50%) rotate(${s.watermarkRotation}deg)`,
    opacity: s.watermarkOpacity / 100,
    pointerEvents: "none",
    userSelect: "none",
  };

  return (
    <div className="flex gap-6 h-full flex-col lg:flex-row">
      {/* ── Controls ── */}
      <div className="w-full lg:w-[380px] shrink-0 space-y-6">

        {/* Enable toggle */}
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base font-medium">Enable Watermark</Label>
            <p className="text-xs text-muted-foreground mt-0.5">Show watermark on the landing page</p>
          </div>
          <Switch
            checked={s.watermarkEnabled}
            onCheckedChange={(v) => set("watermarkEnabled", v)}
          />
        </div>

        <div className={cn("space-y-6", !s.watermarkEnabled && "opacity-40 pointer-events-none")}>

          {/* Type tabs */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Watermark Type</Label>
            <div className="flex gap-1 p-1 bg-muted rounded-md">
              {(["text", "image"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => set("watermarkType", type)}
                  className={cn(
                    "flex-1 py-1.5 text-sm rounded-sm transition-colors capitalize",
                    s.watermarkType === type
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Text editor */}
          {s.watermarkType === "text" && (
            <div>
              <Label htmlFor="wm-text" className="text-sm font-medium mb-2 block">Text Content</Label>
              <textarea
                id="wm-text"
                value={s.watermarkText}
                onChange={(e) => set("watermarkText", e.target.value)}
                rows={5}
                placeholder="PICTURES"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono resize-y focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Supports <code className="font-mono">**bold**</code>, <code className="font-mono">*italic*</code>, and line breaks.
              </p>
            </div>
          )}

          {/* Image upload */}
          {s.watermarkType === "image" && (
            <div>
              <Label className="text-sm font-medium mb-2 block">Image</Label>
              {previewUrl ? (
                <div className="relative inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Watermark preview"
                    className="max-h-32 max-w-full rounded border border-border object-contain bg-muted"
                  />
                  <button
                    onClick={handleRemoveImage}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5 hover:opacity-80"
                    title="Remove image"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-6 w-full border border-dashed border-border rounded-md text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  Click to upload image
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleFileChange}
              />
              {previewUrl && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 text-xs text-muted-foreground hover:text-primary underline-offset-2 hover:underline"
                >
                  Replace image
                </button>
              )}
            </div>
          )}

          {/* Opacity */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium">Opacity</Label>
              <span className="text-sm text-muted-foreground">{s.watermarkOpacity}%</span>
            </div>
            <input
              type="range" min={0} max={30} value={s.watermarkOpacity}
              onChange={(e) => set("watermarkOpacity", +e.target.value)}
              className="w-full accent-primary"
            />
          </div>

          {/* Size */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium">Size</Label>
              <span className="text-sm text-muted-foreground">
                {s.watermarkSize}{s.watermarkType === "text" ? "vw" : "%"}
              </span>
            </div>
            <input
              type="range" min={4} max={40} value={s.watermarkSize}
              onChange={(e) => set("watermarkSize", +e.target.value)}
              className="w-full accent-primary"
            />
          </div>

          {/* Rotation */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium">Rotation</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{s.watermarkRotation}°</span>
                <button
                  onClick={() => set("watermarkRotation", -90)}
                  className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                  title="Reset to -90°"
                >
                  <RotateCcw className="h-3 w-3" />
                </button>
              </div>
            </div>
            <input
              type="range" min={-180} max={180} value={s.watermarkRotation}
              onChange={(e) => set("watermarkRotation", +e.target.value)}
              className="w-full accent-primary"
            />
          </div>

          {/* Position grid */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Position</Label>
            <div className="grid grid-cols-3 gap-1.5 w-fit">
              {POSITION_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  title={preset.label}
                  onClick={() => { set("watermarkX", preset.x); set("watermarkY", preset.y); }}
                  className={cn(
                    "w-10 h-10 rounded border flex items-center justify-center transition-colors",
                    activePresetIdx === idx
                      ? "border-primary bg-primary/10"
                      : "border-border bg-muted/30 hover:border-primary/50"
                  )}
                >
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    activePresetIdx === idx ? "bg-primary" : "bg-muted-foreground/40"
                  )} />
                </button>
              ))}
            </div>
            <div className="flex gap-4 mt-3">
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">X</Label>
                <input
                  type="number" min={0} max={100} value={s.watermarkX}
                  onChange={(e) => set("watermarkX", Math.max(0, Math.min(100, +e.target.value)))}
                  className="w-16 rounded border border-border bg-background px-2 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">Y</Label>
                <input
                  type="number" min={0} max={100} value={s.watermarkY}
                  onChange={(e) => set("watermarkY", Math.max(0, Math.min(100, +e.target.value)))}
                  className="w-16 rounded border border-border bg-background px-2 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? "Saving…" : "Save Watermark Settings"}
        </Button>
      </div>

      {/* ── Preview ── */}
      <div className="flex-1 min-w-0">
        <Label className="text-sm font-medium mb-2 block">Live Preview</Label>
        <div
          className="relative w-full overflow-hidden rounded-lg border border-border bg-background"
          style={{ aspectRatio: "16/9" }}
        >
          {/* Static blob hints */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute", borderRadius: "50%",
              width: "60%", height: "60%", top: "-15%", left: "-12%",
              background: "radial-gradient(circle, var(--blob-1, oklch(0.78 0.14 75 / 0.09)) 0%, transparent 65%)",
              filter: "blur(40px)",
            }}
          />
          <div
            aria-hidden="true"
            style={{
              position: "absolute", borderRadius: "50%",
              width: "50%", height: "50%", top: "25%", right: "-12%",
              background: "radial-gradient(circle, var(--blob-2, oklch(0.65 0.10 55 / 0.06)) 0%, transparent 65%)",
              filter: "blur(40px)",
            }}
          />

          {/* Watermark */}
          {s.watermarkEnabled && (
            s.watermarkType === "image" && previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt=""
                src={previewUrl}
                style={{ ...watermarkStyle, width: `${s.watermarkSize}%`, objectFit: "contain" }}
              />
            ) : s.watermarkType === "text" && s.watermarkText ? (
              <span
                className="font-display leading-none font-bold whitespace-nowrap"
                style={{
                  ...watermarkStyle,
                  fontSize: `${s.watermarkSize * 0.4}cqw`,
                  color: "currentColor",
                }}
              >
                {renderMarkdown(s.watermarkText)}
              </span>
            ) : null
          )}

          {/* Mock page content */}
          <div className="absolute bottom-4 left-6 right-6 flex flex-col gap-1.5 pointer-events-none">
            <div className="h-1.5 w-16 bg-primary/50 rounded-full" />
            <div className="h-4 w-32 bg-foreground/10 rounded" />
            <div className="h-1 w-8 bg-primary/30 rounded-full mt-0.5" />
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Preview uses a simplified layout. Actual appearance may vary slightly.
        </p>
      </div>
    </div>
  );
}
