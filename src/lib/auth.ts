import { timingSafeEqual } from "crypto";
import { getSession } from "./session";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";

function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    timingSafeEqual(bufA, Buffer.alloc(bufA.length));
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

export async function validateAdminCredentials(
  username: string,
  password: string
): Promise<boolean> {
  const validUsername = process.env.ADMIN_USERNAME ?? "";
  const validPassword = process.env.ADMIN_PASSWORD ?? "";

  const settings = await prisma.globalSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton" },
    update: {},
  });

  if (settings.adminPasswordOnly) {
    return safeCompare(password, validPassword);
  }

  return safeCompare(username, validUsername) && safeCompare(password, validPassword);
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session.isAdmin) {
    redirect("/login");
  }
  return session;
}

export async function isAdmin(): Promise<boolean> {
  const session = await getSession();
  return session.isAdmin === true;
}

export async function hasGalleryAccess(galleryId: string): Promise<boolean> {
  const session = await getSession();
  if (session.isAdmin) return true;
  return session.galleryAccess?.[galleryId] === true;
}
