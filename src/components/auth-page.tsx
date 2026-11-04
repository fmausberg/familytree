import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { AuthForm } from "@/components/auth-form";

export async function AuthPage({ mode }: { mode: "login" | "register" }) {
  if (await getCurrentUser()) redirect("/persons");
  const registering = mode === "register";
  return <main className="auth-shell">
    <section className="story-panel"><Link href="/" className="brand"><span className="brand-icon" aria-hidden="true">✳</span> familytree</Link><div className="story-copy"><p className="eyebrow">DEINE FAMILIE. EURE GESCHICHTE.</p><h1>Alles beginnt<br />mit euren Wurzeln.</h1><p>Ein Ort für die Menschen, die euch verbinden. Bewahre eure Familiengeschichte und lass sie weiterwachsen.</p><div className="tree-art" aria-hidden="true"><span>✳</span><i /><div><b>♡</b><b>⌂</b><b>✳</b></div></div></div><p className="story-footer">Für Erinnerungen, die bleiben.</p></section>
    <section className="form-panel"><div className="auth-card"><Link href="/" className="back-link">← Zur Startseite</Link><p className="eyebrow">WILLKOMMEN BEI FAMILYTREE</p><h2>{registering ? "Deine Geschichte beginnt hier." : "Schön, dass du wieder da bist."}</h2><p className="intro">{registering ? "Erstelle dein Konto mit E-Mail-Adresse und Passwort. Du kannst direkt loslegen." : "Melde dich mit deiner E-Mail-Adresse und deinem Passwort an."}</p><AuthForm mode={mode} /></div></section>
  </main>;
}
