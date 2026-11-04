"use client";

import Link from "next/link";
import { useActionState } from "react";
import { removePerson } from "@/app/actions/persons";
import type { PersonFormState } from "@/lib/person-fields";

export function DeletePersonForm({ id, familyTreeId }: { id: string; familyTreeId: string }) {
  const initial: PersonFormState = {};
  const [state, action, pending] = useActionState(removePerson.bind(null, familyTreeId, id), initial);
  return <form action={action} className="delete-person-form" aria-busy={pending}>
    <label className="delete-confirmation"><input type="checkbox" name="confirm" value="yes" required disabled={pending} />Ich möchte diese Person endgültig löschen.</label>
    <div aria-live="polite">{state.error && <p className="form-error" role="alert">{state.error}</p>}</div>
    <div className="person-form-actions"><button className="button danger" type="submit" disabled={pending}>{pending ? "Wird gelöscht …" : "Endgültig löschen"}</button><Link href="/persons" className="button secondary">Abbrechen</Link></div>
  </form>;
}
