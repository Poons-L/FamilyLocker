import { redirect } from 'next/navigation';
import { Nav } from '../../nav';
import { addItem } from '../../actions';
import { hasHousehold, loadHousehold } from '@/lib/household';
import { CATEGORY_LABELS } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function NewItem({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const d = await loadHousehold();
  if (!hasHousehold(d)) redirect('/');
  const people = Object.values(d.people);
  const others = people.filter((p) => p.id !== d.meId);
  return (
    <main>
      <Nav household={d.householdName} />
      <h1>Add something</h1>
      <p className="muted">No upload needed. Say what it is, where your family would look for it, and who knows.</p>
      {error && <p className="err">{error}</p>}
      <form action={addItem} className="stack panel">
        <div className="row2">
          <label>What is it?<input name="title" placeholder="e.g. Star Health family floater" required /></label>
          <label>Category
            <select name="category" required defaultValue="">
              <option value="" disabled>Choose…</option>
              {Object.entries(CATEGORY_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </label>
        </div>
        <label>Where would your family look for this?<input name="location" placeholder="e.g. Bedroom cupboard, blue folder · or Policy PDF in Gmail" /></label>
        <div className="row2">
          <label>Whose is it?
            <select name="owner" defaultValue={d.meId}>{people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
          </label>
          <label>Reference <small>Last few digits only</small><input name="reference" placeholder="e.g. ending 8732" /></label>
        </div>
        <label>Expires or renews on <small>Optional</small><input name="expires" type="date" /></label>
        <label className="check"><input type="checkbox" name="critical" defaultChecked /> This is important. Count it in our readiness.</label>

        {others.length === 0 ? (
          <p className="muted">Add people on the People page to say who else knows about this.</p>
        ) : (
          <>
            <fieldset><legend>Who else knows this exists?</legend>
              {others.map((p) => <label key={p.id} className="check"><input type="checkbox" name="knows" value={p.id} /> {p.name}</label>)}
            </fieldset>
            <fieldset><legend>Who can open it in FamilyOS?</legend>
              {others.map((p) => (
                <label key={p.id} className="check">
                  <input type="checkbox" name="canOpen" value={p.id} /> {p.name}
                  {!p.isMember && <small className="muted"> (once they join)</small>}
                </label>
              ))}
            </fieldset>
          </>
        )}
        <div className="row2">
          <label>Who handles it?
            <select name="responsible" defaultValue={d.meId}><option value="">Nobody yet</option>{people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
          </label>
          <label>Backup if they can&apos;t
            <select name="backup" defaultValue=""><option value="">Nobody yet</option>{people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
          </label>
        </div>
        <label>Notes <small>Don&apos;t put passwords, PINs or OTPs here.</small><textarea name="notes" rows={3} /></label>
        <button className="btn" type="submit">Save</button>
      </form>
    </main>
  );
}
