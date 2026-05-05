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
  const ext = originalFilename.split(".").pop()?.toLowerCase() ?? "jpg";
  const filename = `${createId()}.${ext}`;
  const thumbnailFilename = `${createId()}.webp`;

  const sharpInstance = sharp(buffer);
  const metadata = await sharpInstance.metadata();

  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;

  await saveOriginal(galleryId, filename, buffer);

  const thumbnailBuffer = await sharp(buffer)
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
