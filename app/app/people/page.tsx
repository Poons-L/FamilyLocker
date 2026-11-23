import { redirect } from 'next/navigation';
import { Nav } from '../nav';
import { addPerson } from '../actions';
import { hasHousehold, loadHousehold } from '@/lib/household';

export const dynamic = 'force-dynamic';

export default async function People({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const d = await loadHousehold();
  if (!hasHousehold(d)) redirect('/');
  return (
    <main>
      <Nav household={d.householdName} />
      <h1>People</h1>
      <section className="panel">
        <ul className="plain">
          {Object.values(d.people).map((p) => (
            <li key={p.id}>
              <span><strong>{p.name}</strong>{p.relationship && <span className="muted"> · {p.relationship}</span>}</span>
              <span className="muted small">{p.isMember ? 'Has a login' : 'No login yet'}</span>
            </li>
          ))}
        </ul>
      </section>
      {d.isAdmin && (
        <section className="panel">
          <h2>Add someone</h2>
          <p className="muted">Family, a trusted backup or an adviser. They don&apos;t get a login yet; invites come next.</p>
          {error && <p className="err">{error}</p>}
          <form action={addPerson} className="stack">
            <div className="row2">
              <label>Name<input name="name" placeholder="e.g. Meera" required /></label>
              <label>Relationship<input name="relationship" placeholder="e.g. Spouse, Dad, CA" /></label>
            </div>
            <label>Email <small>Optional. Used for the invite later.</small><input name="email" type="email" /></label>
            <button className="btn" type="submit">Add person</button>
          </form>
        </section>
      )}
    </main>
  );
}
