"use client";
import Link from "next/link";
export default function PersonsError({ reset }: { reset: () => void }) {
  return <section className="persons-empty"><h1>Die Personen konnten nicht geladen werden.</h1><p>Bitte versuche es erneut.</p><div className="person-form-actions"><button className="button primary" onClick={reset}>Erneut versuchen</button><Link href="/persons" className="button secondary">Zur Personenübersicht</Link></div></section>;
}
