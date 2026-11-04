import Link from "next/link";
import { notFound } from "next/navigation";
import { getPerson } from "@/lib/persons";
import { PersonForm } from "@/components/person-form";
import { requireFamilyTree } from "@/lib/family-trees";

export const metadata = { title: "Person bearbeiten | Familytree" };
export default async function EditPersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { familyTreeId } = await requireFamilyTree();
  const person = await getPerson(familyTreeId, (await params).id);
  if (!person) notFound();
  return <><Link href="/persons" className="back-link">← Zur Personenübersicht</Link><header className="page-heading"><div><p className="eyebrow">PERSONEN</p><h1>Person bearbeiten</h1><p>Ergänze oder ändere die Angaben zu dieser Person.</p></div></header><section className="person-form-card"><PersonForm person={person} familyTreeId={familyTreeId} /></section></>;
}
