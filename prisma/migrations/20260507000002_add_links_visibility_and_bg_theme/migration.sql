ALTER TABLE "GlobalSettings" ADD COLUMN "linksPublic" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "GlobalSettings" ADD COLUMN "backgroundTheme" TEXT NOT NULL DEFAULT 'ember';
