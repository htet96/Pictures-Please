"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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
import { Pencil, Trash2, Check, X, Loader2 } from "lucide-react";
import type { WishData } from "./WishesSection";

interface Props {
  wish: WishData;
  guestToken: string;
  onUpdated: (wish: WishData) => void;
  onDeleted: () => void;
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function WishCard({ wish, guestToken, onUpdated, onDeleted }: Props) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(wish.guestName);
  const [editMessage, setEditMessage] = useState(wish.message);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSave() {
    if (!editName.trim() || !editMessage.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/wishes/${wish.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestToken, guestName: editName.trim(), message: editMessage.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Failed to update wish");
        return;
      }
      const data = await res.json();
      onUpdated(data.wish);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  function handleCancelEdit() {
    setEditName(wish.guestName);
    setEditMessage(wish.message);
    setEditing(false);
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/wishes/${wish.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestToken }),
      });
      if (!res.ok) {
        toast.error("Failed to delete wish");
        return;
      }
      onDeleted();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="rounded-lg border border-border/60 bg-card p-4 space-y-3">
      {editing ? (
        <div className="space-y-3">
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            maxLength={80}
            disabled={saving}
            placeholder="Your name"
          />
          <Textarea
            value={editMessage}
            onChange={(e) => setEditMessage(e.target.value)}
            maxLength={1000}
            rows={4}
            disabled={saving}
            className="resize-none"
            placeholder="Your wish"
          />
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="ghost" onClick={handleCancelEdit} disabled={saving}>
              <X className="h-4 w-4 mr-1" /> Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving || !editName.trim() || !editMessage.trim()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />}
              Save
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium text-sm">{wish.guestName}</p>
              <p className="text-xs text-muted-foreground">{formatRelativeTime(wish.createdAt)}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => setEditing(true)}
                aria-label="Edit wish"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild={false}>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    disabled={deleting}
                    aria-label="Delete wish"
                  >
                    {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete your wish?</AlertDialogTitle>
                    <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
          <p className="text-sm text-foreground whitespace-pre-wrap">{wish.message}</p>
        </>
      )}
    </div>
  );
}
