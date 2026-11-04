import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function Home() {
  if (await getCurrentUser()) redirect("/persons");
  return <main className="landing"><header><span className="brand"><span className="brand-icon" aria-hidden="true">✳</span> familytree</span><Link href="/login" className="button secondary">Anmelden</Link></header><section><p className="eyebrow">DEINE FAMILIE. EURE GESCHICHTE.</p><h1>Gemeinsame Wurzeln.<br />Unzählige Geschichten.</h1><p>Gib eurer Familiengeschichte ein Zuhause.<br />Alles beginnt mit deinem ersten Schritt.</p><Link href="/register" className="button primary">Kostenlos registrieren <span aria-hidden="true">→</span></Link><p className="hint">Schon dabei? <Link href="/login">Jetzt anmelden</Link></p></section><footer>Für Erinnerungen, die bleiben.</footer></main>;
}
