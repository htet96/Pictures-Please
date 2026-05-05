import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

type Params = { params: Promise<{ photoId: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session.isAdmin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { photoId } = await params;
  const photo = await prisma.photo.update({
    where: { id: photoId },
    data: { status: "REJECTED" },
  });
  return NextResponse.json({ photo });
}
