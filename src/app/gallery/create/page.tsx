export const dynamic = "force-dynamic";

import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CreateGalleryForm } from "@/components/gallery/CreateGalleryForm";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

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
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border/60 bg-card/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" className="hover:text-primary">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/">
              <span className="font-display text-2xl font-semibold tracking-wide text-foreground hover:text-primary transition-colors">
                Pictures Please
              </span>
            </Link>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          <div className="mb-8">
            <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase mb-3">— New</p>
            <h1 className="font-display text-4xl font-semibold text-foreground">Create Gallery</h1>
            <div className="mt-4 h-px w-10 bg-primary" />
          </div>
          <CreateGalleryForm isAdmin={admin} />
        </div>
      </main>
    </div>
  );
}
