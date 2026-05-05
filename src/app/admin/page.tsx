export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Images, CheckSquare, Camera } from "lucide-react";

export default async function AdminDashboard() {
  const [galleryCount, pendingCount, approvedCount] = await Promise.all([
    prisma.gallery.count(),
    prisma.photo.count({ where: { status: "PENDING" } }),
    prisma.photo.count({ where: { status: "APPROVED" } }),
  ]);

  const stats = [
    {
      label: "Total Galleries",
      value: galleryCount,
      icon: Images,
      description: "All galleries",
    },
    {
      label: "Pending Photos",
      value: pendingCount,
      icon: CheckSquare,
      description: "Awaiting approval",
    },
    {
      label: "Approved Photos",
      value: approvedCount,
      icon: Camera,
      description: "Published photos",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
                <CardDescription>{stat.description}</CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
