"use client";
import { useActionState } from "react";
import { addFamilyTree } from "@/app/actions/family-trees";
import type { FamilyTreeFormState } from "@/app/actions/family-trees";

export function FamilyTreeForm() {
  const initial: FamilyTreeFormState = {};
  const [state, action, pending] = useActionState(addFamilyTree, initial);
  return <form action={action} className="person-form" aria-busy={pending}>
    <div className="person-field"><label htmlFor="name">Name des Stammbaums</label><input id="name" name="name" required maxLength={200} defaultValue={state.name} placeholder="Zum Beispiel: Familie Müller" /></div>
    <p className="hint">Du wirst automatisch Owner dieses Stammbaums.</p>
    <div aria-live="polite">{state.error && <p className="form-error" role="alert">{state.error}</p>}</div>
    <div className="person-form-actions"><button className="button primary" type="submit" disabled={pending}>{pending ? "Wird angelegt …" : "Stammbaum anlegen"}</button></div>
  </form>;
}
