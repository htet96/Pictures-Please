-- Replace the (galleryId, status) composite index with (galleryId, status, createdAt)
-- so Postgres can satisfy the ORDER BY createdAt ASC on the gallery page query
-- directly from the index without a separate sort step.
DROP INDEX IF EXISTS "Photo_galleryId_status_idx";
CREATE INDEX "Photo_galleryId_status_createdAt_idx" ON "Photo"("galleryId", "status", "createdAt");
