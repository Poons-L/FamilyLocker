// Family Home (PRD §16), rendered from the demo household until Supabase is connected.
import { continuityScore, dependsOn, isSinglePointOfFailure, topActions } from '@/lib/readiness';
import { DEMO_TODAY, items, people, priority } from '@/lib/demo-household';

export default function Home() {
  const score = continuityScore(items, DEMO_TODAY);
  const spofs = items.filter(isSinglePointOfFailure);
  const onArun = spofs.filter((i) => dependsOn(i) === 'arun').length;
  const actions = topActions(items, people, 3, priority);
  const members = Object.values(people).filter((p) => p.isMember);
  const onlyOne = items.filter((i) => i.critical && i.knows.length === 1);

  return (
    <main>
      <header>
        <h1>FamilyOS</h1>
        <p className="muted">The Mehta family · fictional demo data</p>
      </header>

      <section className="panel" aria-label="Family continuity">
        <span className="score">{score.total}% prepared</span>
        <p className="big"><em>{onArun}</em> important things still depend entirely on Arun.</p>
        <p className="muted">A rough guide, not a precise measure.</p>
      </section>

      <section className="panel">
        <h2>Do these next</h2>
        <ol>
          {actions.map((a) => (
            <li key={a.itemId}><strong>{a.label}</strong><br /><span className="muted">{a.why}</span></li>
          ))}
        </ol>
      </section>

      <section className="panel">
        <h2>Who knows what</h2>
        {onlyOne.map((i) => (
          <p key={i.id} className="callout">Only {people[i.knows[0]]?.name} currently knows about {i.title}.</p>
        ))}
        <div className="tablewrap">
          <table>
            <thead><tr><th scope="col">Item</th>{members.map((m) => <th key={m.id} scope="col">{m.name}</th>)}</tr></thead>
            <tbody>
              {items.filter((i) => i.critical).map((i) => (
                <tr key={i.id}>
                  <th scope="row" style={{ fontWeight: 500 }}>{i.title}</th>
                  {members.map((m) => (
                    <td key={m.id}>{i.knows.includes(m.id) ? (i.canOpen.includes(m.id) ? '✓ can open' : '✓ knows') : <span className="muted">no</span>}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
