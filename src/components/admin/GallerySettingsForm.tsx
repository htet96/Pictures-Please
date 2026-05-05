"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";

interface GalleryData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  displayMode: string;
  hasPassword: boolean;
  requireApproval: boolean;
  allowUserDelete: boolean;
  allowUserUpload: boolean;
  isPublic: boolean;
}

export function GallerySettingsForm({ gallery }: { gallery: GalleryData }) {
  const router = useRouter();
  const [saving, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: gallery.name,
    description: gallery.description ?? "",
    displayMode: gallery.displayMode,
    password: "",
    removePassword: false,
    requireApproval: gallery.requireApproval,
    allowUserDelete: gallery.allowUserDelete,
    allowUserUpload: gallery.allowUserUpload,
    isPublic: gallery.isPublic,
  });

  async function handleSave() {
    setLoading(true);
    const body: Record<string, unknown> = {
      name: form.name,
      description: form.description || null,
      displayMode: form.displayMode,
      requireApproval: form.requireApproval,
      allowUserDelete: form.allowUserDelete,
      allowUserUpload: form.allowUserUpload,
      isPublic: form.isPublic,
    };

    if (form.removePassword) body.password = null;
    else if (form.password) body.password = form.password;

    const res = await fetch(`/api/galleries/${gallery.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setLoading(false);
    if (res.ok) {
      toast.success("Gallery updated");
      router.refresh();
    } else {
      const data = await res.json();
      toast.error(data.error ?? "Failed to update");
    }
  }

  async function handleDelete() {
    const res = await fetch(`/api/galleries/${gallery.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      toast.success("Gallery deleted");
      router.push("/admin/galleries");
    } else {
      toast.error("Failed to delete gallery");
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Gallery Name</Label>
        <Input
          id="name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">Slug</Label>
        <Input id="slug" value={gallery.slug} disabled className="text-muted-foreground" />
        <p className="text-xs text-muted-foreground">Slug cannot be changed after creation.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>Display Mode</Label>
        <Select
          value={form.displayMode}
          onValueChange={(v) => setForm({ ...form, displayMode: v ?? form.displayMode })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MASONRY">Photos</SelectItem>
            <SelectItem value="GRID">Mosaic</SelectItem>
            <SelectItem value="SLIDESHOW">Slideshow</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">
          {gallery.hasPassword ? "Change Password" : "Set Password (optional)"}
        </Label>
        <Input
          id="password"
          type="password"
          placeholder={gallery.hasPassword ? "Enter new password to change" : "Leave blank for no password"}
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value, removePassword: false })}
        />
        {gallery.hasPassword && (
          <div className="flex items-center gap-2 mt-1">
            <Switch
              id="removePassword"
              checked={form.removePassword}
              onCheckedChange={(v) => setForm({ ...form, removePassword: v, password: "" })}
            />
            <Label htmlFor="removePassword" className="text-sm font-normal">
              Remove password protection
            </Label>
          </div>
        )}
      </div>

      <div className="space-y-4 rounded-lg border p-4">
        <h3 className="font-medium">Permissions</h3>
        {[
          { key: "requireApproval", label: "Require approval for uploads" },
          { key: "allowUserUpload", label: "Allow public uploads" },
          { key: "allowUserDelete", label: "Allow users to delete their photos" },
          { key: "isPublic", label: "Visible on public gallery list" },
        ].map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between">
            <Label htmlFor={key} className="font-normal">{label}</Label>
            <Switch
              id={key}
              checked={form[key as keyof typeof form] as boolean}
              onCheckedChange={(v) => setForm({ ...form, [key]: v })}
            />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-2">
        <AlertDialog>
          <AlertDialogTrigger className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-destructive text-destructive-foreground hover:bg-destructive/90 h-9 px-3">
            <Trash2 className="h-4 w-4" />
            Delete Gallery
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete gallery?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the gallery and all its photos. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
