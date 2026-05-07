"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
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
  adminPasswordOnly: boolean;
  slideshowSpeed: number;
  slideshowTransition: string;
  transitionDuration: number;
  backgroundTheme: string;
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
  { value: "zoom", label: "Zoom In" },
  { value: "slide", label: "Slide Right" },
  { value: "blur", label: "Blur Fade" },
  { value: "drop", label: "Drop Down" },
  { value: "rise", label: "Rise Up" },
];

const BG_THEMES = [
  { value: "ember",  label: "Ember",  dark: ["oklch(0.78 0.14 75)", "oklch(0.65 0.10 55)", "oklch(0.72 0.11 40)"] },
  { value: "aurora", label: "Aurora", dark: ["oklch(0.70 0.14 165)", "oklch(0.60 0.12 290)", "oklch(0.65 0.10 145)"] },
  { value: "ocean",  label: "Ocean",  dark: ["oklch(0.65 0.14 225)", "oklch(0.68 0.12 200)", "oklch(0.60 0.11 245)"] },
  { value: "dusk",   label: "Dusk",   dark: ["oklch(0.63 0.14 305)", "oklch(0.68 0.12 335)", "oklch(0.58 0.11 270)"] },
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
    {
      key: "adminPasswordOnly",
      label: "Admin login: password only",
      description: "Remove the username field from the admin login screen.",
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

      {/* Background theme */}
      <div className="space-y-3 rounded-lg border p-4">
        <h3 className="font-medium text-sm">Landing Page Background</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {BG_THEMES.map((theme) => (
            <button
              key={theme.value}
              onClick={() => setForm({ ...form, backgroundTheme: theme.value })}
              className={cn(
                "flex flex-col items-center gap-2 rounded-lg border p-3 transition-all",
                form.backgroundTheme === theme.value
                  ? "border-primary bg-primary/[0.08]"
                  : "border-border bg-muted/20 hover:border-primary/50"
              )}
            >
              {/* Swatch */}
              <div className="relative w-full h-10 rounded overflow-hidden bg-background/50">
                {theme.dark.map((color, i) => (
                  <div
                    key={i}
                    className="absolute rounded-full"
                    style={{
                      width: i === 0 ? "70%" : i === 1 ? "55%" : "45%",
                      height: i === 0 ? "70%" : i === 1 ? "55%" : "45%",
                      background: `radial-gradient(circle, ${color} / 0.6) 0%, transparent 70%)`,
                      top: i === 0 ? "-10%" : i === 1 ? "20%" : "40%",
                      left: i === 0 ? "-5%" : i === 1 ? "40%" : "20%",
                      filter: "blur(8px)",
                    }}
                  />
                ))}
              </div>
              <span className="text-xs font-medium">{theme.label}</span>
            </button>
          ))}
        </div>
      </div>

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
          <Label>Transition Speed</Label>
          <Select
            value={String(form.transitionDuration)}
            onValueChange={(v) => setForm({ ...form, transitionDuration: Number(v) })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[
                { value: 200, label: "Fast (200ms)" },
                { value: 350, label: "Moderate (350ms)" },
                { value: 500, label: "Normal (500ms)" },
                { value: 700, label: "Slow (700ms)" },
                { value: 1000, label: "Very Slow (1s)" },
              ].map((opt) => (
                <SelectItem key={opt.value} value={String(opt.value)}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Transition Animation (Slideshow &amp; Mosaic)</Label>
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
