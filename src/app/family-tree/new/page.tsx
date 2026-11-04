import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getFamilyTreeContext } from "@/lib/family-trees";
import { FamilyTreeForm } from "@/components/family-tree-form";
import { logout } from "@/app/actions/auth";

export const metadata = { title: "Stammbaum anlegen | Familytree" };
export const instant = false;

export default async function NewFamilyTreePage() {
  const user = await requireUser();
  if (await getFamilyTreeContext(user.id)) redirect("/persons");
  return <main className="dashboard"><header><span className="brand"><span className="brand-icon" aria-hidden="true">✳</span> familytree</span><form action={logout}><button className="button secondary">Abmelden</button></form></header><section className="welcome-card"><p className="eyebrow">DEIN ARBEITSBEREICH</p><h1>Lege deinen Stammbaum an.</h1><p>Ein eigener Ort für eure Personen und Familiengeschichte. Du kannst später weitere Mitglieder hinzufügen.</p><div className="person-form-card"><FamilyTreeForm /></div></section></main>;
}
