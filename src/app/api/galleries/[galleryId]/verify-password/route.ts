import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { SessionData, sessionOptions } from "@/lib/session";
import bcrypt from "bcryptjs";

type Params = { params: Promise<{ galleryId: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { galleryId } = await params;
  const { password } = await req.json();

  const gallery = await prisma.gallery.findUnique({ where: { id: galleryId } });
  if (!gallery) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!gallery.password) {
    return NextResponse.json({ ok: true });
  }

  const valid = await bcrypt.compare(password, gallery.password);
  if (!valid) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }

  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  if (!session.galleryAccess) session.galleryAccess = {};
  session.galleryAccess[galleryId] = true;
  await session.save();

  return NextResponse.json({ ok: true });
}
