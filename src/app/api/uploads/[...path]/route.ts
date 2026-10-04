import { NextRequest, NextResponse } from "next/server";
import { getDataDir } from "@/lib/storage";
import path from "path";
import fs from "fs";
import { stat } from "fs/promises";
import { Readable } from "stream";

type Params = { params: Promise<{ path: string[] }> };

const mimeTypes: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  heic: "image/heic",
};

export async function GET(req: NextRequest, { params }: Params) {
  const { path: pathParts } = await params;
  const relativePath = pathParts.join("/");

  // Basic security: no path traversal
  const normalized = path.normalize(relativePath);
  if (normalized.startsWith("..") || normalized.includes("../")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const absPath = path.join(getDataDir(), relativePath);

  // ETag based on the path — files are immutable (cuid-named, written once).
  const etag = `"${Buffer.from(relativePath).toString("base64")}"`;
  if (req.headers.get("if-none-match") === etag) {
    return new NextResponse(null, { status: 304 });
  }

  let fileStat: Awaited<ReturnType<typeof stat>>;
  try {
    fileStat = await stat(absPath);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ext = relativePath.split(".").pop()?.toLowerCase() ?? "jpg";
  const contentType = mimeTypes[ext] ?? "application/octet-stream";

  const nodeStream = fs.createReadStream(absPath);
  const webStream = Readable.toWeb(nodeStream) as ReadableStream;

  return new NextResponse(webStream, {
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(fileStat.size),
      "Cache-Control": "public, max-age=31536000, immutable",
      "ETag": etag,
    },
  });
}
