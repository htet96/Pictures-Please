import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serveFile } from "@/lib/storage";

type Params = { params: Promise<{ photoId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { photoId } = await params;

  const photo = await prisma.photo.findUnique({ where: { id: photoId } });
  if (!photo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const buffer = await serveFile(photo.originalPath);
  if (!buffer) return NextResponse.json({ error: "File not found" }, { status: 404 });

  const filename = encodeURIComponent(photo.filename);
  return new NextResponse(buffer.buffer as ArrayBuffer, {
    headers: {
      "Content-Type": photo.mimeType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
