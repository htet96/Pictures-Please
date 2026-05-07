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

  const data: Record<string, unknown> = {};
  if (body.allowUserGalleries !== undefined) data.allowUserGalleries = body.allowUserGalleries;
  if (body.defaultRequireApproval !== undefined) data.defaultRequireApproval = body.defaultRequireApproval;
  if (body.defaultAllowUserDelete !== undefined) data.defaultAllowUserDelete = body.defaultAllowUserDelete;
  if (body.slideshowSpeed !== undefined) data.slideshowSpeed = body.slideshowSpeed;
  if (body.slideshowTransition !== undefined) data.slideshowTransition = body.slideshowTransition;
  if (body.transitionDuration !== undefined) data.transitionDuration = body.transitionDuration;
  if (body.adminPasswordOnly !== undefined) data.adminPasswordOnly = body.adminPasswordOnly;
  if (body.watermarkEnabled !== undefined) data.watermarkEnabled = body.watermarkEnabled;
  if (body.watermarkType !== undefined) data.watermarkType = body.watermarkType;
  if (body.watermarkText !== undefined) data.watermarkText = body.watermarkText;
  if (body.watermarkImagePath !== undefined) data.watermarkImagePath = body.watermarkImagePath;
  if (body.watermarkOpacity !== undefined) data.watermarkOpacity = body.watermarkOpacity;
  if (body.watermarkX !== undefined) data.watermarkX = body.watermarkX;
  if (body.watermarkY !== undefined) data.watermarkY = body.watermarkY;
  if (body.watermarkRotation !== undefined) data.watermarkRotation = body.watermarkRotation;
  if (body.watermarkSize !== undefined) data.watermarkSize = body.watermarkSize;
  if (body.linksPublic !== undefined) data.linksPublic = body.linksPublic;
  if (body.backgroundTheme !== undefined) data.backgroundTheme = body.backgroundTheme;

  const settings = await prisma.globalSettings.update({
    where: { id: "singleton" },
    data,
  });
  return NextResponse.json(settings);
}
