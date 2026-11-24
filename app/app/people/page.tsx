import { redirect } from 'next/navigation';
import { Nav } from '../nav';
import { addPerson, completeHandover, setSuccessor } from '../actions';
import { InviteButton } from './invite-button';
import { hasHousehold, loadHousehold } from '@/lib/household';
import { serverClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function People({ searchParams }: { searchParams: Promise<{ error?: string; successor?: string }> }) {
  const { error, successor } = await searchParams;
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
                <strong>{p.name}</strong>{p.relationship && <span className="muted"> · {p.relationship}</span>}{p.phone && <span className="muted"> · {p.phone}</span>}
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
        <section className="panel" id="successor">
          <h2>If you can&apos;t manage FamilyOS</h2>
          <p className="muted">Name someone who can take over. They can ask to take over at any time; you get 7 days to cancel. They only see the things you&apos;ve set aside for them (tick &quot;If I can&apos;t manage things&quot; on each item). Everything else stays private.</p>
          {successor && <p className="ok">Saved.</p>}
          {(() => {
            const joined = Object.values(d.people).filter((p) => p.isMember && p.id !== d.meId);
            if (joined.length === 0) return <p className="muted">Invite someone first. Your successor needs to have joined.</p>;
            return (
              <>
                <form action={setSuccessor} className="stack">
                  <label>Your successor
                    <select name="person" defaultValue={d.successorId ?? ''}>
                      <option value="">Nobody yet</option>
                      {joined.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </label>
                  <button className="btn" type="submit">Save successor</button>
                </form>
                {d.successorId && (
                  <details>
                    <summary className="linkbtn">Hand over to {d.people[d.successorId]?.name} now</summary>
                    <form action={completeHandover} className="stack" style={{ marginTop: 10 }}>
                      <p className="muted small">{d.people[d.successorId]?.name} becomes an owner straight away and can open everything you&apos;ve set aside. You stay an owner too.</p>
                      <button className="btn" type="submit">Yes, hand over now</button>
                    </form>
                  </details>
                )}
              </>
            );
          })()}
        </section>
      )}
      {d.isAdmin && (
        <section className="panel">
          <h2>Add someone</h2>
          <p className="muted">Family, a trusted backup or an adviser. You can invite them once they&apos;re added.</p>
          {error && <p className="err">{error}</p>}
          <form action={addPerson} className="stack">
            <div className="row2">
              <label>Name<input name="name" placeholder="e.g. Meera" required /></label>
              <label>Relationship<input name="relationship" placeholder="e.g. Spouse, Dad, CA, Doctor" /></label>
            </div>
            <label>Phone <small>Optional. Shown in emergencies, e.g. for your doctor or CA.</small><input name="phone" type="tel" inputMode="tel" /></label>
            <button className="btn" type="submit">Add person</button>
          </form>
        </section>
      )}
    </main>
  );
}
