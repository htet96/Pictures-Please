export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { WatermarkForm } from "@/components/admin/WatermarkForm";

export default async function WatermarkPage() {
  const settings = await prisma.globalSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton" },
    update: {},
  });

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase mb-2">— Landing Page</p>
        <h1 className="font-display text-3xl font-semibold text-foreground">Watermark</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure the decorative overlay shown on the landing page.
        </p>
      </div>
      <WatermarkForm settings={settings} />
    </div>
  );
}
