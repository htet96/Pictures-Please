"use client";

import { useEffect, useState } from "react";
import { WishForm } from "./WishForm";
import { WishCard } from "./WishCard";
import { Heart } from "lucide-react";

export interface WishData {
  id: string;
  guestName: string;
  message: string;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  galleryId: string;
}

const TOKEN_KEY = "wish_guest_token";
const wishStorageKey = (galleryId: string) => `wish_${galleryId}`;

export function WishesSection({ galleryId }: Props) {
  const [mounted, setMounted] = useState(false);
  const [guestToken, setGuestToken] = useState("");
  const [myWish, setMyWish] = useState<WishData | null>(null);

  useEffect(() => {
    // Get or create the persistent guest token
    let token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      token = crypto.randomUUID();
      localStorage.setItem(TOKEN_KEY, token);
    }
    setGuestToken(token);

    // Check if we have a stored wish for this gallery
    const stored = localStorage.getItem(wishStorageKey(galleryId));
    if (stored) {
      try {
        const parsed: WishData = JSON.parse(stored);
        // Verify the wish still exists on the server
        fetch(`/api/wishes/${parsed.id}`)
          .then((res) => {
            if (res.ok) return res.json();
            // Wish was deleted (e.g. by admin) — clear localStorage
            localStorage.removeItem(wishStorageKey(galleryId));
            return null;
          })
          .then((data) => {
            if (data?.wish) setMyWish(data.wish);
          })
          .catch(() => {
            // Network error — show cached version optimistically
            setMyWish(parsed);
          });
      } catch {
        localStorage.removeItem(wishStorageKey(galleryId));
      }
    }

    setMounted(true);
  }, [galleryId]);

  function handleSubmitted(wish: WishData) {
    localStorage.setItem(wishStorageKey(galleryId), JSON.stringify(wish));
    setMyWish(wish);
  }

  function handleUpdated(wish: WishData) {
    localStorage.setItem(wishStorageKey(galleryId), JSON.stringify(wish));
    setMyWish(wish);
  }

  function handleDeleted() {
    localStorage.removeItem(wishStorageKey(galleryId));
    setMyWish(null);
  }

  // Don't render until mounted to avoid SSR hydration mismatch with localStorage
  if (!mounted) return null;

  return (
    <section className="border-t border-border/60 bg-card/30 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-lg space-y-6">
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-2 text-primary">
            <Heart className="h-5 w-5 fill-current" />
          </div>
          <h2 className="text-xl font-display font-semibold tracking-wide">Well Wishes</h2>
          <p className="text-sm text-muted-foreground">
            {myWish ? "Your wish for the couple" : "Leave a wish for the couple"}
          </p>
        </div>

        {myWish ? (
          <WishCard
            wish={myWish}
            guestToken={guestToken}
            onUpdated={handleUpdated}
            onDeleted={handleDeleted}
          />
        ) : (
          <WishForm
            galleryId={galleryId}
            guestToken={guestToken}
            onSubmitted={handleSubmitted}
          />
        )}
      </div>
    </section>
  );
}
