import Link from "next/link";
export default function PersonNotFound() {
  return <section className="persons-empty"><h1>Person nicht gefunden</h1><p>Diese Person ist in diesem Stammbaum nicht verfügbar.</p><Link href="/persons" className="button primary">Zur Personenübersicht</Link></section>;
}
