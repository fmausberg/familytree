import { withFamilyTree } from "@/lib/family-trees";
import type { Gender } from "@prisma/client";

const select = { id: true, givenNames: true, surname: true, birthName: true, gender: true } as const;
export type PersonData = { givenNames: string | null; surname: string | null; birthName: string | null; gender: Gender | null };

// All three roles have the same data permissions. Membership is checked in the
// same transaction as each query; IDs are always scoped to this family tree.
export async function listPersons(familyTreeId: string) {
  return withFamilyTree(familyTreeId, tx => tx.person.findMany({ where: { familyTreeId }, select }));
}

export async function getPerson(familyTreeId: string, id: string) {
  return withFamilyTree(familyTreeId, tx => tx.person.findFirst({ where: { id, familyTreeId }, select }));
}

export async function createPerson(familyTreeId: string, data: PersonData) {
  return withFamilyTree(familyTreeId, tx => tx.person.create({ data: { ...data, familyTreeId }, select: { id: true } }));
}

export async function updatePerson(familyTreeId: string, id: string, data: PersonData) {
  if (typeof id !== "string" || !id) throw new Error("Ungültige Personen-ID.");
  return withFamilyTree(familyTreeId, tx => tx.person.updateMany({ where: { id, familyTreeId }, data }));
}

export async function deletePerson(familyTreeId: string, id: string) {
  if (typeof id !== "string" || !id) throw new Error("Ungültige Personen-ID.");
  return withFamilyTree(familyTreeId, tx => tx.person.deleteMany({ where: { id, familyTreeId } }));
}
