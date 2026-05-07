import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  const links = await prisma.outgoingLink.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json(links);
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session.isAdmin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body: { label: string; url: string }[] = await req.json();

  await prisma.$transaction([
    prisma.outgoingLink.deleteMany(),
    prisma.outgoingLink.createMany({
      data: body.map((link, i) => ({ label: link.label, url: link.url, order: i })),
    }),
  ]);

  const links = await prisma.outgoingLink.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json(links);
}
