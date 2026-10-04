"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  title: React.ReactNode;
  actions?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function CollapsibleSection({ title, actions, defaultOpen = true, children }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 w-full text-left group"
      >
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform duration-200",
            !open && "-rotate-90"
          )}
        />
        <div className="flex-1 flex items-center gap-2">{title}</div>
        {actions && (
          <div onClick={(e) => e.stopPropagation()}>{actions}</div>
        )}
      </button>
      {open && <div className="mt-4">{children}</div>}
    </div>
  );
}
