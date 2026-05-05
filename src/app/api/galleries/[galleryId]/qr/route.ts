import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUploadUrl } from "@/lib/url";
import QRCode from "qrcode";

type Params = { params: Promise<{ galleryId: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { galleryId } = await params;

  const gallery = await prisma.gallery.findUnique({ where: { id: galleryId } });
  if (!gallery) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const uploadUrl = getUploadUrl(req, gallery.slug);
  const svg = await QRCode.toString(uploadUrl, { type: "svg", margin: 2, width: 300 });

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "no-cache",
    },
  });
}
