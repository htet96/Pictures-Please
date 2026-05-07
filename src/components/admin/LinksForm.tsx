"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, GripVertical } from "lucide-react";

interface LinkEntry {
  id: string;
  label: string;
  url: string;
}

function newEntry(): LinkEntry {
  return { id: crypto.randomUUID(), label: "", url: "" };
}

export function LinksForm({ initialLinks }: { initialLinks: LinkEntry[] }) {
  const [links, setLinks] = useState<LinkEntry[]>(
    initialLinks.length > 0 ? initialLinks : []
  );
  const [saving, setSaving] = useState(false);

  function addLink() {
    setLinks((prev) => [...prev, newEntry()]);
  }

  function removeLink(id: string) {
    setLinks((prev) => prev.filter((l) => l.id !== id));
  }

  function updateLink(id: string, field: "label" | "url", value: string) {
    setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, [field]: value } : l)));
  }

  function moveUp(idx: number) {
    if (idx === 0) return;
    setLinks((prev) => {
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  }

  function moveDown(idx: number) {
    setLinks((prev) => {
      if (idx === prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  }

  async function handleSave() {
    const valid = links.filter((l) => l.label.trim() && l.url.trim());
    setSaving(true);
    try {
      const res = await fetch("/api/links", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(valid.map(({ label, url }) => ({ label, url }))),
      });
      if (!res.ok) throw new Error();
      setLinks(valid);
      toast.success("Links saved");
    } catch {
      toast.error("Failed to save links");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {links.length === 0 && (
        <p className="text-sm text-muted-foreground py-4 text-center border border-dashed border-border rounded-md">
          No links yet. Add one below.
        </p>
      )}

      {links.map((link, idx) => (
        <div key={link.id} className="flex gap-2 items-start group">
          {/* Reorder handle / arrows */}
          <div className="flex flex-col gap-0.5 pt-7 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => moveUp(idx)}
              disabled={idx === 0}
              className="text-muted-foreground hover:text-foreground disabled:opacity-20 p-0.5"
              title="Move up"
            >
              <GripVertical className="h-3 w-3 rotate-0" />
            </button>
          </div>

          <div className="flex-1 space-y-2">
            <div>
              <Label className="text-xs text-muted-foreground">Label</Label>
              <Input
                value={link.label}
                onChange={(e) => updateLink(link.id, "label", e.target.value)}
                placeholder="e.g. My Portfolio"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">URL</Label>
              <Input
                value={link.url}
                onChange={(e) => updateLink(link.id, "url", e.target.value)}
                placeholder="https://example.com"
                type="url"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1 pt-7">
            <button
              onClick={() => removeLink(link.id)}
              className="text-muted-foreground hover:text-destructive transition-colors p-1"
              title="Remove"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}

      <div className="flex gap-3 pt-2">
        <Button variant="outline" size="sm" onClick={addLink} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Add Link
        </Button>
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
}
