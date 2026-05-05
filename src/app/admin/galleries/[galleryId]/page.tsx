export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { GallerySettingsForm } from "@/components/admin/GallerySettingsForm";
import { QRCodeDisplay } from "@/components/qr/QRCodeDisplay";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

type Props = { params: Promise<{ galleryId: string }> };

export default async function GallerySettingsPage({ params }: Props) {
  const { galleryId } = await params;
  const gallery = await prisma.gallery.findUnique({ where: { id: galleryId } });
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
        displayMode: gallery.displayMode,
        hasPassword: !!gallery.password,
        requireApproval: gallery.requireApproval,
        allowUserDelete: gallery.allowUserDelete,
        allowUserUpload: gallery.allowUserUpload,
        isPublic: gallery.isPublic,
      }} />

      <Separator className="my-8" />

      <div>
        <h2 className="text-lg font-semibold mb-4">Upload QR Code</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Share this QR code with guests to let them upload photos directly.
        </p>
        <QRCodeDisplay galleryId={gallery.id} />
      </div>
    </div>
  );
}
