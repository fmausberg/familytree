"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import { login, register } from "@/app/actions/auth";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const registering = mode === "register";
  const [state, action, pending] = useActionState(registering ? register : login, {});
  const [visible, setVisible] = useState(false);
  return <form action={action} className="auth-form" aria-busy={pending}>
    <label htmlFor="email">E-Mail-Adresse</label>
    <input id="email" name="email" type="email" autoComplete="email" placeholder="du@beispiel.de" defaultValue={state.email} required maxLength={254} />
    <label htmlFor="password">Passwort</label>
    <div className="password-field"><input id="password" name="password" type={visible ? "text" : "password"} autoComplete={registering ? "new-password" : "current-password"} required /><button type="button" className="show-password" onClick={() => setVisible(!visible)} aria-label={visible ? "Passwort verbergen" : "Passwort anzeigen"} aria-pressed={visible}>{visible ? "Verbergen" : "Anzeigen"}</button></div>
    {registering && <><label htmlFor="confirmPassword">Passwort wiederholen</label><input id="confirmPassword" name="confirmPassword" type={visible ? "text" : "password"} autoComplete="new-password" required /></>}
    <div aria-live="polite" aria-atomic="true">{state.error && <p className="form-error" role="alert">{state.error}</p>}</div>
    <button className="button primary" type="submit" disabled={pending}>{pending ? "Einen Moment …" : registering ? "Konto erstellen" : "Anmelden"}<span aria-hidden="true">→</span></button>
    <p className="auth-switch">{registering ? "Schon ein Konto?" : "Noch kein Konto?"} <Link href={registering ? "/login" : "/register"}>{registering ? "Jetzt anmelden" : "Jetzt registrieren"}</Link></p>
  </form>;
}
