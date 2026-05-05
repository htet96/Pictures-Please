"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface Settings {
  allowUserGalleries: boolean;
  defaultRequireApproval: boolean;
  defaultAllowUserDelete: boolean;
}

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
            checked={form[key as keyof Settings]}
            onCheckedChange={(v) => setForm({ ...form, [key]: v })}
          />
        </div>
      ))}
      <Button onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : "Save Settings"}
      </Button>
    </div>
  );
}
