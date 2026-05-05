import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { processUpload } from "@/lib/image";

type Params = { params: Promise<{ galleryId: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { galleryId } = await params;
  const session = await getSession();
  const searchParams = req.nextUrl.searchParams;
  const statusFilter = searchParams.get("status");

  const gallery = await prisma.gallery.findUnique({ where: { id: galleryId } });
  if (!gallery) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const where: Record<string, unknown> = { galleryId };
  if (session.isAdmin && statusFilter) {
    where.status = statusFilter;
  } else if (!session.isAdmin) {
    where.status = "APPROVED";
  }

  const photos = await prisma.photo.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ photos });
}

export async function POST(req: NextRequest, { params }: Params) {
  const { galleryId } = await params;
  const session = await getSession();

  const gallery = await prisma.gallery.findUnique({ where: { id: galleryId } });
  if (!gallery) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!gallery.allowUserUpload && !session.isAdmin) {
    return NextResponse.json({ error: "Upload not allowed" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const uploaderName = formData.get("uploaderName") as string | null;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
  }

  const maxSize = 20 * 1024 * 1024; // 20MB
  if (file.size > maxSize) {
    return NextResponse.json({ error: "File too large (max 20MB)" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const processed = await processUpload(galleryId, buffer, file.type, file.name);

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const autoApprove = !gallery.requireApproval || session.isAdmin;

  const photo = await prisma.photo.create({
    data: {
      galleryId,
      originalPath: processed.originalPath,
      thumbnailPath: processed.thumbnailPath,
      filename: processed.filename,
      mimeType: processed.mimeType,
      width: processed.width,
      height: processed.height,
      sizeBytes: processed.sizeBytes,
      status: autoApprove ? "APPROVED" : "PENDING",
      uploaderIp: ip,
      uploaderName: uploaderName ?? undefined,
    },
  });

  return NextResponse.json({ photo, status: photo.status }, { status: 201 });
}
