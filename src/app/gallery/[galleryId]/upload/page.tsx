export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { UploadPage } from "@/components/upload/UploadPage";

type Props = { params: Promise<{ galleryId: string }> };

export default async function GalleryUploadPage({ params }: Props) {
  const { galleryId } = await params;

  const gallery = await prisma.gallery.findUnique({ where: { id: galleryId } });
  if (!gallery) notFound();

  if (!gallery.allowUserUpload) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-center">
        <div>
          <h1 className="text-2xl font-bold mb-2">{gallery.name}</h1>
          <p className="text-muted-foreground">Uploads are not enabled for this gallery.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">{gallery.name}</h1>
          {gallery.description && (
            <p className="text-muted-foreground mt-1">{gallery.description}</p>
          )}
          <p className="text-sm text-muted-foreground mt-2">
            Upload your photo to this gallery
            {gallery.requireApproval && " (pending approval)"}
          </p>
        </div>
        <UploadPage galleryId={gallery.id} requireApproval={gallery.requireApproval} />
      </div>
    </div>
  );
}
