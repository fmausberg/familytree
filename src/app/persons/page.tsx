import Link from "next/link";
import { listPersons } from "@/lib/persons";
import { genderLabels, personName } from "@/lib/person-fields";
import { requireFamilyTree, canManageMembers, listFamilyTreeMembers } from "@/lib/family-trees";
import { FamilyTreeMembers } from "@/components/family-tree-members";

export const metadata = { title: "Personen | Familytree" };
const messages: Record<string, string> = {
  created: "Die Person wurde hinzugefügt.",
  updated: "Die Änderungen wurden gespeichert.",
  deleted: "Die Person wurde gelöscht.",
};

export default async function PersonsPage({ searchParams }: { searchParams: Promise<{ success?: string | string[] }> }) {
  const context = await requireFamilyTree();
  const persons = await listPersons(context.familyTreeId);
  const members = canManageMembers(context) ? await listFamilyTreeMembers(context.familyTreeId) : null;
  const { success } = await searchParams;
  const message = typeof success === "string" && Object.hasOwn(messages, success) ? messages[success] : undefined;
  return <>
    <header className="page-heading"><div><p className="eyebrow">DEINE FAMILIENGESCHICHTE</p><h1>Personen</h1><p>Verwalte die Personen in deiner Familiengeschichte.</p></div>{persons.length > 0 && <Link href="/persons/new" className="button primary">+ Person hinzufügen</Link>}</header>
    {message && <p className="success-message" role="status">{message}</p>}
    {persons.length === 0 ? <section className="persons-empty"><span className="empty-icon" aria-hidden="true">♧</span><h2>Wer gehört zu deiner Geschichte?</h2><p>Du hast noch keine Personen angelegt.<br />Füge die erste Person hinzu – fehlende Angaben kannst du später ergänzen.</p><Link href="/persons/new" className="button primary">+ Person hinzufügen</Link></section> :
      <section className="persons-table-card" aria-label="Personenübersicht"><div className="table-caption">{persons.length} {persons.length === 1 ? "Person" : "Personen"}</div><div className="table-scroll"><table className="persons-table"><caption className="sr-only">Deine Personen</caption><thead><tr><th scope="col">Vorname(n)</th><th scope="col">Nachname(n)</th><th scope="col">Geburtsname</th><th scope="col">Geschlecht</th><th scope="col">Aktionen</th></tr></thead><tbody>{persons.map(person => <tr key={person.id}><td>{person.givenNames || "–"}</td><td>{person.surname || "–"}</td><td>{person.birthName || "–"}</td><td>{person.gender ? genderLabels[person.gender] : "Keine Angabe"}</td><td><div className="row-actions"><Link href={`/persons/${person.id}/edit`} aria-label={`${personName(person)} bearbeiten`}>Bearbeiten</Link><Link href={`/persons/${person.id}/delete`} className="delete-link" aria-label={`${personName(person)} löschen`}>Löschen</Link></div></td></tr>)}</tbody></table></div></section>}
    {members && <FamilyTreeMembers familyTreeId={context.familyTreeId} isOwner={context.role === "OWNER" && context.familyTree.ownerId === context.userId} members={members} />}
  </>;
}
