"use server";
import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import { createSession, deleteSession } from "@/lib/session";

export type AuthState = { error?: string; email?: string };
async function authenticate(mode: "login" | "register", form: FormData): Promise<AuthState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const failure = (error: string) => ({ error, email });
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return failure("Bitte gib eine gültige E-Mail-Adresse ein.");
  if (!password) return failure("Bitte gib ein Passwort ein.");
  if (mode === "register" && password !== form.get("confirmPassword")) return failure("Die Passwörter stimmen nicht überein.");
  try {
    // Atomic, shared rate limit across app instances; unknown users are limited too.
    const window = Math.floor(Date.now() / 900000);
    const key = createHash("sha256").update(`${email}:${window}`).digest("hex");
    const attempt = await prisma.authAttempt.upsert({ where: { key }, create: { key, expiresAt: new Date((window + 1) * 900000) }, update: { count: { increment: 1 } } });
    if (attempt.count > 10) return failure("Zu viele Versuche. Bitte versuche es in 15 Minuten erneut.");
    await prisma.authAttempt.deleteMany({ where: { expiresAt: { lt: new Date() } } });
    let userId: string;
    if (mode === "register") {
      const user = await prisma.user.create({ data: { email, passwordHash: await hashPassword(password) }, select: { id: true } });
      userId = user.id;
    } else {
      const user = await prisma.user.findUnique({ where: { email }, select: { id: true, passwordHash: true } });
      if (!(await verifyPassword(password, user?.passwordHash ?? null)) || !user) return failure("E-Mail-Adresse oder Passwort ist falsch.");
      userId = user.id;
    }
    await createSession(userId);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return failure("Für diese E-Mail-Adresse besteht bereits ein Konto. Bitte melde dich an.");
    // TypeError details help identify stale generated clients without logging
    // Prisma query parameters or submitted credentials.
    console.error("Authentication failed", error instanceof TypeError ? `${error.name}: ${error.message}` : error instanceof Error ? error.name : "Unknown error");
    return failure("Das hat gerade nicht geklappt. Bitte versuche es erneut.");
  }
  redirect("/persons");
}
export async function login(_state: AuthState, form: FormData) { return authenticate("login", form); }
export async function register(_state: AuthState, form: FormData) { return authenticate("register", form); }
export async function logout() { await deleteSession(); redirect("/login"); }
