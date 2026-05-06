"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { QrCode, X } from "lucide-react";

interface Props {
  galleryId: string;
}

export function QRCodeButton({ galleryId }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)} title="Show QR code">
        <QrCode className="h-4 w-4" />
      </Button>

      {open && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-background rounded-xl shadow-xl p-6 max-w-xs w-full space-y-4 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg">Upload QR Code</h2>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Scan to upload photos to this gallery
            </p>
            <div className="flex justify-center">
              <img
                src={`/api/galleries/${galleryId}/qr`}
                alt="Upload QR code"
                className="w-64 h-64 rounded-lg"
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
