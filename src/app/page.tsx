export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Images, Lock, Plus } from "lucide-react";

export default async function Home() {
  const admin = await isAdmin();
  const [galleries, settings] = await Promise.all([
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
  ]);

  const canCreate = admin || settings.allowUserGalleries;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-card">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <span className="font-semibold text-lg">📸 Pictures Please 📸</span>
          </Link>
          <div className="flex items-center gap-2">
            {canCreate && (
              <Link href="/gallery/create">
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" /> New Gallery
                </Button>
              </Link>
            )}
            {admin ? (
              <Link href="/admin">
                <Button size="sm">Admin Panel</Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button size="sm" variant="ghost">Admin</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full">
        <h1 className="text-3xl font-bold mb-2">Galleries</h1>
        <p className="text-muted-foreground mb-8">Browse and explore photo collections</p>

        {galleries.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Images className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg">No galleries yet.</p>
            {canCreate && (
              <Link href="/gallery/create">
                <Button className="mt-4">Create First Gallery</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {galleries.map((gallery) => (
              <Link key={gallery.id} href={`/gallery/${gallery.slug}`} className="group">
                <Card className="h-full transition-shadow hover:shadow-lg">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-1">
                        {gallery.name}
                      </CardTitle>
                      {gallery.password && (
                        <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                    </div>
                    {gallery.description && (
                      <CardDescription className="line-clamp-2">
                        {gallery.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {gallery._count.photos} photo{gallery._count.photos !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
