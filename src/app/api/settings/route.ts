import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

async function ensureSettings() {
  return prisma.globalSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton" },
    update: {},
  });
}

export async function GET() {
  const settings = await ensureSettings();
  return NextResponse.json(settings);
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session.isAdmin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await ensureSettings();
  const body = await req.json();

  const settings = await prisma.globalSettings.update({
    where: { id: "singleton" },
    data: {
      allowUserGalleries: body.allowUserGalleries,
      defaultRequireApproval: body.defaultRequireApproval,
      defaultAllowUserDelete: body.defaultAllowUserDelete,
      slideshowSpeed: body.slideshowSpeed,
      slideshowTransition: body.slideshowTransition,
      adminPasswordOnly: body.adminPasswordOnly,
    },
  });
  return NextResponse.json(settings);
}
