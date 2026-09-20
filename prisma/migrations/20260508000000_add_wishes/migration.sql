ALTER TABLE "Gallery" ADD COLUMN "allowWishes" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE "Wish" (
    "id"         TEXT NOT NULL,
    "galleryId"  TEXT NOT NULL,
    "guestToken" TEXT NOT NULL,
    "guestName"  TEXT NOT NULL,
    "message"    TEXT NOT NULL,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Wish_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Wish_galleryId_idx" ON "Wish"("galleryId");

ALTER TABLE "Wish" ADD CONSTRAINT "Wish_galleryId_fkey"
  FOREIGN KEY ("galleryId") REFERENCES "Gallery"("id") ON DELETE CASCADE ON UPDATE CASCADE;
