// Readiness Engine (PRD §28–30). Deterministic, explainable rules. No AI.
// Everything here is pure so it can run on the server, in tests, or offline.

import type { Category, Gap, Item, Person, PersonId } from './types';

const DAY_MS = 86_400_000;
export const EXPIRY_WINDOW_DAYS = 90;
export const STALE_AFTER_DAYS = 540; // ~18 months

const daysBetween = (from: Date, to: Date) => Math.round((to.getTime() - from.getTime()) / DAY_MS);
const isUnrecorded = (loc: string) => !loc.trim() || /not recorded/i.test(loc);

export function findGaps(item: Item, people: Record<PersonId, Person>, today: Date): Gap[] {
  const name = (id: PersonId | null | undefined) => (id && people[id]?.name) || 'Nobody';
  const gaps: Gap[] = [];

  if (item.knows.length < 2) {
    gaps.push({ kind: 'unshared', severity: 'critical', message: `Only ${name(item.knows[0])} knows this exists.` });
  }
  const knowsButCantOpen = item.knows.filter((p) => !item.canOpen.includes(p));
  if (knowsButCantOpen.length) {
    gaps.push({
      kind: 'inaccessible', severity: 'warning',
      message: `${knowsButCantOpen.map(name).join(', ')} knows about it but can't open it.`,
    });
  }
  if (!item.responsibleId) {
    gaps.push({ kind: 'unassigned', severity: 'critical', message: 'Nobody is responsible for handling this.' });
  } else if (!item.backupId) {
    gaps.push({
      kind: 'no_backup', severity: 'warning',
      message: `If ${name(item.responsibleId)} can't handle this, nobody is lined up.`,
    });
  }
  if (isUnrecorded(item.location)) {
    gaps.push({ kind: 'missing_location', severity: 'warning', message: 'Where would your family look for this? Not recorded yet.' });
  }
  if (item.expiresOn) {
    const d = daysBetween(today, new Date(item.expiresOn));
    if (d <= EXPIRY_WINDOW_DAYS) {
      gaps.push({ kind: 'expiring', severity: 'warning', message: d < 0 ? `Expired ${-d} days ago.` : `Expires in ${d} days.` });
    }
  }
  const age = daysBetween(new Date(item.lastVerifiedOn), today);
  if (age > STALE_AFTER_DAYS) {
    gaps.push({ kind: 'stale', severity: 'warning', message: `Not checked in ${Math.round(age / 30)} months.` });
  }
  return gaps;
}

/** PRD §17: a critical item that only one person knows, can open, or handles without a backup. */
export function isSinglePointOfFailure(item: Item): boolean {
  return item.critical && (
    item.knows.length < 2 || item.canOpen.length < 2 || !item.responsibleId || !item.backupId
  );
}

/** The person the item currently depends on. */
export function dependsOn(item: Item): PersonId {
  if (item.knows.length < 2) return item.knows[0] ?? item.ownerId;
  if (item.canOpen.length < 2) return item.canOpen[0] ?? item.ownerId;
  return item.responsibleId ?? item.ownerId;
}

export interface ScorePart { label: string; weight: number; value: number }
export interface ContinuityScore { total: number; parts: ScorePart[] }

const COVERAGE_CATEGORIES: Category[] = [
  'identity', 'money', 'insurance', 'property', 'legal', 'medical', 'work', 'children', 'digital', 'bills',
];

/** PRD §30. Weights are a starting hypothesis and must be tested. */
export function continuityScore(items: Item[], today: Date): ContinuityScore {
  const critical = items.filter((i) => i.critical);
  const share = (arr: Item[], f: (i: Item) => boolean) => (arr.length ? arr.filter(f).length / arr.length : 0);

  const coverage = COVERAGE_CATEGORIES.filter((c) => items.some((i) => i.category === c)).length / COVERAGE_CATEGORIES.length;
  const sharedKnowledge = share(critical, (i) => i.knows.length >= 2);
  const access = share(critical, (i) => i.canOpen.length >= 2);
  const responsibility = critical.length
    ? critical.reduce((s, i) => s + (i.responsibleId ? 0.5 : 0) + (i.backupId ? 0.5 : 0), 0) / critical.length
    : 0;
  const freshness = share(items, (i) => daysBetween(new Date(i.lastVerifiedOn), today) <= STALE_AFTER_DAYS);
  const emergencyItems = critical.filter((i) => i.emergencies.length > 0);
  const emergencyPrep = share(emergencyItems, (i) => i.knows.length >= 2 && !isUnrecorded(i.location));

  const parts: ScorePart[] = [
    { label: 'Coverage', weight: 25, value: coverage },
    { label: 'Shared knowledge', weight: 20, value: sharedKnowledge },
    { label: 'Access', weight: 20, value: access },
    { label: 'Responsibility', weight: 20, value: responsibility },
    { label: 'Freshness', weight: 10, value: freshness },
    { label: 'Emergency prep', weight: 5, value: emergencyPrep },
  ];
  const total = Math.round(parts.reduce((s, p) => s + p.value * p.weight, 0));
  return { total, parts };
}

export interface SuggestedAction { itemId: string; label: string; why: string }

/** Top actions for Family Home (PRD §16): never more than `limit`. */
export function topActions(
  items: Item[], people: Record<PersonId, Person>, limit = 3, priority: Record<string, number> = {},
): SuggestedAction[] {
  const name = (id: PersonId | null) => (id && people[id]?.name) || 'someone';
  const backupFor = (i: Item) => {
    const spouse = Object.values(people).find((p) => p.isMember && p.id !== i.ownerId && p.relationship === 'Spouse');
    return spouse?.id ?? Object.values(people).find((p) => p.isMember && p.id !== i.ownerId)?.id ?? null;
  };
  return items
    .filter(isSinglePointOfFailure)
    .sort((a, b) => (priority[a.id] ?? 99) - (priority[b.id] ?? 99))
    .slice(0, limit)
    .map((i) => {
      if (i.knows.length < 2 || i.canOpen.length < 2) {
        return { itemId: i.id, label: `Give ${name(backupFor(i))} access to ${i.title}`, why: `Right now only ${name(dependsOn(i))} can find this.` };
      }
      if (!i.responsibleId) {
        return { itemId: i.id, label: `Assign someone to handle ${i.title}`, why: 'Nobody is responsible for this today.' };
      }
      return { itemId: i.id, label: `Pick a backup for ${i.title}`, why: `If ${name(i.responsibleId)} can't do it, nobody steps in.` };
    });
}

/**
 * PRD §32: search must never bypass permissions. This filter runs BEFORE any
 * search ranking or AI processing. The database enforces the same rule (RLS);
 * this is the application-level second layer.
 */
export function visibleTo(viewerId: PersonId, items: Item[]): Item[] {
  return items.filter((i) => i.ownerId === viewerId || i.canOpen.includes(viewerId));
}
