"use server";

import { Gender } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { requireFamilyTree } from "@/lib/family-trees";
import { createPerson, updatePerson, deletePerson } from "@/lib/persons";
import type { PersonData } from "@/lib/persons";
import type { PersonFormState, PersonValues } from "@/lib/person-fields";

function validate(form: FormData) {
  const errors: NonNullable<PersonFormState["errors"]> = {};
  const values: PersonValues = { givenNames: "", surname: "", birthName: "", gender: "" };
  for (const field of Object.keys(values) as (keyof PersonValues)[]) {
    const value = form.get(field);
    if (typeof value !== "string") errors[field] = "Bitte gib einen gültigen Wert ein.";
    else values[field] = value.trim();
  }
  if (values.gender && !Object.values(Gender).includes(values.gender as Gender)) {
    errors.gender = "Bitte wähle ein gültiges Geschlecht oder „Keine Angabe“.";
  }
  const data: PersonData = {
    givenNames: values.givenNames || null,
    surname: values.surname || null,
    birthName: values.birthName || null,
    gender: (values.gender || null) as Gender | null,
  };
  return { errors, values, data };
}

async function save(familyTreeId: string, id: string | null, form: FormData): Promise<PersonFormState> {
  await requireFamilyTree(familyTreeId);
  const { errors, values, data } = validate(form);
  if (Object.keys(errors).length) return { errors, values, error: "Bitte prüfe die markierten Felder." };
  try {
    if (id !== null) {
      const result = await updatePerson(familyTreeId, id, data);
      if (!result.count) return { error: "Diese Person ist nicht verfügbar. Sie wurde möglicherweise bereits gelöscht.", values };
    } else {
      await createPerson(familyTreeId, data);
    }
  } catch {
    return { error: "Die Person konnte nicht gespeichert werden. Bitte versuche es erneut.", values };
  }
  revalidatePath("/persons", "layout");
  redirect(`/persons?success=${id === null ? "created" : "updated"}`);
}

export async function addPerson(familyTreeId: string, _state: PersonFormState, form: FormData) {
  return save(familyTreeId, null, form);
}

export async function editPerson(familyTreeId: string, id: string, _state: PersonFormState, form: FormData) {
  await requireUser();
  if (typeof id !== "string" || !id) return { error: "Die Person konnte nicht gefunden werden." };
  return save(familyTreeId, id, form);
}

export async function removePerson(familyTreeId: string, id: string, _state: PersonFormState, form: FormData): Promise<PersonFormState> {
  await requireFamilyTree(familyTreeId);
  if (typeof id !== "string" || !id) return { error: "Die Person konnte nicht gefunden werden." };
  if (form.get("confirm") !== "yes") return { error: "Bitte bestätige, dass du diese Person endgültig löschen möchtest." };
  try {
    const result = await deletePerson(familyTreeId, id);
    if (!result.count) return { error: "Diese Person ist nicht verfügbar. Sie wurde möglicherweise bereits gelöscht." };
  } catch {
    return { error: "Die Person konnte nicht gelöscht werden. Bitte versuche es erneut." };
  }
  revalidatePath("/persons", "layout");
  redirect("/persons?success=deleted");
}
