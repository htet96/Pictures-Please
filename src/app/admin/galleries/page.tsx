export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
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
import { Plus, Settings, Lock, Globe } from "lucide-react";

export default async function GalleriesPage() {
  const galleries = await prisma.gallery.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { photos: true } } },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Galleries</h1>
        <Link href="/gallery/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Gallery
          </Button>
        </Link>
      </div>

      {galleries.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p>No galleries yet. Create your first one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {galleries.map((gallery) => (
            <Card key={gallery.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base line-clamp-1">
                    {gallery.name}
                  </CardTitle>
                  <div className="flex gap-1 shrink-0">
                    {gallery.password && (
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    )}
                    {gallery.isPublic ? (
                      <Globe className="h-4 w-4 text-muted-foreground" />
                    ) : null}
                  </div>
                </div>
                <CardDescription className="line-clamp-2">
                  {gallery.description ?? `/${gallery.slug}`}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">
                    {gallery._count.photos} photos
                  </Badge>
                  {gallery.requireApproval && (
                    <Badge variant="outline">Approval required</Badge>
                  )}
                </div>
                <div className="flex gap-2 mt-auto">
                  <Link href={`/gallery/${gallery.slug}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      View
                    </Button>
                  </Link>
                  <Link href={`/admin/galleries/${gallery.id}`}>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
