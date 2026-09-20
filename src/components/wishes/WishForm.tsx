"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Heart, Loader2 } from "lucide-react";
import type { WishData } from "./WishesSection";

interface Props {
  galleryId: string;
  guestToken: string;
  onSubmitted: (wish: WishData) => void;
}

export function WishForm({ galleryId, guestToken, onSubmitted }: Props) {
  const [guestName, setGuestName] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!guestName.trim() || !message.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/galleries/${galleryId}/wishes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestToken, guestName: guestName.trim(), message: message.trim() }),
      });
      if (res.status === 409) {
        toast.error("You've already left a wish from this device");
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Failed to submit wish");
        return;
      }
      const data = await res.json();
      toast.success("Your wish has been added!");
      onSubmitted(data.wish);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="wish-name">Your name</Label>
        <Input
          id="wish-name"
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          placeholder="Enter your name"
          maxLength={80}
          disabled={submitting}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="wish-message">Your wish</Label>
        <Textarea
          id="wish-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Leave a message for the couple…"
          maxLength={1000}
          rows={4}
          disabled={submitting}
          required
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground text-right">{message.length}/1000</p>
      </div>
      <Button type="submit" disabled={submitting || !guestName.trim() || !message.trim()} className="w-full gap-2">
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className="h-4 w-4" />}
        {submitting ? "Sending…" : "Send Wish"}
      </Button>
    </form>
  );
}
