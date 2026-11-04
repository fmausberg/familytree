"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { createFamilyTree, addFamilyTreeMember, changeFamilyTreeMemberRole, transferFamilyTreeOwnership, requireFamilyTree, FamilyTreeAccessError } from "@/lib/family-trees";

export type FamilyTreeFormState = { error?: string; success?: string; name?: string; email?: string };

export async function addFamilyTree(_state: FamilyTreeFormState, form: FormData): Promise<FamilyTreeFormState> {
  await requireUser();
  const name = form.get("name");
  if (typeof name !== "string" || !name.trim() || name.trim().length > 200) return { error: "Bitte gib einen Stammbaumnamen mit 1 bis 200 Zeichen ein.", name: typeof name === "string" ? name : "" };
  try {
    await createFamilyTree(name);
  } catch {
    return { error: "Der Stammbaum konnte nicht angelegt werden. Bitte versuche es erneut.", name };
  }
  revalidatePath("/persons", "layout");
  redirect("/persons");
}

function membershipError(error: unknown): FamilyTreeFormState {
  if (error instanceof FamilyTreeAccessError) return { error: error.message };
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { error: "Diese Person ist bereits Mitglied dieses Stammbaums." };
  return { error: "Die Änderung konnte nicht gespeichert werden. Bitte versuche es erneut." };
}

export async function addMember(familyTreeId: string, _state: FamilyTreeFormState, form: FormData): Promise<FamilyTreeFormState> {
  await requireFamilyTree(familyTreeId);
  const email = form.get("email");
  const role = form.get("role");
  if (typeof email !== "string" || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return { error: "Bitte gib eine gültige E-Mail-Adresse ein." };
  if (role !== "ADMIN" && role !== "MEMBER") return { error: "Bitte wähle Admin oder Member." };
  try {
    await addFamilyTreeMember(familyTreeId, email, role);
  } catch (error) { return { ...membershipError(error), email }; }
  revalidatePath("/persons", "layout");
  return { success: "Das Mitglied wurde hinzugefügt." };
}

export async function changeMemberRole(familyTreeId: string, userId: string, _state: FamilyTreeFormState, form: FormData): Promise<FamilyTreeFormState> {
  await requireFamilyTree(familyTreeId);
  const role = form.get("role");
  if (role !== "ADMIN" && role !== "MEMBER") return { error: "Bitte wähle Admin oder Member." };
  try {
    await changeFamilyTreeMemberRole(familyTreeId, userId, role);
  } catch (error) { return membershipError(error); }
  revalidatePath("/persons", "layout");
  return { success: "Die Rolle wurde geändert." };
}

export async function transferOwnership(familyTreeId: string, userId: string, _state: FamilyTreeFormState, form: FormData): Promise<FamilyTreeFormState> {
  await requireFamilyTree(familyTreeId);
  if (form.get("confirm") !== "yes") return { error: "Bitte bestätige die Übertragung der Ownership." };
  try {
    await transferFamilyTreeOwnership(familyTreeId, userId);
  } catch (error) { return membershipError(error); }
  revalidatePath("/persons", "layout");
  return { success: "Die Ownership wurde übertragen. Du bist jetzt Admin." };
}
