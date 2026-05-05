"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export function QRCodeDisplay({ galleryId }: { galleryId: string }) {
  const qrUrl = `/api/galleries/${galleryId}/qr`;
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    setDownloading(true);
    const res = await fetch(qrUrl);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gallery-qr-${galleryId}.svg`;
    a.click();
    URL.revokeObjectURL(url);
    setDownloading(false);
  }

  return (
    <div className="flex flex-col items-start gap-4">
      <div className="border rounded-lg p-4 bg-white inline-block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrUrl}
          alt="Upload QR Code"
          className="w-48 h-48 sm:w-64 sm:h-64"
        />
      </div>
      <Button variant="outline" onClick={handleDownload} disabled={downloading}>
        <Download className="h-4 w-4 mr-2" />
        Download QR Code
      </Button>
    </div>
  );
}
