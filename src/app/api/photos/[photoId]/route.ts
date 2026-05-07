import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { deletePhoto } from "@/lib/storage";

type Params = { params: Promise<{ photoId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { photoId } = await params;

  const photo = await prisma.photo.findUnique({
    where: { id: photoId },
    select: { id: true, thumbnailPath: true, status: true },
  });
  if (!photo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ photo });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { photoId } = await params;
  const session = await getSession();

  const photo = await prisma.photo.findUnique({
    where: { id: photoId },
    include: { gallery: true },
  });
  if (!photo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!session.isAdmin && !photo.gallery.allowUserDelete) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await deletePhoto(photo.originalPath, photo.thumbnailPath);
  await prisma.photo.delete({ where: { id: photoId } });

  return NextResponse.json({ ok: true });
}
