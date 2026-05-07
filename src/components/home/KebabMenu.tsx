"use client";

import { useState, useRef, useEffect } from "react";
import { MoreVertical, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OutgoingLink {
  id: string;
  label: string;
  url: string;
}

export function KebabMenu({ links }: { links: OutgoingLink[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (links.length === 0) return null;

  return (
    <div ref={ref} className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen((o) => !o)}
        className="text-muted-foreground hover:text-primary"
        aria-label="More links"
      >
        <MoreVertical className="h-4 w-4" />
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-1 min-w-44 bg-card border border-border rounded-md shadow-sharp py-1 z-50">
          {links.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted hover:text-primary transition-colors"
              onClick={() => setOpen(false)}
            >
              <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              {link.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
