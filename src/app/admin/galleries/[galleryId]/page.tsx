export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { GallerySettingsForm } from "@/components/admin/GallerySettingsForm";
import { AdminPhotoGrid } from "@/components/admin/AdminPhotoGrid";
import { CollapsibleSection } from "@/components/admin/CollapsibleSection";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Image, Heart } from "lucide-react";
import { WishAdminSection } from "@/components/wishes/WishAdminSection";

type Props = { params: Promise<{ galleryId: string }> };

export default async function GallerySettingsPage({ params }: Props) {
  const { galleryId } = await params;
  const gallery = await prisma.gallery.findUnique({
    where: { id: galleryId },
    include: {
      wishes: { orderBy: { createdAt: "asc" } },
      _count: { select: { photos: true } },
    },
  });
  if (!gallery) notFound();

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/galleries">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">{gallery.name}</h1>
      </div>

      <GallerySettingsForm gallery={{
        id: gallery.id,
        name: gallery.name,
        slug: gallery.slug,
        description: gallery.description,
        hasPassword: !!gallery.password,
        requireApproval: gallery.requireApproval,
        allowUserDelete: gallery.allowUserDelete,
        allowUserUpload: gallery.allowUserUpload,
        isPublic: gallery.isPublic,
        allowWishes: gallery.allowWishes,
      }} />

      <div className="mt-10">
        <CollapsibleSection
          title={
            <div className="flex items-center gap-2">
              <Image className="h-4 w-4 text-primary" />
              <span className="text-lg font-semibold">Photos</span>
              <span className="text-sm text-muted-foreground">({gallery._count.photos})</span>
            </div>
          }
        >
          <AdminPhotoGrid galleryId={gallery.id} />
        </CollapsibleSection>
      </div>

      <div className="mt-10">
        <CollapsibleSection
          title={
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-primary" />
              <span className="text-lg font-semibold">Well Wishes</span>
              <span className="text-sm text-muted-foreground">({gallery.wishes.length})</span>
            </div>
          }
        >
          <WishAdminSection
            galleryId={gallery.id}
            wishes={gallery.wishes.map(({ guestToken: _, ...w }) => ({
              ...w,
              createdAt: w.createdAt.toISOString(),
              updatedAt: w.updatedAt.toISOString(),
            }))}
          />
        </CollapsibleSection>
      </div>
    </div>
  );
}
