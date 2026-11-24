// Ask FamilyOS (PRD §31): "What are you looking for?"
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Nav } from '../nav';
import { ItemAnswer, PersonLine } from '../cards';
import { hasHousehold, loadHousehold } from '@/lib/household';
import { searchItems } from '@/lib/search';

export const dynamic = 'force-dynamic';

const EXAMPLES = ["Where is Dad's health insurance?", 'Who is our CA?', 'Where are the property papers?', 'Which locker has the jewellery?', 'What depends entirely on me?'];

export default async function Find({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = '' } = await searchParams;
  const d = await loadHousehold();
  if (!hasHousehold(d)) redirect('/');
  const result = searchItems(q, d.items, d.people, { personId: d.meId, userId: d.userId });

  return (
    <main>
      <Nav household={d.householdName} />
      <h1>What are you looking for?</h1>
      <form className="searchbar" action="/find">
        <label className="sr" htmlFor="q">Search</label>
        <input id="q" name="q" type="search" defaultValue={q} placeholder="e.g. where is the health insurance?" autoFocus={!q} />
        <button className="btn" type="submit">Find</button>
      </form>
      {!d.isAdmin && <p className="muted small">You&apos;ll only find what&apos;s been shared with you.</p>}

      {!q && (
        <div className="chips">
          {EXAMPLES.map((e) => <Link key={e} className="chip" href={`/find?q=${encodeURIComponent(e)}`}>{e}</Link>)}
        </div>
      )}

      {q && result.kind === 'items' && result.items.map((i) => <ItemAnswer key={i.id} item={i} people={d.people} />)}
      {q && result.kind === 'people' && result.people.map((p) => <PersonLine key={p.id} person={p} />)}
      {q && result.kind === 'depends' && (
        result.person ? (
          <section className="panel">
            <p className="big">{result.items.length} important {result.items.length === 1 ? 'thing depends' : 'things depend'} entirely on {result.person.id === d.meId ? 'you' : result.person.name}{!d.isAdmin ? ' (among what’s shared with you)' : ''}.</p>
            <ul className="plain">{result.items.map((i) => <li key={i.id}><Link className="rowlink" href={`/items/${i.id}`}><strong>{i.title}</strong></Link></li>)}</ul>
          </section>
        ) : <p className="muted">I couldn&apos;t tell who you meant. Try a name from the People page.</p>
      )}
      {q && result.kind === 'none' && (
        <section className="panel">
          <p><strong>Nothing found{!d.isAdmin ? ' in what has been shared with you' : ''}.</strong></p>
          <p className="muted">Try a simpler word, like &quot;insurance&quot;, &quot;passport&quot; or &quot;locker&quot;. {d.isAdmin && <>Or <Link href="/items/new">add it now</Link> so your family can find it next time.</>}</p>
        </section>
      )}
    </main>
  );
}
