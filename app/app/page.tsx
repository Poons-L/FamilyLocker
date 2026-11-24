// Family Home (PRD §16), plus the signed-out landing page and first-run setup (PRD §42).
import Link from 'next/link';
import { Nav } from './nav';
import { cancelHandover, completeHandover, createHousehold, requestHandover } from './actions';
import { hasHousehold, loadHousehold } from '@/lib/household';
import { supabaseConfigured } from '@/lib/supabase/server';
import { continuityScore, dependsOn, findGaps, isSinglePointOfFailure, topActions } from '@/lib/readiness';
import { CATEGORY_LABELS, type Item } from '@/lib/types';
import type { HouseholdData } from '@/lib/household';

export const dynamic = 'force-dynamic';

export default async function Home({ searchParams }: { searchParams: Promise<{ error?: string; joined?: string; saved?: string; handover?: string; cancelled?: string }> }) {
  const { error, joined, saved, handover, cancelled } = await searchParams;
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

  if (!d.isAdmin) return <MemberHome d={d} joined={Boolean(joined)} error={error} />;

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
      {saved && <p className="ok">Saved. Your readiness has been updated.</p>}
      {handover && <p className="ok">Handover complete. You&apos;re now an owner of {d.householdName}.</p>}
      {cancelled && <p className="ok">Handover cancelled. Nothing has changed.</p>}
      {error && <p className="err">{error}</p>}
      {d.handoverRequestedAt && d.successorId && (
        <section className="panel callout" role="alert">
          <h2>{d.people[d.successorId]?.name} has asked to take over</h2>
          <p>They asked on {fmtDate(d.handoverRequestedAt)}. Unless you cancel, they can take over from <strong>{fmtDate(d.handoverRequestedAt, 7)}</strong> and open the things you&apos;ve set aside for them.</p>
          <form action={cancelHandover}><button className="btn" type="submit">I&apos;m fine. Cancel this</button></form>
        </section>
      )}

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
                    <Link className="rowlink" href={`/items/${i.id}`}>
                      <span><strong>{i.title}</strong><br /><span className="muted">{CATEGORY_LABELS[i.category]} · {i.location || 'Location not recorded'}</span></span>
                      <span>{isSinglePointOfFailure(i) ? <span className="tag">Depends on {d.people[dependsOn(i)]?.name}</span> : g.length === 0 ? <span className="tag okt">Covered</span> : null}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <p className="muted small">Tap anything to change where it is or who can see it.</p>
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

// What an invited family member sees: only what's been shared with them, and what they're asked to handle.
function MemberHome({ d, joined, error }: { d: HouseholdData; joined: boolean; error?: string }) {
  const owner = Object.values(d.people).find((p) => p.isMember && p.relationship === 'Self')?.name ?? 'Your family';
  const handle = d.items.filter((i) => i.responsibleId === d.meId);
  const backup = d.items.filter((i) => i.backupId === d.meId);
  const row = (i: Item) => (
    <li key={i.id}>
      <Link className="rowlink" href={`/items/${i.id}`}>
        <span><strong>{i.title}</strong><br /><span className="muted">{i.location || 'Location not recorded'}</span></span>
      </Link>
    </li>
  );
  return (
    <main>
      <Nav household={d.householdName} />
      <header><h1>{d.householdName}</h1></header>
      {joined && <p className="ok">Welcome, {d.people[d.meId]?.name}. You&apos;ve joined {d.householdName}.</p>}
      {error && <p className="err">{error}</p>}
      {d.successorId === d.meId && <SuccessorPanel d={d} owner={owner} />}
      <section className="panel">
        <p className="big">{owner} has shared <strong>{d.items.length}</strong> important {d.items.length === 1 ? 'thing' : 'things'} with you.</p>
        <p className="muted">If something happens, this is where you&apos;ll find where things are and who to call.</p>
      </section>
      {handle.length > 0 && <section className="panel"><h2>You handle</h2><ul className="plain">{handle.map(row)}</ul></section>}
      {backup.length > 0 && <section className="panel"><h2>You&apos;re the backup for</h2><ul className="plain">{backup.map(row)}</ul></section>}
      <section className="panel">
        <h2>Everything shared with you</h2>
        {d.items.length ? <ul className="plain">{d.items.map(row)}</ul> : <p className="muted">Nothing yet. {owner} can share things with you from their FamilyOS.</p>}
      </section>
    </main>
  );
}

function fmtDate(iso: string, addDays = 0) {
  return new Date(new Date(iso).getTime() + addDays * 86_400_000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function SuccessorPanel({ d, owner }: { d: HouseholdData; owner: string }) {
  const requested = d.handoverRequestedAt;
  const ready = requested ? Date.now() >= new Date(requested).getTime() + 7 * 86_400_000 : false;
  return (
    <section className="panel">
      <h2>You&apos;re {owner}&apos;s named successor</h2>
      {!requested && (
        <>
          <p className="muted">If {owner} can&apos;t manage things (illness, an accident, or worse), you can take over. {owner} will have 7 days to cancel, and you&apos;ll get the things {owner} has set aside for you.</p>
          <details>
            <summary className="linkbtn">Something has happened. Ask to take over</summary>
            <form action={requestHandover} className="stack" style={{ marginTop: 10 }}>
              <p className="muted small">{owner} will see your request and can cancel it within 7 days.</p>
              <button className="btn" type="submit">Yes, ask to take over</button>
            </form>
          </details>
        </>
      )}
      {requested && !ready && (
        <p>You asked on {fmtDate(requested)}. If {owner} doesn&apos;t cancel, you can take over from <strong>{fmtDate(requested, 7)}</strong>.</p>
      )}
      {requested && ready && (
        <form action={completeHandover} className="stack">
          <p>The 7 days have passed and {owner} hasn&apos;t cancelled.</p>
          <button className="btn" type="submit">Take over now</button>
        </form>
      )}
    </section>
  );
}
