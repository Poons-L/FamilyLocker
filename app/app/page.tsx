// Family Home (PRD §16), plus the signed-out landing page and first-run setup (PRD §42).
import Link from 'next/link';
import { Nav } from './nav';
import { createHousehold } from './actions';
import { hasHousehold, loadHousehold } from '@/lib/household';
import { supabaseConfigured } from '@/lib/supabase/server';
import { continuityScore, dependsOn, findGaps, isSinglePointOfFailure, topActions } from '@/lib/readiness';
import { CATEGORY_LABELS } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function Home({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  if (!supabaseConfigured()) return <Landing />;
  const d = await loadHousehold();

  if (!d.userId) return <Landing />;

  if (!hasHousehold(d)) {
    return (
      <main>
        <Nav />
        <section className="panel">
          <h1>Let&apos;s set up your family</h1>
          <p className="muted">If you couldn&apos;t manage anything for the next 30 days, what would break? We&apos;ll help you find out. Start with two names.</p>
          {error && <p className="err">{error}</p>}
          <form action={createHousehold} className="stack">
            <label>What should we call your household?<input name="household" placeholder="e.g. The Mehta family" required /></label>
            <label>Your first name<input name="me" placeholder="e.g. Arun" required /></label>
            <button className="btn" type="submit">Create my household</button>
          </form>
        </section>
      </main>
    );
  }

  const today = new Date();
  const score = continuityScore(d.items, today);
  const spofs = d.items.filter(isSinglePointOfFailure);
  const onMe = spofs.filter((i) => dependsOn(i) === d.meId).length;
  const actions = topActions(d.items, d.people, 3);
  const members = Object.values(d.people);
  const critical = d.items.filter((i) => i.critical);
  const me = d.people[d.meId]?.name ?? 'you';

  return (
    <main>
      <Nav household={d.householdName} />
      <header><h1>{d.householdName}</h1></header>

      {d.items.length === 0 ? (
        <section className="panel">
          <h2>Add the first few things</h2>
          <p className="muted">Start with what would hurt most if nobody could find it: health insurance, the will, the locker, the main bank account. You don&apos;t need to upload anything, just say what it is and where it lives.</p>
          <p><Link className="btn" href="/items/new">Add something</Link></p>
          <p className="muted small">Add the people who matter first, so you can say who knows about each thing. <Link href="/people">Add people</Link></p>
        </section>
      ) : (
        <>
          <section className="panel" aria-label="Family continuity">
            <span className="score">{score.total}% prepared</span>
            <p className="big">{onMe > 0 ? <><em>{onMe}</em> important {onMe === 1 ? 'thing still depends' : 'things still depend'} entirely on {d.meId ? me : 'you'}.</> : 'Nothing important depends on just you right now.'}</p>
            <p className="muted">A rough guide, not a precise measure. Mark things as important to include them.</p>
          </section>

          {actions.length > 0 && (
            <section className="panel">
              <h2>Do these next</h2>
              <ol>{actions.map((a) => <li key={a.itemId}><strong>{a.label}</strong><br /><span className="muted">{a.why}</span></li>)}</ol>
            </section>
          )}

          <section className="panel">
            <h2>Everything we have</h2>
            <ul className="plain">
              {d.items.map((i) => {
                const g = findGaps(i, d.people, today);
                return (
                  <li key={i.id}>
                    <span><strong>{i.title}</strong><br /><span className="muted">{CATEGORY_LABELS[i.category]} · {i.location || 'Location not recorded'}</span></span>
                    <span>{isSinglePointOfFailure(i) ? <span className="tag">Depends on {d.people[dependsOn(i)]?.name}</span> : g.length === 0 ? <span className="tag okt">Covered</span> : null}</span>
                  </li>
                );
              })}
            </ul>
            <p><Link className="btn" href="/items/new">Add something</Link></p>
          </section>

          {critical.length > 0 && (
            <section className="panel">
              <h2>Who knows what</h2>
              {critical.filter((i) => i.knows.length === 1).map((i) => (
                <p key={i.id} className="callout">Only {d.people[i.knows[0]]?.name} currently knows about {i.title}.</p>
              ))}
              <div className="tablewrap">
                <table>
                  <thead><tr><th scope="col">Item</th>{members.map((m) => <th key={m.id} scope="col">{m.name}</th>)}</tr></thead>
                  <tbody>
                    {critical.map((i) => (
                      <tr key={i.id}>
                        <th scope="row" style={{ fontWeight: 500 }}>{i.title}</th>
                        {members.map((m) => <td key={m.id}>{i.knows.includes(m.id) ? (i.canOpen.includes(m.id) ? '✓ can open' : '✓ knows') : <span className="muted">no</span>}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </main>
  );
}

function Landing() {
  return (
    <main>
      <Nav />
      <section className="panel">
        <h1>If you couldn&apos;t manage the family tomorrow, what would break?</h1>
        <p className="muted">FamilyOS finds the parts of your family&apos;s life that depend entirely on you, and helps you make sure somebody else can step in.</p>
        <p style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link className="btn" href="/login">Get started</Link>
          <Link className="linkbtn" href="/demo">See a demo family</Link>
        </p>
      </section>
    </main>
  );
}
