export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { GlobalSettingsForm } from "@/components/admin/GlobalSettingsForm";

export default async function SettingsPage() {
  const settings = await prisma.globalSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton" },
    update: {},
  });

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-6">Global Settings</h1>
      <GlobalSettingsForm settings={settings} />
    </div>
  );
}
