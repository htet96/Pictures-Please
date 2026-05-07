import path from "path";
import fs from "fs/promises";

const DATA_DIR = path.join(process.cwd(), "data", "uploads");

export function getOriginalPath(galleryId: string, filename: string): string {
  return path.join(DATA_DIR, "originals", galleryId, filename);
}

export function getThumbnailPath(galleryId: string, filename: string): string {
  return path.join(DATA_DIR, "thumbnails", galleryId, filename);
}

export function getRelativeOriginalPath(
  galleryId: string,
  filename: string
): string {
  return `originals/${galleryId}/${filename}`;
}

export function getRelativeThumbnailPath(
  galleryId: string,
  filename: string
): string {
  return `thumbnails/${galleryId}/${filename}`;
}

export async function ensureGalleryDir(galleryId: string) {
  await fs.mkdir(path.join(DATA_DIR, "originals", galleryId), {
    recursive: true,
  });
  await fs.mkdir(path.join(DATA_DIR, "thumbnails", galleryId), {
    recursive: true,
  });
}

export async function saveOriginal(
  galleryId: string,
  filename: string,
  buffer: Buffer
) {
  await ensureGalleryDir(galleryId);
  await fs.writeFile(getOriginalPath(galleryId, filename), buffer);
}

export async function saveThumbnail(
  galleryId: string,
  filename: string,
  buffer: Buffer
) {
  await fs.writeFile(getThumbnailPath(galleryId, filename), buffer);
}

export async function deletePhoto(originalPath: string, thumbnailPath: string) {
  const origAbs = path.join(DATA_DIR, originalPath);
  const thumbAbs = path.join(DATA_DIR, thumbnailPath);
  await Promise.allSettled([
    fs.unlink(origAbs).catch(() => {}),
    fs.unlink(thumbAbs).catch(() => {}),
  ]);
}

export async function serveFile(relativePath: string): Promise<Buffer | null> {
  const absPath = path.join(DATA_DIR, relativePath);
  try {
    return await fs.readFile(absPath);
  } catch {
    return null;
  }
}

export function getWatermarkDir(): string {
  return path.join(DATA_DIR, "watermark");
}

export async function saveWatermarkImage(ext: string, buffer: Buffer): Promise<string> {
  const dir = getWatermarkDir();
  await fs.mkdir(dir, { recursive: true });
  const filename = `watermark.${ext}`;
  await fs.writeFile(path.join(dir, filename), buffer);
  return `watermark/${filename}`;
}

export async function deleteWatermarkImage(relativePath: string): Promise<void> {
  const absPath = path.join(DATA_DIR, relativePath);
  await fs.unlink(absPath).catch(() => {});
}
