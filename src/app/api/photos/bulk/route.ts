import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { deletePhoto } from "@/lib/storage";

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  const body = await req.json();
  const ids: string[] = Array.isArray(body.ids) ? body.ids : [];

  if (ids.length === 0)
    return NextResponse.json({ error: "No ids provided" }, { status: 400 });

  const photos = await prisma.photo.findMany({
    where: { id: { in: ids } },
    include: { gallery: true },
  });

  // Verify permission for each photo
  for (const photo of photos) {
    if (!session.isAdmin && !photo.gallery.allowUserDelete) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  await Promise.all(photos.map((p) => deletePhoto(p.originalPath, p.thumbnailPath)));
  await prisma.photo.deleteMany({ where: { id: { in: ids } } });

  return NextResponse.json({ ok: true, deleted: photos.length });
}
