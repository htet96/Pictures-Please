export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { UploadPage } from "@/components/upload/UploadPage";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type Props = { params: Promise<{ slug: string }> };

export default async function GalleryUploadPage({ params }: Props) {
  const { slug } = await params;

  const gallery = await prisma.gallery.findUnique({ where: { slug } });
  if (!gallery) notFound();

  const admin = await isAdmin();

  const header = (
    <header className="border-b bg-background/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <Link href="/" className="font-semibold text-sm hover:opacity-80 transition-opacity shrink-0 hidden sm:block">
            📸 Pictures Please 📸
          </Link>
          <Link href="/" className="font-semibold text-sm hover:opacity-80 transition-opacity shrink-0 sm:hidden">
            📸
          </Link>
          <span className="text-muted-foreground hidden sm:block">/</span>
          <Link href={`/gallery/${slug}`} className="text-sm text-muted-foreground hover:text-foreground truncate transition-colors">
            {gallery.name}
          </Link>
          <span className="text-muted-foreground hidden sm:block">/</span>
          <span className="text-sm font-medium hidden sm:block">Upload</span>
        </div>
        {admin && (
          <Link href={`/admin/galleries/${gallery.id}`}>
            <Button size="sm" variant="outline" className="shrink-0">Admin Panel</Button>
          </Link>
        )}
      </div>
    </header>
  );

  if (!gallery.allowUserUpload) {
    return (
      <div className="min-h-screen flex flex-col">
        {header}
        <div className="flex-1 flex items-center justify-center px-4 text-center">
          <div>
            <h1 className="text-2xl font-bold mb-2">{gallery.name}</h1>
            <p className="text-muted-foreground">Uploads are not enabled for this gallery.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {header}
      <main className="flex-1 flex flex-col items-center px-4 py-8 sm:py-12">
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
      </main>
    </div>
  );
}
