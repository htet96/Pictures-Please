import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getDataDir } from "@/lib/storage";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const archiver = require("archiver");
import path from "path";
import { PassThrough } from "stream";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { ids } = (await req.json()) as { ids: string[] };
  if (!ids || ids.length === 0) {
    return NextResponse.json({ error: "No photos selected" }, { status: 400 });
  }

  const photos = await prisma.photo.findMany({
    where: { id: { in: ids } },
    select: { originalPath: true, filename: true },
  });

  if (photos.length === 0) {
    return NextResponse.json({ error: "No photos found" }, { status: 404 });
  }

  const dataDir = getDataDir();
  const archive = archiver("zip", { zlib: { level: 1 } });
  const passthrough = new PassThrough();

  archive.pipe(passthrough);

  // Track filenames to avoid duplicates
  const usedNames = new Map<string, number>();
  for (const photo of photos) {
    const absPath = path.join(dataDir, photo.originalPath);
    let name = photo.filename;
    const count = usedNames.get(name) ?? 0;
    if (count > 0) {
      const ext = path.extname(name);
      const base = path.basename(name, ext);
      name = `${base} (${count})${ext}`;
    }
    usedNames.set(photo.filename, count + 1);
    archive.file(absPath, { name });
  }

  archive.finalize();

  const webStream = new ReadableStream({
    start(controller) {
      passthrough.on("data", (chunk: Buffer) => controller.enqueue(chunk));
      passthrough.on("end", () => controller.close());
      passthrough.on("error", (err) => controller.error(err));
    },
  });

  return new Response(webStream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="photos.zip"`,
    },
  });
}
