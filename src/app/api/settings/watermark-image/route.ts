import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { saveWatermarkImage, deleteWatermarkImage } from "@/lib/storage";

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isAdmin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const formData = await req.formData();
  const file = formData.get("file");
  if (!file || typeof file === "string")
    return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const ext = ALLOWED_TYPES[file.type];
  if (!ext)
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const relativePath = await saveWatermarkImage(ext, buffer);

  const settings = await prisma.globalSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", watermarkImagePath: relativePath },
    update: { watermarkImagePath: relativePath },
  });

  return NextResponse.json({ path: settings.watermarkImagePath });
}

export async function DELETE() {
  const session = await getSession();
  if (!session.isAdmin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const settings = await prisma.globalSettings.findUnique({ where: { id: "singleton" } });
  if (settings?.watermarkImagePath) {
    await deleteWatermarkImage(settings.watermarkImagePath);
  }

  await prisma.globalSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton" },
    update: { watermarkImagePath: null },
  });

  return NextResponse.json({ ok: true });
}
