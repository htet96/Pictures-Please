-- Add transition settings to Gallery (per-gallery)
ALTER TABLE "Gallery" ADD COLUMN "slideshowSpeed" INTEGER NOT NULL DEFAULT 4000;
ALTER TABLE "Gallery" ADD COLUMN "slideshowTransition" TEXT NOT NULL DEFAULT 'fade';
ALTER TABLE "Gallery" ADD COLUMN "transitionDuration" INTEGER NOT NULL DEFAULT 500;

-- Copy current global values to all existing galleries
UPDATE "Gallery" SET
  "slideshowSpeed" = (SELECT "slideshowSpeed" FROM "GlobalSettings" WHERE id = 'singleton'),
  "slideshowTransition" = (SELECT "slideshowTransition" FROM "GlobalSettings" WHERE id = 'singleton'),
  "transitionDuration" = (SELECT "transitionDuration" FROM "GlobalSettings" WHERE id = 'singleton')
WHERE EXISTS (SELECT 1 FROM "GlobalSettings" WHERE id = 'singleton');

-- Remove from GlobalSettings
ALTER TABLE "GlobalSettings" DROP COLUMN "slideshowSpeed";
ALTER TABLE "GlobalSettings" DROP COLUMN "slideshowTransition";
ALTER TABLE "GlobalSettings" DROP COLUMN "transitionDuration";
