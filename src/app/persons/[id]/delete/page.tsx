import Link from "next/link";
import { notFound } from "next/navigation";
import { getPerson } from "@/lib/persons";
import { personName } from "@/lib/person-fields";
import { DeletePersonForm } from "@/components/delete-person-form";
import { requireFamilyTree } from "@/lib/family-trees";

export const metadata = { title: "Person löschen | Familytree" };
export default async function DeletePersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { familyTreeId } = await requireFamilyTree();
  const person = await getPerson(familyTreeId, (await params).id);
  if (!person) notFound();
  return <><Link href="/persons" className="back-link">← Zur Personenübersicht</Link><header className="page-heading"><div><p className="eyebrow">PERSONEN</p><h1>Person löschen</h1></div></header><section className="person-form-card"><h2>„{personName(person)}“ wirklich löschen?</h2><p className="delete-explanation">Die Person und ihre zugehörigen Verknüpfungen werden dauerhaft entfernt. Das lässt sich nicht rückgängig machen.</p><DeletePersonForm id={person.id} familyTreeId={familyTreeId} /></section></>;
}
