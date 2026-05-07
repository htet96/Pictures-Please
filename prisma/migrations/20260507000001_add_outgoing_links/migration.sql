CREATE TABLE "OutgoingLink" (
  "id"    TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "url"   TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "OutgoingLink_pkey" PRIMARY KEY ("id")
);
