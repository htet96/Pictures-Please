export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { ModerationGrid } from "@/components/admin/ModerationGrid";

export default async function ModerationPage() {
  const pendingPhotos = await prisma.photo.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    include: { gallery: { select: { name: true, slug: true } } },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Moderation Queue</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {pendingPhotos.length} photo{pendingPhotos.length !== 1 ? "s" : ""} awaiting approval
        </p>
      </div>
      <ModerationGrid photos={pendingPhotos} />
    </div>
  );
}
