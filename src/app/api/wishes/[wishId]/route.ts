import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

type Params = { params: Promise<{ wishId: string }> };

function omitToken<T extends { guestToken: string }>(wish: T): Omit<T, "guestToken"> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { guestToken: _, ...rest } = wish;
  return rest;
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { wishId } = await params;
  const wish = await prisma.wish.findUnique({ where: { id: wishId } });
  if (!wish) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ wish: omitToken(wish) });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { wishId } = await params;
  const wish = await prisma.wish.findUnique({ where: { id: wishId } });
  if (!wish) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { guestToken, guestName, message } = body ?? {};

  if (wish.guestToken !== guestToken)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (typeof guestName !== "string" || guestName.length > 80)
    return NextResponse.json({ error: "Name too long" }, { status: 400 });
  if (!message || typeof message !== "string" || message.trim().length < 1 || message.trim().length > 1000)
    return NextResponse.json({ error: "Message must be 1–1000 characters" }, { status: 400 });

  const updated = await prisma.wish.update({
    where: { id: wishId },
    data: { guestName: guestName.trim(), message: message.trim() },
  });
  return NextResponse.json({ wish: omitToken(updated) });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { wishId } = await params;
  const wish = await prisma.wish.findUnique({ where: { id: wishId } });
  if (!wish) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const session = await getSession();
  if (!session.isAdmin) {
    const body = await req.json().catch(() => ({}));
    if (wish.guestToken !== body?.guestToken)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.wish.delete({ where: { id: wishId } });
  return NextResponse.json({ ok: true });
}
