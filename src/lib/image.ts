import sharp from "sharp";
import { createId } from "@paralleldrive/cuid2";
import {
  saveOriginal,
  saveThumbnail,
  getRelativeOriginalPath,
  getRelativeThumbnailPath,
} from "./storage";

// Limit libvips threads per Sharp job so concurrent uploads share the UV thread pool
// fairly rather than all competing for the same 4 threads simultaneously.
sharp.concurrency(1);
// Cap the in-process libvips cache to avoid unbounded memory growth in a container.
sharp.cache({ memory: 50, files: 20, items: 200 });

// ---------------------------------------------------------------------------
// In-process semaphore — caps simultaneous Sharp jobs.
// Set UPLOAD_PROCESS_CONCURRENCY env var to tune (default 2).
// ---------------------------------------------------------------------------
const MAX_CONCURRENT = parseInt(process.env.UPLOAD_PROCESS_CONCURRENCY ?? "2", 10);
let activeJobs = 0;
const waiters: Array<() => void> = [];

function acquireSemaphore(): Promise<void> {
  if (activeJobs < MAX_CONCURRENT) {
    activeJobs++;
    return Promise.resolve();
  }
  return new Promise<void>((resolve) => waiters.push(resolve));
}

function releaseSemaphore(): void {
  const next = waiters.shift();
  if (next) {
    next();
  } else {
    activeJobs--;
  }
}

export interface CompressionSettings {
  compressOriginals: boolean;
  maxOriginalWidth: number;
  originalQuality: number;
}

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
  originalFilename: string,
  compression?: CompressionSettings,
): Promise<ProcessedImage> {
  await acquireSemaphore();
  try {
    return await _process(galleryId, buffer, originalMimeType, originalFilename, compression);
  } finally {
    releaseSemaphore();
  }
}

async function _process(
  galleryId: string,
  buffer: Buffer,
  originalMimeType: string,
  originalFilename: string,
  compression?: CompressionSettings,
): Promise<ProcessedImage> {
  // GIFs: preserve animation — skip EXIF rotation (GIFs have none), store original as-is,
  // generate animated WebP thumbnail.
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

  // All other types (JPEG, PNG, WebP, HEIC …):
  //
  // The original bytes are saved as-is — no re-encode. This preserves full
  // original quality. EXIF orientation is kept intact; all modern browsers
  // and OS photo viewers respect it automatically.
  //
  // The thumbnail is generated in a single Sharp pipeline. libvips uses
  // shrink-on-load which decodes at reduced resolution — much faster than a
  // full decode followed by resize, and avoids the intermediate rotatedBuffer.

  const ext = originalFilename.split(".").pop()?.toLowerCase() ?? "jpg";
  const thumbnailFilename = `${createId()}.webp`;

  // Read metadata (header-only, no pixel decode) to get display dimensions.
  const metadata = await sharp(buffer, { failOn: "none" }).metadata();
  const orientation = metadata.orientation ?? 1;
  const rawW = metadata.width ?? 0;
  const rawH = metadata.height ?? 0;
  // EXIF orientations 5–8 are 90°/270° rotations — swap w/h for display dimensions.
  let [width, height] = orientation >= 5 ? [rawH, rawW] : [rawW, rawH];

  // Compress/resize oversized originals if configured
  let originalBuffer = buffer;
  let savedExt = ext;
  const shouldCompress = compression?.compressOriginals
    && (rawW > compression.maxOriginalWidth || rawH > compression.maxOriginalWidth);

  if (shouldCompress) {
    const maxW = compression!.maxOriginalWidth;
    const q = compression!.originalQuality;
    const pipeline = sharp(buffer, { failOn: "none" })
      .rotate() // bake EXIF orientation into pixels
      .resize(maxW, maxW, { fit: "inside", withoutEnlargement: true });

    if (originalMimeType === "image/png") {
      originalBuffer = await pipeline.webp({ quality: q }).toBuffer();
      savedExt = "webp";
    } else if (originalMimeType === "image/heic" || originalMimeType === "image/heif") {
      originalBuffer = await pipeline.jpeg({ quality: q }).toBuffer();
      savedExt = "jpg";
    } else if (originalMimeType === "image/webp") {
      originalBuffer = await pipeline.webp({ quality: q }).toBuffer();
      savedExt = "webp";
    } else {
      // JPEG and others → JPEG
      originalBuffer = await pipeline.jpeg({ quality: q }).toBuffer();
      savedExt = "jpg";
    }

    // Re-read compressed dimensions for accurate storage
    const compMeta = await sharp(originalBuffer).metadata();
    width = compMeta.width ?? width;
    height = compMeta.height ?? height;
  }

  const filename = `${createId()}.${savedExt}`;

  // Save the original (compressed or as-is).
  await saveOriginal(galleryId, filename, originalBuffer);

  // Single pipeline: rotate (bakes EXIF into thumbnail pixels) → shrink-on-load
  // resize → WebP. The thumbnail always displays with correct orientation.
  const thumbnailBuffer = await sharp(
    shouldCompress ? originalBuffer : buffer,
    { failOn: "none" },
  )
    .rotate()
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
    sizeBytes: originalBuffer.length,
  };
}
