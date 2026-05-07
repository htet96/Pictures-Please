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
  backgroundAnimation: string;
  backgroundSpeed: number;
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
  { value: "fade",  label: "Fade" },
  { value: "zoom",  label: "Zoom In" },
  { value: "slide", label: "Slide Right" },
  { value: "blur",  label: "Blur Fade" },
  { value: "drop",  label: "Drop Down" },
  { value: "rise",  label: "Rise Up" },
];

const BG_THEMES = [
  { value: "ember",  label: "Ember",  swatchColors: ["oklch(0.78 0.14 75)", "oklch(0.65 0.10 55)", "oklch(0.72 0.11 40)"] },
  { value: "aurora", label: "Aurora", swatchColors: ["oklch(0.70 0.14 165)", "oklch(0.60 0.12 290)", "oklch(0.65 0.10 145)"] },
  { value: "ocean",  label: "Ocean",  swatchColors: ["oklch(0.65 0.14 225)", "oklch(0.68 0.12 200)", "oklch(0.60 0.11 245)"] },
  { value: "dusk",   label: "Dusk",   swatchColors: ["oklch(0.63 0.14 305)", "oklch(0.68 0.12 335)", "oklch(0.58 0.11 270)"] },
];

const ANIM_OPTIONS = [
  { value: "drift",   label: "Drift",   desc: "Free wandering" },
  { value: "breathe", label: "Breathe", desc: "Gentle pulsing" },
  { value: "float",   label: "Float",   desc: "Vertical rise" },
  { value: "orbit",   label: "Orbit",   desc: "Circular flow" },
];

const SPEED_LABELS: Record<number, string> = {
  1: "Very Slow",
  2: "Slow",
  3: "Normal",
  4: "Fluid",
  5: "Lively",
};

// Maps speed 1-5 to CSS --blob-speed multiplier
const SPEED_MULTIPLIER: Record<number, number> = {
  1: 3.0,
  2: 2.0,
  3: 1.0,
  4: 0.55,
  5: 0.3,
};

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

  const previewSpeedMultiplier = SPEED_MULTIPLIER[form.backgroundSpeed] ?? 1;

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

      {/* ── Background ── */}
      <div className="space-y-5 rounded-lg border p-4">
        <h3 className="font-medium text-sm">Landing Page Background</h3>

        {/* Color theme */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">Color Theme</Label>
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
                {/* Color swatch */}
                <div className="relative w-full h-8 rounded overflow-hidden bg-background/40">
                  {theme.swatchColors.map((color, i) => (
                    <div
                      key={i}
                      className="absolute rounded-full"
                      style={{
                        background: color,
                        opacity: 0.7,
                        width:  i === 0 ? "70%" : i === 1 ? "55%" : "45%",
                        height: i === 0 ? "140%" : i === 1 ? "110%" : "90%",
                        top:    i === 0 ? "-20%" : i === 1 ? "0%"   : "10%",
                        left:   i === 0 ? "-10%" : i === 1 ? "30%"  : "55%",
                        filter: "blur(6px)",
                      }}
                    />
                  ))}
                </div>
                <span className="text-xs font-medium">{theme.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Animation style */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">Animation Style</Label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {ANIM_OPTIONS.map((anim) => (
              <button
                key={anim.value}
                onClick={() => setForm({ ...form, backgroundAnimation: anim.value })}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg border px-3 py-2.5 transition-all text-center",
                  form.backgroundAnimation === anim.value
                    ? "border-primary bg-primary/[0.08]"
                    : "border-border bg-muted/20 hover:border-primary/50"
                )}
              >
                <span className="text-sm font-medium">{anim.label}</span>
                <span className="text-xs text-muted-foreground">{anim.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Speed slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Animation Speed</Label>
            <span className="text-xs font-medium text-foreground">{SPEED_LABELS[form.backgroundSpeed]}</span>
          </div>
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={form.backgroundSpeed}
            onChange={(e) => setForm({ ...form, backgroundSpeed: Number(e.target.value) })}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground/60 px-0.5">
            <span>Very Slow</span>
            <span>Lively</span>
          </div>
        </div>

        {/* Live preview */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">Live Preview</Label>
          <div
            data-preview=""
            data-bg-theme={form.backgroundTheme !== "ember" ? form.backgroundTheme : undefined}
            data-bg-anim={form.backgroundAnimation !== "drift" ? form.backgroundAnimation : undefined}
            style={{
              aspectRatio: "16/9",
              position: "relative",
              overflow: "hidden",
              borderRadius: "0.5rem",
              border: "1px solid var(--border)",
              background: "var(--background)",
              "--blob-speed": previewSpeedMultiplier,
            } as React.CSSProperties}
          >
            <div className="home-blob home-blob-1" />
            <div className="home-blob home-blob-2" />
            <div className="home-blob home-blob-3" />
            {/* Mock page hint */}
            <div className="absolute bottom-3 left-4 right-4 flex flex-col gap-1 pointer-events-none opacity-40">
              <div className="h-1 w-12 bg-primary rounded-full" />
              <div className="h-3 w-24 bg-foreground/15 rounded" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Preview reflects current selections in real time. Actual page may look slightly different at full scale.
          </p>
        </div>
      </div>

      {/* ── Slideshow & Mosaic ── */}
      <div className="space-y-4 rounded-lg border p-4">
        <h3 className="font-medium text-sm">Slideshow &amp; Mosaic Playback</h3>

        <div className="space-y-2">
          <Label>Play Speed</Label>
          <Select
            value={String(form.slideshowSpeed)}
            onValueChange={(v) => setForm({ ...form, slideshowSpeed: Number(v) })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {SPEED_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>
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
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {[
                { value: 200,  label: "Fast (200ms)" },
                { value: 350,  label: "Moderate (350ms)" },
                { value: 500,  label: "Normal (500ms)" },
                { value: 700,  label: "Slow (700ms)" },
                { value: 1000, label: "Very Slow (1s)" },
              ].map((opt) => (
                <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>
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
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {TRANSITION_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
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
