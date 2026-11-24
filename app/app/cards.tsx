// Small read-only cards shared by Find and Something happened.
import Link from 'next/link';
import { CATEGORY_LABELS, type Item, type Person } from '@/lib/types';

export function ItemAnswer({ item, people }: { item: Item; people: Record<string, Person> }) {
  const name = (id: string | null) => (id && people[id]?.name) || 'Nobody yet';
  return (
    <div className="answer">
      <span className="muted small">{CATEGORY_LABELS[item.category]}</span>
      <strong><Link href={`/items/${item.id}`}>{item.title}</Link></strong>
      <dl className="facts">
        <dt>Where</dt><dd>{item.location || <span style={{ color: 'var(--crit)' }}>Not recorded</span>}</dd>
        {item.reference && <><dt>Reference</dt><dd>{item.reference}</dd></>}
        <dt>Belongs to</dt><dd>{name(item.ownerId)}</dd>
        <dt>Who knows</dt><dd>{item.knows.map((p) => name(p)).join(', ')}</dd>
        <dt>Can open</dt><dd>{item.canOpen.map((p) => name(p)).join(', ')}</dd>
        <dt>Handles it</dt><dd>{name(item.responsibleId)}{item.backupId ? ` · backup ${name(item.backupId)}` : ''}</dd>
        {item.notes && <><dt>Notes</dt><dd>{item.notes}</dd></>}
      </dl>
    </div>
  );
}

export function PersonLine({ person }: { person: Person }) {
  return (
    <div className="find">
      <b>{person.name}{person.relationship && <span className="muted"> · {person.relationship}</span>}</b>
      {person.phone
        ? <span>Phone: <a href={`tel:${person.phone.replace(/\s/g, '')}`} style={{ userSelect: 'all' }}>{person.phone}</a></span>
        : <span className="muted">No phone number saved. Add one on the People page.</span>}
    </div>
  );
}
