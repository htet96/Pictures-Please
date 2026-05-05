import { NextRequest, NextResponse } from "next/server";
import { serveFile } from "@/lib/storage";
import path from "path";

type Params = { params: Promise<{ path: string[] }> };

const mimeTypes: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  heic: "image/heic",
};

export async function GET(_req: NextRequest, { params }: Params) {
  const { path: pathParts } = await params;
  const relativePath = pathParts.join("/");

  // Basic security: no path traversal
  const normalized = path.normalize(relativePath);
  if (normalized.startsWith("..") || normalized.includes("../")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const buffer = await serveFile(relativePath);
  if (!buffer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const ext = relativePath.split(".").pop()?.toLowerCase() ?? "jpg";
  const contentType = mimeTypes[ext] ?? "application/octet-stream";

  return new NextResponse(buffer.buffer as ArrayBuffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
