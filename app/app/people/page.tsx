import { redirect } from 'next/navigation';
import { Nav } from '../nav';
import { addPerson } from '../actions';
import { InviteButton } from './invite-button';
import { hasHousehold, loadHousehold } from '@/lib/household';
import { serverClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function People({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const d = await loadHousehold();
  if (!hasHousehold(d)) redirect('/');

  const pendingFor = new Set<string>();
  if (d.isAdmin) {
    const supabase = await serverClient();
    const { data } = await supabase.from('invitations').select('person_id, expires_at').is('accepted_at', null).gt('expires_at', new Date().toISOString());
    (data ?? []).forEach((r) => pendingFor.add(r.person_id as string));
  }

  return (
    <main>
      <Nav household={d.householdName} />
      <h1>People</h1>
      {d.isAdmin && <p className="muted">Invite the people who should be able to step in. They&apos;ll only see what you share with them.</p>}
      <section className="panel">
        <ul className="plain">
          {Object.values(d.people).map((p) => (
            <li key={p.id}>
              <span>
                <strong>{p.name}</strong>{p.relationship && <span className="muted"> · {p.relationship}</span>}
                <br />
                <span className="muted small">
                  {p.id === d.meId ? 'You' : p.isMember ? 'Has joined' : pendingFor.has(p.id) ? 'Invite sent, not joined yet' : 'Not invited yet'}
                </span>
              </span>
              {d.isAdmin && !p.isMember && p.id !== d.meId && <InviteButton personId={p.id} name={p.name} pending={pendingFor.has(p.id)} />}
            </li>
          ))}
        </ul>
      </section>
      {d.isAdmin && (
        <section className="panel">
          <h2>Add someone</h2>
          <p className="muted">Family, a trusted backup or an adviser. You can invite them once they&apos;re added.</p>
          {error && <p className="err">{error}</p>}
          <form action={addPerson} className="stack">
            <div className="row2">
              <label>Name<input name="name" placeholder="e.g. Meera" required /></label>
              <label>Relationship<input name="relationship" placeholder="e.g. Spouse, Dad, CA" /></label>
            </div>
            <button className="btn" type="submit">Add person</button>
          </form>
        </section>
      )}
    </main>
  );
}
