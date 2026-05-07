export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Images, Plus } from "lucide-react";
import { GalleryGrid } from "@/components/home/GalleryGrid";
import { HomeBackground } from "@/components/home/HomeBackground";
import { WatermarkOverlay } from "@/components/home/WatermarkOverlay";
import { KebabMenu } from "@/components/home/KebabMenu";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

export default async function Home() {
  const admin = await isAdmin();
  const [galleries, settings, outgoingLinks] = await Promise.all([
    prisma.gallery.findMany({
      where: { isPublic: true },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { photos: { where: { status: "APPROVED" } } } },
      },
    }),
    prisma.globalSettings.upsert({
      where: { id: "singleton" },
      create: { id: "singleton" },
      update: {},
    }),
    prisma.outgoingLink.findMany({ orderBy: { order: "asc" } }),
  ]);

  const canCreate = admin || settings.allowUserGalleries;
  // Only show links to public if linksPublic is true; always show to admin
  const visibleLinks = settings.linksPublic || admin ? outgoingLinks : [];

  return (
    <div className="min-h-screen flex flex-col relative">
      <HomeBackground theme={settings.backgroundTheme} />

      <header className="border-b border-border/60 bg-card/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <span className="font-display text-2xl font-semibold tracking-wide text-foreground hover:text-primary transition-colors">
              Pictures Please
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {canCreate && (
              <Link href="/gallery/create">
                <Button size="sm" variant="outline" className="border-border hover:border-primary hover:text-primary transition-colors">
                  <Plus className="h-4 w-4 mr-1.5" /> New Gallery
                </Button>
              </Link>
            )}
            {admin ? (
              <Link href="/admin">
                <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Admin Panel
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-primary">
                  Admin
                </Button>
              </Link>
            )}
            <KebabMenu links={visibleLinks} />
          </div>
        </div>
      </header>

      <main className="flex-1 relative z-10 max-w-6xl mx-auto px-6 py-12 w-full">
        {/* Configurable watermark overlay */}
        <WatermarkOverlay settings={settings} />

        <div className="relative mb-12">
          <div className="relative pl-0">
            <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase mb-3">
              — Collections
            </p>
            <h1 className="font-display text-5xl font-semibold text-foreground leading-tight">
              Galleries
            </h1>
            <div className="mt-4 h-px w-12 bg-primary" />
          </div>
        </div>

        {galleries.length === 0 ? (
          <div className="text-center py-24 text-muted-foreground">
            <Images className="h-14 w-14 mx-auto mb-5 opacity-20" />
            <p className="font-display text-3xl mb-2 text-foreground/60">No galleries yet.</p>
            <p className="text-sm text-muted-foreground/60">Nothing to show right now.</p>
            {canCreate && (
              <Link href="/gallery/create">
                <Button className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90">
                  Create First Gallery
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <GalleryGrid galleries={galleries} />
        )}
      </main>

      <footer className="relative z-10 border-t border-border/30 py-6 text-center text-xs text-muted-foreground/40 tracking-widest uppercase">
        Pictures Please
      </footer>
    </div>
  );
}
