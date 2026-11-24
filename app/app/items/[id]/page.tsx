// One item: see it, and (if it's yours) change where it is and who knows, can open and handles it.
import { notFound, redirect } from 'next/navigation';
import { Nav } from '../../nav';
import { updateItem } from '../../actions';
import { hasHousehold, loadHousehold } from '@/lib/household';
import { findGaps } from '@/lib/readiness';
import { CATEGORY_LABELS } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function ItemPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params;
  const { error } = await searchParams;
  const d = await loadHousehold();
  if (!hasHousehold(d)) redirect('/');
  const item = d.items.find((i) => i.id === id);
  if (!item) notFound();

  const canEdit = item.createdBy === d.userId || item.ownerId === d.meId;
  const people = Object.values(d.people);
  const others = people.filter((p) => p.id !== item.ownerId);
  const name = (pid: string | null) => (pid && d.people[pid]?.name) || 'Nobody yet';
  const gaps = findGaps(item, d.people, new Date());

  return (
    <main>
      <Nav household={d.householdName} />
      <header>
        <p className="muted small">{CATEGORY_LABELS[item.category]} · belongs to {name(item.ownerId)}</p>
        <h1>{item.title}</h1>
      </header>

      <section className="panel" aria-label="What needs attention">
        {gaps.length === 0
          ? <p className="ok">Covered. Someone else can step in on this.</p>
          : <ul className="plain">{gaps.map((g) => <li key={g.kind}>{g.message}</li>)}</ul>}
      </section>

      {!canEdit ? (
        <section className="panel">
          <dl className="facts">
            <dt>Where</dt><dd>{item.location || 'Not recorded'}</dd>
            {item.reference && <><dt>Reference</dt><dd>{item.reference}</dd></>}
            <dt>Handles it</dt><dd>{name(item.responsibleId)}{item.backupId ? ` · backup ${name(item.backupId)}` : ''}</dd>
            {item.notes && <><dt>Notes</dt><dd>{item.notes}</dd></>}
          </dl>
          <p className="muted small">Only {name(item.ownerId)} can change this.</p>
        </section>
      ) : (
        <form action={updateItem} className="stack panel">
          <input type="hidden" name="id" value={item.id} />
          {error && <p className="err">{error}</p>}
          <label>Name<input name="title" defaultValue={item.title} required /></label>
          <label>Where would your family look for this?<input name="location" defaultValue={item.location} placeholder="e.g. Bedroom cupboard, blue folder" /></label>
          <div className="row2">
            <label>Reference <small>Last few digits only</small><input name="reference" defaultValue={item.reference ?? ''} /></label>
            <label>Expires or renews on<input name="expires" type="date" defaultValue={item.expiresOn ?? ''} /></label>
          </div>
          <label className="check"><input type="checkbox" name="critical" defaultChecked={item.critical} /> This is important. Count it in our readiness.</label>
          <label className="check">
            <input type="checkbox" name="release" defaultChecked={item.releaseToSuccessor} /> If I can&apos;t manage things, my successor can open this
            {!d.successorId && <small className="muted"> (choose a successor on the People page)</small>}
          </label>

          {others.length === 0 ? (
            <p className="muted">Add people on the People page to share this.</p>
          ) : (
            <>
              <fieldset><legend>Who else knows this exists?</legend>
                {others.map((p) => <label key={p.id} className="check"><input type="checkbox" name="knows" value={p.id} defaultChecked={item.knows.includes(p.id)} /> {p.name}</label>)}
              </fieldset>
              <fieldset><legend>Who can open it in FamilyOS?</legend>
                {others.map((p) => (
                  <label key={p.id} className="check">
                    <input type="checkbox" name="canOpen" value={p.id} defaultChecked={item.canOpen.includes(p.id)} /> {p.name}
                    {!p.isMember && <small className="muted"> (once they join)</small>}
                  </label>
                ))}
              </fieldset>
            </>
          )}
          <div className="row2">
            <label>Who handles it?
              <select name="responsible" defaultValue={item.responsibleId ?? ''}><option value="">Nobody yet</option>{people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
            </label>
            <label>Backup if they can&apos;t
              <select name="backup" defaultValue={item.backupId ?? ''}><option value="">Nobody yet</option>{people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
            </label>
          </div>
          <label>Notes <small>Don&apos;t put passwords, PINs or OTPs here.</small><textarea name="notes" rows={3} defaultValue={item.notes ?? ''} /></label>
          <button className="btn" type="submit">Save changes</button>
        </form>
      )}
    </main>
  );
}
