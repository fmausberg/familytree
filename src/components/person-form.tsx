"use client";

import Link from "next/link";
import { useActionState } from "react";
import { addPerson, editPerson } from "@/app/actions/persons";
import { genderLabels } from "@/lib/person-fields";
import type { PersonValues, PersonFormState } from "@/lib/person-fields";

type Person = { id: string; givenNames: string | null; surname: string | null; birthName: string | null; gender: string | null };
const fields = [
  { name: "givenNames", label: "Vorname(n)" },
  { name: "surname", label: "Nachname(n)" },
  { name: "birthName", label: "Geburtsname" },
] as const;

export function PersonForm({ person, familyTreeId }: { person?: Person; familyTreeId: string }) {
  const action = person ? editPerson.bind(null, familyTreeId, person.id) : addPerson.bind(null, familyTreeId);
  const initial: PersonFormState = {};
  const [state, formAction, pending] = useActionState(action, initial);
  const values: PersonValues = state.values ?? {
    givenNames: person?.givenNames ?? "",
    surname: person?.surname ?? "",
    birthName: person?.birthName ?? "",
    gender: person?.gender ?? "",
  };

  return <form action={formAction} className="person-form" aria-busy={pending}>
    <p className="hint">Alle Felder sind optional. Du kannst fehlende Angaben später ergänzen.</p>
    <fieldset disabled={pending}>
      {fields.map(({ name, label }) => <div className="person-field" key={name}>
        <label htmlFor={name}>{label}</label>
        <input id={name} name={name} defaultValue={values[name]} autoComplete="off" aria-invalid={!!state.errors?.[name]} aria-describedby={state.errors?.[name] ? `${name}-error` : undefined} />
        {state.errors?.[name] && <p id={`${name}-error`} className="field-error">{state.errors[name]}</p>}
      </div>)}
      <div className="person-field"><label htmlFor="gender">Geschlecht</label>
        <select id="gender" name="gender" defaultValue={values.gender} aria-invalid={!!state.errors?.gender} aria-describedby={state.errors?.gender ? "gender-error" : undefined}>
          <option value="">Keine Angabe</option>
          {Object.entries(genderLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        {state.errors?.gender && <p className="field-error" id="gender-error">{state.errors.gender}</p>}
      </div>
    </fieldset>
    <div aria-live="polite">{state.error && <p className="form-error" role="alert">{state.error}</p>}</div>
    <div className="person-form-actions"><button type="submit" className="button primary" disabled={pending}>{pending ? "Wird gespeichert …" : person ? "Änderungen speichern" : "Person hinzufügen"}</button><Link href="/persons" className="button secondary">Abbrechen</Link></div>
  </form>;
}
