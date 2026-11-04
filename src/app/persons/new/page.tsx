import Link from "next/link";
import { requireFamilyTree } from "@/lib/family-trees";
import { PersonForm } from "@/components/person-form";

export const metadata = { title: "Person hinzufügen | Familytree" };
export default async function NewPersonPage() {
  const { familyTreeId } = await requireFamilyTree();
  return <><Link href="/persons" className="back-link">← Zur Personenübersicht</Link><header className="page-heading"><div><p className="eyebrow">PERSONEN</p><h1>Person hinzufügen</h1><p>Halte die ersten Angaben zu einer Person fest.</p></div></header><section className="person-form-card"><PersonForm familyTreeId={familyTreeId} /></section></>;
}
