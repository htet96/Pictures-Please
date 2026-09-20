import sharp from "sharp";
import { createId } from "@paralleldrive/cuid2";
import {
  saveOriginal,
  saveThumbnail,
  getRelativeOriginalPath,
  getRelativeThumbnailPath,
} from "./storage";

export interface ProcessedImage {
  filename: string;
  originalPath: string;
  thumbnailPath: string;
  width: number;
  height: number;
  mimeType: string;
  sizeBytes: number;
}

export async function processUpload(
  galleryId: string,
  buffer: Buffer,
  originalMimeType: string,
  originalFilename: string
): Promise<ProcessedImage> {
  // GIFs: preserve animation — skip EXIF rotation (GIFs have none), store original as-is,
  // generate animated WebP thumbnail
  if (originalMimeType === "image/gif") {
    const filename = `${createId()}.gif`;
    const thumbnailFilename = `${createId()}.webp`;
    const metadata = await sharp(buffer).metadata();
    const width = metadata.width ?? 0;
    const height = metadata.height ?? 0;
    await saveOriginal(galleryId, filename, buffer);
    const thumbnailBuffer = await sharp(buffer, { animated: true })
      .resize(600, undefined, { withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
    await saveThumbnail(galleryId, thumbnailFilename, thumbnailBuffer);
    return {
      filename: originalFilename,
      originalPath: getRelativeOriginalPath(galleryId, filename),
      thumbnailPath: getRelativeThumbnailPath(galleryId, thumbnailFilename),
      width,
      height,
      mimeType: originalMimeType,
      sizeBytes: buffer.length,
    };
  }

  const ext = originalFilename.split(".").pop()?.toLowerCase() ?? "jpg";
  const filename = `${createId()}.${ext}`;
  const thumbnailFilename = `${createId()}.webp`;

  // Apply EXIF auto-rotation so images display with correct orientation
  const rotatedBuffer = await sharp(buffer).rotate().toBuffer();
  const metadata = await sharp(rotatedBuffer).metadata();

  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;

  await saveOriginal(galleryId, filename, rotatedBuffer);

  const thumbnailBuffer = await sharp(rotatedBuffer)
    .resize(600, undefined, { withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();

  await saveThumbnail(galleryId, thumbnailFilename, thumbnailBuffer);

  return {
    filename: originalFilename,
    originalPath: getRelativeOriginalPath(galleryId, filename),
    thumbnailPath: getRelativeThumbnailPath(galleryId, thumbnailFilename),
    width,
    height,
    mimeType: originalMimeType,
    sizeBytes: buffer.length,
  };
}
