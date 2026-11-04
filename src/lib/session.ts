import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { prisma } from "@/lib/prisma";

const name = process.env.NODE_ENV === "production" ? "__Host-familytree-session" : "familytree-session";
const digest = (token: string) => createHash("sha256").update(token).digest("hex");

export async function createSession(userId: string) {
  const store = await cookies();
  const previous = store.get(name)?.value;
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 7 * 86400000);
  await prisma.$transaction([
    prisma.session.deleteMany({ where: { OR: [{ expires: { lte: new Date() } }, ...(previous ? [{ sessionToken: digest(previous) }] : [])] } }),
    prisma.session.create({ data: { userId, sessionToken: digest(token), expires } }),
  ]);
  store.set(name, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", expires });
}
export const getCurrentUser = cache(async () => {
  const token = (await cookies()).get(name)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const session = await prisma.session.findUnique({ where: { sessionToken: digest(token) }, select: { expires: true, user: { select: { id: true, email: true, name: true } } } });
  return session && session.expires > new Date() ? session.user : null;
});
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
export async function deleteSession() {
  const store = await cookies();
  const token = store.get(name)?.value;
  if (token) await prisma.session.deleteMany({ where: { sessionToken: digest(token) } });
  store.delete(name);
}
