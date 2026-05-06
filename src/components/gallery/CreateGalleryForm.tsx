"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function CreateGalleryForm({ isAdmin }: { isAdmin: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    password: "",
    requireApproval: true,
    allowUserDelete: false,
    allowUserUpload: true,
    isPublic: true,
  });

  function handleNameChange(name: string) {
    setForm((f) => ({ ...f, name, slug: slugify(name) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.slug) {
      toast.error("Please enter a valid gallery name");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/galleries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        password: form.password || undefined,
        description: form.description || undefined,
      }),
    });
    setLoading(false);
    if (res.ok) {
      const data = await res.json();
      toast.success("Gallery created!");
      router.push(isAdmin ? `/admin/galleries/${data.id}` : `/gallery/${data.slug}`);
    } else {
      const data = await res.json();
      toast.error(data.error ?? "Failed to create gallery");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name">Gallery Name *</Label>
        <Input
          id="name"
          value={form.name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="My Wedding Photos"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">URL Slug</Label>
        <Input
          id="slug"
          value={form.slug}
          onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
          placeholder="my-wedding-photos"
          required
        />
        <p className="text-xs text-muted-foreground">Only lowercase letters, numbers, and hyphens.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Optional description..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password (optional)</Label>
        <Input
          id="password"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          placeholder="Leave blank for no password"
        />
      </div>

      <div className="space-y-3 rounded-lg border p-4">
        <h3 className="font-medium text-sm">Permissions</h3>
        {[
          { key: "requireApproval", label: "Require approval for uploads" },
          { key: "allowUserUpload", label: "Allow public uploads" },
          { key: "allowUserDelete", label: "Allow users to delete photos" },
          { key: "isPublic", label: "Visible on public gallery list" },
        ].map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between">
            <Label htmlFor={key} className="font-normal text-sm">{label}</Label>
            <Switch
              id={key}
              checked={form[key as keyof typeof form] as boolean}
              onCheckedChange={(v) => setForm({ ...form, [key]: v })}
            />
          </div>
        ))}
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Creating..." : "Create Gallery"}
      </Button>
    </form>
  );
}
