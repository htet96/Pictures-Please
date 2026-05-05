export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { isAdmin, hasGalleryAccess } from "@/lib/auth";
import { GalleryRenderer } from "@/components/gallery/GalleryRenderer";
import { PasswordGate } from "@/components/shared/PasswordGate";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Upload, ArrowLeft } from "lucide-react";

type Props = { params: Promise<{ galleryId: string }> };

export default async function GalleryPage({ params }: Props) {
  const { galleryId } = await params;

  const gallery = await prisma.gallery.findUnique({
    where: { id: galleryId },
    include: {
      photos: {
        where: { status: "APPROVED" },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!gallery) notFound();

  const admin = await isAdmin();

  if (gallery.password && !admin) {
    const hasAccess = await hasGalleryAccess(galleryId);
    if (!hasAccess) {
      return <PasswordGate galleryId={galleryId} galleryName={gallery.name} />;
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/">
              <Button variant="ghost" size="icon" className="shrink-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="min-w-0">
              <h1 className="font-semibold truncate">{gallery.name}</h1>
              {gallery.description && (
                <p className="text-xs text-muted-foreground truncate hidden sm:block">
                  {gallery.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {gallery.photos.length} photo{gallery.photos.length !== 1 ? "s" : ""}
            </span>
            {gallery.allowUserUpload && (
              <Link href={`/gallery/${galleryId}/upload`}>
                <Button size="sm">
                  <Upload className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Upload</span>
                </Button>
              </Link>
            )}
            {admin && (
              <Link href={`/admin/galleries/${galleryId}`}>
                <Button size="sm" variant="outline">Manage</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {gallery.photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground text-center px-4">
            <p className="text-lg mb-2">No photos yet</p>
            {gallery.allowUserUpload && (
              <Link href={`/gallery/${galleryId}/upload`}>
                <Button className="mt-4">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload the first photo
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <GalleryRenderer
            photos={gallery.photos}
            displayMode={gallery.displayMode}
            canDelete={admin || gallery.allowUserDelete}
          />
        )}
      </main>
    </div>
  );
}
