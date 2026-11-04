import { Prisma } from "@prisma/client";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export class FamilyTreeAccessError extends Error {
  constructor(message = "Du hast keinen Zugriff auf diesen Stammbaum.") { super(message); }
}

// These transactions serialize role changes, transfers and data mutations.
// Retry serialization conflicts without ever retrying a partially committed write.
export async function treeTransaction<T>(work: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await prisma.$transaction(work, { isolationLevel: "Serializable" });
    } catch (error) {
      if (attempt < 2 && error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") continue;
      throw error;
    }
  }
}

export async function getFamilyTreeContext(userId: string, familyTreeId?: string, db: Prisma.TransactionClient = prisma) {
  return db.familyTreeMembership.findFirst({
    where: { userId, ...(familyTreeId ? { familyTreeId } : {}) },
    orderBy: [{ createdAt: "asc" }, { familyTreeId: "asc" }],
    select: { userId: true, role: true, familyTreeId: true, familyTree: { select: { id: true, name: true, ownerId: true } } },
  });
}

export async function requireFamilyTree(familyTreeId?: string) {
  const user = await requireUser();
  if (familyTreeId !== undefined && (typeof familyTreeId !== "string" || !familyTreeId)) notFound();
  const membership = await getFamilyTreeContext(user.id, familyTreeId);
  if (!membership) {
    if (familyTreeId !== undefined) notFound();
    redirect("/family-tree/new");
  }
  return { ...membership, user };
}

export function canManageMembers(context: { userId: string; role: string; familyTree: { ownerId: string } }) {
  return (context.role === "OWNER" && context.familyTree.ownerId === context.userId) || context.role === "ADMIN";
}

// Authentication is repeated at the operation boundary. A browser-supplied ID
// never constitutes authority. Membership is re-read inside the transaction.
export async function withFamilyTree<T>(familyTreeId: string, work: (tx: Prisma.TransactionClient, context: NonNullable<Awaited<ReturnType<typeof getFamilyTreeContext>>>) => Promise<T>) {
  const user = await requireUser();
  if (typeof familyTreeId !== "string" || !familyTreeId) throw new FamilyTreeAccessError();
  return treeTransaction(async tx => {
    const context = await getFamilyTreeContext(user.id, familyTreeId, tx);
    if (!context) throw new FamilyTreeAccessError();
    return work(tx, context);
  });
}

export async function createFamilyTree(name: string) {
  const user = await requireUser();
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 200) throw new Error("Bitte gib einen Stammbaumnamen mit höchstens 200 Zeichen ein.");
  return prisma.familyTree.create({
    data: { name: trimmed, ownerId: user.id, memberships: { create: { userId: user.id, role: "OWNER" } } },
    select: { id: true },
  });
}

export async function listFamilyTreeMembers(familyTreeId: string) {
  return withFamilyTree(familyTreeId, (tx, context) => {
    if (!canManageMembers(context)) throw new FamilyTreeAccessError("Nur Owner und Admins dürfen Mitglieder verwalten.");
    return tx.familyTreeMembership.findMany({
      where: { familyTreeId },
      select: { userId: true, role: true, user: { select: { email: true, name: true } } },
      orderBy: [{ createdAt: "asc" }, { userId: "asc" }],
    });
  });
}

function assertManageableRole(role: string): asserts role is "ADMIN" | "MEMBER" {
  if (role !== "ADMIN" && role !== "MEMBER") throw new FamilyTreeAccessError("Hier sind nur die Rollen Admin und Member erlaubt.");
}

export async function addFamilyTreeMember(familyTreeId: string, email: string, role: string) {
  assertManageableRole(role);
  return withFamilyTree(familyTreeId, async (tx, context) => {
    if (!canManageMembers(context)) throw new FamilyTreeAccessError("Nur Owner und Admins dürfen Mitglieder hinzufügen.");
    const user = await tx.user.findUnique({ where: { email: email.trim().toLowerCase() }, select: { id: true } });
    if (!user) throw new FamilyTreeAccessError("Unter dieser E-Mail-Adresse ist noch kein Konto registriert.");
    return tx.familyTreeMembership.create({ data: { familyTreeId, userId: user.id, role }, select: { userId: true } });
  });
}

export async function changeFamilyTreeMemberRole(familyTreeId: string, userId: string, role: string) {
  assertManageableRole(role);
  if (typeof userId !== "string" || !userId) throw new FamilyTreeAccessError("Bitte wähle ein Mitglied aus.");
  return withFamilyTree(familyTreeId, async (tx, context) => {
    if (!canManageMembers(context)) throw new FamilyTreeAccessError("Nur Owner und Admins dürfen Rollen ändern.");
    if (userId === context.familyTree.ownerId) throw new FamilyTreeAccessError("Die Owner-Rolle kann nur durch eine Ownership-Übertragung geändert werden.");
    const result = await tx.familyTreeMembership.updateMany({ where: { familyTreeId, userId, role: { in: ["ADMIN", "MEMBER"] } }, data: { role } });
    if (!result.count) throw new FamilyTreeAccessError("Das Mitglied wurde nicht gefunden oder seine Rolle kann nicht geändert werden.");
  });
}

export async function transferFamilyTreeOwnership(familyTreeId: string, newOwnerId: string) {
  if (typeof newOwnerId !== "string" || !newOwnerId) throw new FamilyTreeAccessError("Bitte wähle ein Mitglied aus.");
  return withFamilyTree(familyTreeId, async (tx, context) => {
    if (context.role !== "OWNER" || context.familyTree.ownerId !== context.userId) throw new FamilyTreeAccessError("Nur der aktuelle Owner darf die Ownership übertragen.");
    if (newOwnerId === context.userId) throw new FamilyTreeAccessError("Du bist bereits Owner dieses Stammbaums.");
    const target = await tx.familyTreeMembership.findUnique({ where: { familyTreeId_userId: { familyTreeId, userId: newOwnerId } } });
    if (!target || target.role === "OWNER") throw new FamilyTreeAccessError("Bitte wähle ein anderes bestehendes Mitglied aus.");
    const owners = await tx.familyTreeMembership.count({ where: { familyTreeId, role: "OWNER" } });
    if (owners !== 1) throw new FamilyTreeAccessError("Die Owner-Zuordnung ist inkonsistent. Bitte lasse sie vor der Übertragung korrigieren.");
    // The old owner becomes ADMIN. There is no parallel admin membership.
    await tx.familyTreeMembership.update({ where: { familyTreeId_userId: { familyTreeId, userId: context.userId } }, data: { role: "ADMIN" } });
    await tx.familyTreeMembership.update({ where: { familyTreeId_userId: { familyTreeId, userId: newOwnerId } }, data: { role: "OWNER" } });
    await tx.familyTree.update({ where: { id: familyTreeId }, data: { ownerId: newOwnerId } });
  });
}
