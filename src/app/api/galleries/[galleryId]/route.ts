import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { z } from "zod";

type Params = { params: Promise<{ galleryId: string }> };

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  displayMode: z
    .enum(["MASONRY", "GRID", "SLIDESHOW", "CAROUSEL"])
    .optional(),
  password: z.string().optional().nullable(),
  requireApproval: z.boolean().optional(),
  allowUserDelete: z.boolean().optional(),
  allowUserUpload: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  allowWishes: z.boolean().optional(),
});

export async function GET(_req: NextRequest, { params }: Params) {
  const { galleryId } = await params;
  const gallery = await prisma.gallery.findUnique({
    where: { id: galleryId },
    include: { _count: { select: { photos: { where: { status: "APPROVED" } } } } },
  });
  if (!gallery) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ...gallery, hasPassword: !!gallery.password, password: undefined });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session.isAdmin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { galleryId } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { password, ...rest } = parsed.data;

  let updateData: Record<string, unknown> = { ...rest };
  if (password !== undefined) {
    if (password === null || password === "") {
      updateData.password = null;
    } else {
      const bcrypt = await import("bcryptjs");
      updateData.password = await bcrypt.hash(password, 10);
    }
  }

  const gallery = await prisma.gallery.update({
    where: { id: galleryId },
    data: updateData,
  });
  return NextResponse.json({ ...gallery, hasPassword: !!gallery.password, password: undefined });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session.isAdmin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { galleryId } = await params;
  await prisma.gallery.delete({ where: { id: galleryId } });
  return NextResponse.json({ ok: true });
}
