"use client";
import { useActionState } from "react";
import { addMember, changeMemberRole, transferOwnership } from "@/app/actions/family-trees";
import type { FamilyTreeFormState } from "@/app/actions/family-trees";

type Member = { userId: string; role: "OWNER" | "ADMIN" | "MEMBER"; user: { email: string | null; name: string | null } };

function Feedback({ state }: { state: FamilyTreeFormState }) {
  return <div aria-live="polite">{state.error && <p className="form-error" role="alert">{state.error}</p>}{state.success && <p className="success-message" role="status">{state.success}</p>}</div>;
}

function MemberRoleForm({ familyTreeId, member }: { familyTreeId: string; member: Member }) {
  const initial: FamilyTreeFormState = {};
  const [state, action, pending] = useActionState(changeMemberRole.bind(null, familyTreeId, member.userId), initial);
  return <form action={action} aria-busy={pending}><div className="member-form-row"><select name="role" defaultValue={member.role} aria-label={`Rolle für ${member.user.email ?? "Mitglied"}`} disabled={pending}><option value="MEMBER">Member</option><option value="ADMIN">Admin</option></select><button type="submit" className="button secondary" disabled={pending}>{pending ? "Wird gespeichert …" : "Rolle speichern"}</button></div><Feedback state={state} /></form>;
}

function OwnershipForm({ familyTreeId, member }: { familyTreeId: string; member: Member }) {
  const initial: FamilyTreeFormState = {};
  const [state, action, pending] = useActionState(transferOwnership.bind(null, familyTreeId, member.userId), initial);
  return <details className="ownership-details"><summary>Ownership an dieses Mitglied übertragen</summary><form action={action} aria-busy={pending}><p className="hint">{member.user.email ?? "Dieses Mitglied"} wird alleiniger Owner. Du wirst Admin und kannst die Ownership anschließend nicht selbst zurückholen.</p><label className="delete-confirmation"><input type="checkbox" name="confirm" value="yes" required disabled={pending} />Ich bestätige die Übertragung.</label><button className="button secondary" type="submit" disabled={pending}>{pending ? "Wird übertragen …" : "Ownership übertragen"}</button><Feedback state={state} /></form></details>;
}

export function FamilyTreeMembers({ familyTreeId, isOwner, members }: { familyTreeId: string; isOwner: boolean; members: Member[] }) {
  const initial: FamilyTreeFormState = {};
  const [state, action, pending] = useActionState(addMember.bind(null, familyTreeId), initial);
  return <details className="family-members"><summary>Mitglieder verwalten</summary><p className="hint">Owner und Admins verwalten Mitglieder. Alle Mitglieder können die Familiendaten gemeinsam bearbeiten.</p>
    <ul className="member-list">{members.map(member => <li key={member.userId}><div className="member-identity"><strong>{member.user.email ?? member.user.name ?? "Mitglied"}</strong><span>{member.role === "OWNER" ? "Owner" : member.role === "ADMIN" ? "Admin" : "Member"}</span></div>{member.role !== "OWNER" && <><MemberRoleForm familyTreeId={familyTreeId} member={member} />{isOwner && <OwnershipForm familyTreeId={familyTreeId} member={member} />}</>}</li>)}</ul>
    <form action={action} className="person-form" aria-busy={pending}><h2>Mitglied hinzufügen</h2><p className="hint">Die Person benötigt bereits ein registriertes Konto.</p><div className="person-field"><label htmlFor="member-email">E-Mail-Adresse</label><input id="member-email" name="email" type="email" required maxLength={254} autoComplete="off" defaultValue={state.email} /></div><div className="person-field"><label htmlFor="member-role">Rolle</label><select id="member-role" name="role" defaultValue="MEMBER"><option value="MEMBER">Member</option><option value="ADMIN">Admin</option></select></div><Feedback state={state} /><div className="person-form-actions"><button type="submit" className="button primary" disabled={pending}>{pending ? "Wird hinzugefügt …" : "Mitglied hinzufügen"}</button></div></form>
  </details>;
}
