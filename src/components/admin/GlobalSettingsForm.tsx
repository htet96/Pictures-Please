"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Settings {
  allowUserGalleries: boolean;
  defaultRequireApproval: boolean;
  defaultAllowUserDelete: boolean;
  slideshowSpeed: number;
  slideshowTransition: string;
}

const SPEED_OPTIONS = [
  { value: 2000, label: "2 seconds" },
  { value: 3000, label: "3 seconds" },
  { value: 4000, label: "4 seconds" },
  { value: 5000, label: "5 seconds" },
  { value: 7000, label: "7 seconds" },
  { value: 10000, label: "10 seconds" },
];

const TRANSITION_OPTIONS = [
  { value: "fade", label: "Fade" },
  { value: "zoom", label: "Zoom" },
  { value: "slide", label: "Slide" },
];

export function GlobalSettingsForm({ settings }: { settings: Settings }) {
  const [form, setForm] = useState(settings);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) toast.success("Settings saved");
    else toast.error("Failed to save settings");
  }

  const toggles = [
    {
      key: "allowUserGalleries",
      label: "Allow users to create galleries",
      description: "Any visitor can create a new gallery without admin approval.",
    },
    {
      key: "defaultRequireApproval",
      label: "Default: require photo approval",
      description: "New galleries will require admin approval for uploads by default.",
    },
    {
      key: "defaultAllowUserDelete",
      label: "Default: allow users to delete photos",
      description: "New galleries will allow uploaders to delete their own photos by default.",
    },
  ];

  return (
    <div className="space-y-6">
      {toggles.map(({ key, label, description }) => (
        <div key={key} className="flex items-start justify-between gap-4 pb-4 border-b last:border-0">
          <div>
            <Label htmlFor={key} className="text-sm font-medium">{label}</Label>
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          </div>
          <Switch
            id={key}
            checked={form[key as keyof typeof form] as boolean}
            onCheckedChange={(v) => setForm({ ...form, [key]: v })}
          />
        </div>
      ))}

      <div className="space-y-4 rounded-lg border p-4">
        <h3 className="font-medium text-sm">Slideshow &amp; Mosaic Playback</h3>

        <div className="space-y-2">
          <Label>Play Speed</Label>
          <Select
            value={String(form.slideshowSpeed)}
            onValueChange={(v) => setForm({ ...form, slideshowSpeed: Number(v) })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SPEED_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={String(opt.value)}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Transition Animation (Slideshow)</Label>
          <Select
            value={form.slideshowTransition}
            onValueChange={(v) => setForm({ ...form, slideshowTransition: v ?? form.slideshowTransition })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TRANSITION_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : "Save Settings"}
      </Button>
    </div>
  );
}
