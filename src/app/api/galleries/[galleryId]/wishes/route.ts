import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

type Params = { params: Promise<{ galleryId: string }> };

function omitToken<T extends { guestToken: string }>(wish: T): Omit<T, "guestToken"> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { guestToken: _, ...rest } = wish;
  return rest;
}

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session.isAdmin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { galleryId } = await params;
  const gallery = await prisma.gallery.findUnique({ where: { id: galleryId } });
  if (!gallery) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const wishes = await prisma.wish.findMany({
    where: { galleryId },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ wishes: wishes.map(omitToken) });
}

export async function POST(req: NextRequest, { params }: Params) {
  const { galleryId } = await params;
  const gallery = await prisma.gallery.findUnique({ where: { id: galleryId } });
  if (!gallery) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!gallery.allowWishes)
    return NextResponse.json({ error: "Wishes are disabled for this gallery" }, { status: 403 });

  const body = await req.json();
  const { guestToken, guestName, message } = body ?? {};

  if (!guestToken || typeof guestToken !== "string" || guestToken.trim() === "")
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  if (typeof guestName !== "string" || guestName.length > 80)
    return NextResponse.json({ error: "Name too long" }, { status: 400 });
  if (!message || typeof message !== "string" || message.trim().length < 1 || message.trim().length > 1000)
    return NextResponse.json({ error: "Message must be 1–1000 characters" }, { status: 400 });

  const existing = await prisma.wish.findFirst({ where: { galleryId, guestToken } });
  if (existing)
    return NextResponse.json({ error: "Already submitted" }, { status: 409 });

  const wish = await prisma.wish.create({
    data: { galleryId, guestToken, guestName: guestName.trim(), message: message.trim() },
  });
  return NextResponse.json({ wish: omitToken(wish) }, { status: 201 });
}
