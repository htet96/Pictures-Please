import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/),
  description: z.string().max(500).optional(),
  displayMode: z.enum(["MASONRY", "GRID", "SLIDESHOW", "CAROUSEL"]).optional(),
  password: z.string().optional(),
  requireApproval: z.boolean().optional(),
  allowUserDelete: z.boolean().optional(),
  allowUserUpload: z.boolean().optional(),
  isPublic: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getSession();
  const searchParams = req.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = 20;
  const skip = (page - 1) * limit;

  const where = session.isAdmin ? {} : { isPublic: true };

  const [galleries, total] = await Promise.all([
    prisma.gallery.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
      include: { _count: { select: { photos: { where: { status: "APPROVED" } } } } },
    }),
    prisma.gallery.count({ where }),
  ]);

  const data = galleries.map((g) => ({
    ...g,
    hasPassword: !!g.password,
    password: undefined,
  }));

  return NextResponse.json({ galleries: data, total, page, limit });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  const settings = await prisma.globalSettings.findUnique({
    where: { id: "singleton" },
  });

  if (!session.isAdmin && !settings?.allowUserGalleries) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { password, ...data } = parsed.data;

  let hashedPassword: string | undefined;
  if (password) {
    const bcrypt = await import("bcryptjs");
    hashedPassword = await bcrypt.hash(password, 10);
  }

  try {
    const gallery = await prisma.gallery.create({
      data: {
        ...data,
        password: hashedPassword,
        requireApproval:
          data.requireApproval ?? settings?.defaultRequireApproval ?? true,
        allowUserDelete:
          data.allowUserDelete ?? settings?.defaultAllowUserDelete ?? false,
      },
    });
    return NextResponse.json({ ...gallery, hasPassword: !!gallery.password, password: undefined }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
  }
}
