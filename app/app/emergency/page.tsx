// Something happened (PRD §33–36): directive, calm, and built only from what the viewer can see.
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Nav } from '../nav';
import { ItemAnswer, PersonLine } from '../cards';
import { hasHousehold, loadHousehold } from '@/lib/household';
import { emergencyPlan, lostCandidates, replacementAdvice, type Scenario } from '@/lib/emergency';
import { canSee } from '@/lib/search';

export const dynamic = 'force-dynamic';

const SCENARIOS: { k: Scenario; t: string; d: string }[] = [
  { k: 'medical', t: 'Medical emergency', d: 'Hospital, accident or sudden illness' },
  { k: 'death', t: 'Death in the family', d: 'Calm steps for today, this week and later' },
  { k: 'lost', t: 'Lost documents', d: 'Find the original and how to replace it' },
];

export default async function Emergency({ searchParams }: { searchParams: Promise<{ k?: string; who?: string; item?: string }> }) {
  const sp = await searchParams;
  const d = await loadHousehold();
  if (!hasHousehold(d)) redirect('/');
  const k = SCENARIOS.find((s) => s.k === sp.k)?.k;
  const viewer = { personId: d.meId, userId: d.userId };
  const items = d.items.filter((i) => canSee(i, viewer));
  const people = Object.values(d.people);
  const owner = people.find((p) => p.relationship === 'Self');
  const who = sp.who && d.people[sp.who] ? sp.who : (owner && owner.id !== d.meId ? owner.id : people.find((p) => p.id !== d.meId)?.id ?? d.meId);
  const href = (q: Record<string, string>) => '/emergency?' + new URLSearchParams(q).toString();

  return (
    <main>
      <Nav household={d.householdName} />
      <section className="panel emg">
        <h1>{k ? SCENARIOS.find((s) => s.k === k)!.t : 'What happened?'}</h1>
        <p className="muted">{k === 'death' ? 'Take this one step at a time. Nothing here has to be done alone.' : k ? 'Do these first. Tick them off as you go.' : "Pick what's closest. We'll show only what matters right now."}</p>
        <div className="scen">
          {SCENARIOS.map((s) => (
            <Link key={s.k} href={href({ k: s.k, who })} aria-current={s.k === k}>
              <b>{s.t}</b><span className="muted small">{s.d}</span>
            </Link>
          ))}
        </div>

        {(k === 'medical' || k === 'death') && (
          <form action="/emergency" className="row2" style={{ alignItems: 'end' }}>
            <input type="hidden" name="k" value={k} />
            <label>Who is this about?
              <select name="who" defaultValue={who}>{people.map((p) => <option key={p.id} value={p.id}>{p.id === d.meId ? `${p.name} (me)` : p.name}</option>)}</select>
            </label>
            <button className="linkbtn" type="submit">Show steps</button>
          </form>
        )}

        {(k === 'medical' || k === 'death') && emergencyPlan(k, who, items, d.people, d.meId).map((phase, pi) => (
          <div key={pi} className="stack">
            {phase.label && <p className="phase">{phase.label}</p>}
            <ol className="steps">
              {phase.steps.map((st, si) => (
                <li key={si}>
                  <input type="checkbox" aria-label={`Done: ${st.title}`} />
                  <div className="stack" style={{ gap: 8 }}>
                    <strong>{st.title}</strong>
                    {st.hint && <span className="muted small">{st.hint}</span>}
                    {st.items.map((i) => <ItemAnswer key={i.id} item={i} people={d.people} />)}
                    {st.people.map((p) => <PersonLine key={p.id} person={p} />)}
                    {st.items.length === 0 && st.people.length === 0 && <div className="find gap"><b>{st.empty}</b></div>}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        ))}

        {k === 'lost' && (() => {
          const docs = lostCandidates(items);
          const sel = docs.find((i) => i.id === sp.item) ?? docs[0];
          if (!sel) return <div className="find gap"><b>No documents have been recorded or shared with you yet.</b></div>;
          return (
            <>
              <form action="/emergency" className="row2" style={{ alignItems: 'end' }}>
                <input type="hidden" name="k" value="lost" />
                <label>Which document?
                  <select name="item" defaultValue={sel.id}>{docs.map((i) => <option key={i.id} value={i.id}>{i.title}</option>)}</select>
                </label>
                <button className="linkbtn" type="submit">Show steps</button>
              </form>
              <ol className="steps">
                <li><input type="checkbox" aria-label="Done: check where it should be" /><div className="stack" style={{ gap: 8 }}><strong>Check where the original should be</strong><ItemAnswer item={sel} people={d.people} /></div></li>
                <li><input type="checkbox" aria-label="Done: ask who knows" /><div className="stack" style={{ gap: 8 }}><strong>Ask the people who know about it</strong>{sel.knows.map((p) => d.people[p]).filter(Boolean).map((p) => <PersonLine key={p.id} person={p} />)}</div></li>
                <li><input type="checkbox" aria-label="Done: replace it" /><div className="stack" style={{ gap: 8 }}><strong>If it&apos;s really gone</strong><div className="find"><span>{replacementAdvice(sel)}</span></div></div></li>
              </ol>
            </>
          );
        })()}

        <p className="muted small" style={{ borderTop: '1px solid var(--line)', paddingTop: 12 }}>
          This is a checklist, not legal or medical advice. In a medical emergency in India, call <strong>112</strong> or <strong>108</strong> first.
          {k === 'death' && ' Your lawyer and CA can confirm what applies to your family.'}
        </p>
      </section>
    </main>
  );
}
