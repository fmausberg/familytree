import Link from "next/link";
import { Suspense } from "react";
import { requireFamilyTree } from "@/lib/family-trees";
import { logout } from "@/app/actions/auth";

// This private area validates the database session on each request.
export const instant = false;

export default function PersonsLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<p className="management-main" role="status">Personenverwaltung wird geladen …</p>}><ProtectedPersonsLayout>{children}</ProtectedPersonsLayout></Suspense>;
}

async function ProtectedPersonsLayout({ children }: { children: React.ReactNode }) {
  const { user, familyTree } = await requireFamilyTree();
  return <div className="management-shell">
    <aside className="management-sidebar">
      <span className="brand"><span className="brand-icon" aria-hidden="true">✳</span> familytree</span>
      <p className="sidebar-tree-name">{familyTree.name}</p>
      <nav aria-label="Hauptnavigation"><Link href="/persons" className="nav-item" aria-current="page"><span aria-hidden="true">♧</span>Personen</Link></nav>
      <div className="sidebar-account"><span>{user.email}</span><form action={logout}><button type="submit" className="button sidebar-logout">Abmelden</button></form></div>
    </aside>
    <main className="management-main">{children}</main>
  </div>;
}
