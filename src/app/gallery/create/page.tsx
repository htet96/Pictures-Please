export const dynamic = "force-dynamic";

import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CreateGalleryForm } from "@/components/gallery/CreateGalleryForm";

export default async function CreateGalleryPage() {
  const admin = await isAdmin();
  const settings = await prisma.globalSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton" },
    update: {},
  });

  if (!admin && !settings.allowUserGalleries) {
    redirect("/");
  }

  return (
    <div className="min-h-screen flex items-start justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <h1 className="text-2xl font-bold mb-6">Create New Gallery</h1>
        <CreateGalleryForm isAdmin={admin} />
      </div>
    </div>
  );
}
