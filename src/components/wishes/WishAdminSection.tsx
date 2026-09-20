"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { Trash2, Heart } from "lucide-react";
import type { WishData } from "./WishesSection";

interface AdminWish extends WishData {
  galleryId: string;
}

interface Props {
  galleryId: string;
  wishes: AdminWish[];
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString();
}

export function WishAdminSection({ wishes: initialWishes }: Props) {
  const router = useRouter();
  const [wishes, setWishes] = useState<AdminWish[]>(initialWishes);

  async function handleDelete(wishId: string) {
    const res = await fetch(`/api/wishes/${wishId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guestToken: "" }),
    });
    if (res.ok) {
      toast.success("Wish deleted");
      setWishes((prev) => prev.filter((w) => w.id !== wishId));
      router.refresh();
    } else {
      toast.error("Failed to delete wish");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Heart className="h-4 w-4 text-primary" />
        <h2 className="text-lg font-semibold">Well Wishes</h2>
        <span className="text-sm text-muted-foreground">({wishes.length})</span>
      </div>

      {wishes.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center border rounded-lg">
          No wishes submitted yet.
        </p>
      ) : (
        <div className="space-y-3">
          {wishes.map((wish) => (
            <div key={wish.id} className="rounded-lg border border-border/60 bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{formatDate(wish.createdAt)}</p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger>
                    <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete wish?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete {wish.guestName}&apos;s wish.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(wish.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              <p className="mt-2 text-sm text-foreground whitespace-pre-wrap">{wish.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
