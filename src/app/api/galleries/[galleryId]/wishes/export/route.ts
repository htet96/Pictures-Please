import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import * as XLSX from "xlsx";

type Params = { params: Promise<{ galleryId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { galleryId } = await params;

  const gallery = await prisma.gallery.findUnique({
    where: { id: galleryId },
    select: { name: true },
  });
  if (!gallery) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const wishes = await prisma.wish.findMany({
    where: { galleryId },
    orderBy: { createdAt: "asc" },
    select: {
      message: true,
      createdAt: true,
    },
  });

  const rows = wishes.map((w) => ({
    Message: w.message,
    Date: w.createdAt.toISOString().split("T")[0],
    Time: w.createdAt.toLocaleTimeString("en-US", { hour12: false }),
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);

  // Auto-size columns
  const colWidths = Object.keys(rows[0] ?? {}).map((key) => {
    const maxLen = Math.max(
      key.length,
      ...rows.map((r) => String(r[key as keyof typeof r] ?? "").length)
    );
    return { wch: Math.min(maxLen + 2, 60) };
  });
  ws["!cols"] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, "Wishes");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  const safeName = gallery.name.replace(/[^a-zA-Z0-9_-]/g, "_");

  return new Response(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${safeName}_wishes.xlsx"`,
    },
  });
}
