export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { LinksForm } from "@/components/admin/LinksForm";

export default async function LinksPage() {
  const links = await prisma.outgoingLink.findMany({ orderBy: { order: "asc" } });

  return (
    <div className="max-w-lg">
      <div className="mb-8">
        <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase mb-2">— Header</p>
        <h1 className="font-display text-3xl font-semibold text-foreground">Outgoing Links</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Links shown in the header kebab menu. Opens in a new tab.
        </p>
      </div>
      <LinksForm initialLinks={links} />
    </div>
  );
}
