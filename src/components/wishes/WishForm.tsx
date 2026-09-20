"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Heart, Loader2 } from "lucide-react";
import type { WishData } from "./WishesSection";

interface Props {
  galleryId: string;
  guestToken: string;
  onSubmitted: (wish: WishData) => void;
}

export function WishForm({ galleryId, guestToken, onSubmitted }: Props) {
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/galleries/${galleryId}/wishes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestToken, guestName: "", message: message.trim() }),
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
        <Textarea
          id="wish-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Well wishes, favourite memories with H/A, hopes for the couple etc here! And don’t forget to sign off! 🩵"
          maxLength={1000}
          disabled={submitting}
          required
          className="resize-none min-h-48"
        />
        <p className="text-xs text-muted-foreground text-right">{message.length}/1000</p>
      </div>
      <Button type="submit" disabled={submitting || !message.trim()} className="w-full gap-2">
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className="h-4 w-4" />}
        {submitting ? "Sending…" : "Send Wish"}
      </Button>
    </form>
  );
}
