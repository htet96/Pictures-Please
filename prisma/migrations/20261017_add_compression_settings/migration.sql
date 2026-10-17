-- AlterTable
ALTER TABLE "GlobalSettings" ADD COLUMN "compressOriginals" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "GlobalSettings" ADD COLUMN "maxOriginalWidth" INTEGER NOT NULL DEFAULT 2560;
ALTER TABLE "GlobalSettings" ADD COLUMN "originalQuality" INTEGER NOT NULL DEFAULT 85;
