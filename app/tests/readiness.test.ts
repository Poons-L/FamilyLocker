import { describe, expect, it } from 'vitest';
import { continuityScore, dependsOn, findGaps, isSinglePointOfFailure, topActions, visibleTo } from '../lib/readiness';
import { DEMO_TODAY, items, people, priority } from '../lib/demo-household';
import type { Item } from '../lib/types';

const base: Item = {
  id: 'x', title: 'Test item', category: 'insurance', ownerId: 'arun', concerns: ['arun'],
  location: 'Study drawer', lastVerifiedOn: '2026-10-01', knows: ['arun', 'meera'], canOpen: ['arun', 'meera'],
  responsibleId: 'arun', backupId: 'meera', critical: true, emergencies: ['medical'],
};

describe('findGaps', () => {
  it('finds nothing for a well-covered item', () => {
    expect(findGaps(base, people, DEMO_TODAY)).toEqual([]);
  });
  it('flags an item only one person knows about', () => {
    const g = findGaps({ ...base, knows: ['arun'], canOpen: ['arun'] }, people, DEMO_TODAY);
    expect(g.map((x) => x.kind)).toContain('unshared');
    expect(g[0].message).toBe('Only Arun knows this exists.');
  });
  it('flags someone who knows but cannot open it', () => {
    const g = findGaps({ ...base, canOpen: ['arun'] }, people, DEMO_TODAY);
    expect(g.find((x) => x.kind === 'inaccessible')?.message).toBe("Meera knows about it but can't open it.");
  });
  it('flags missing responsibility and missing backup separately', () => {
    expect(findGaps({ ...base, responsibleId: null, backupId: null }, people, DEMO_TODAY).map((g) => g.kind)).toContain('unassigned');
    expect(findGaps({ ...base, backupId: null }, people, DEMO_TODAY).map((g) => g.kind)).toContain('no_backup');
  });
  it('flags missing location, expiry within 90 days and stale info', () => {
    const kinds = findGaps({ ...base, location: '', expiresOn: '2027-01-10', lastVerifiedOn: '2024-01-01' }, people, DEMO_TODAY).map((g) => g.kind);
    expect(kinds).toEqual(expect.arrayContaining(['missing_location', 'expiring', 'stale']));
  });
});

describe('single points of failure', () => {
  it('ignores non-critical items', () => {
    expect(isSinglePointOfFailure({ ...base, critical: false, knows: ['arun'] })).toBe(false);
  });
  it('treats a missing backup as a dependency', () => {
    expect(isSinglePointOfFailure({ ...base, backupId: null })).toBe(true);
  });
  it('names the person the item depends on', () => {
    expect(dependsOn({ ...base, knows: ['arun'], canOpen: ['arun'] })).toBe('arun');
  });
  it('finds real dependencies in the demo household', () => {
    const onArun = items.filter(isSinglePointOfFailure).filter((i) => dependsOn(i) === 'arun');
    expect(onArun.length).toBeGreaterThanOrEqual(8);
  });
});

describe('continuityScore', () => {
  it('is between 0 and 100 and weights add to 100', () => {
    const s = continuityScore(items, DEMO_TODAY);
    expect(s.total).toBeGreaterThan(0);
    expect(s.total).toBeLessThan(100);
    expect(s.parts.reduce((a, p) => a + p.weight, 0)).toBe(100);
  });
  it('goes up when a dependency is fixed', () => {
    const before = continuityScore(items, DEMO_TODAY).total;
    const fixed = items.map((i) => (i.id === 'empIns' ? { ...i, knows: ['arun', 'meera'], canOpen: ['arun', 'meera'], backupId: 'meera' } : i));
    expect(continuityScore(fixed, DEMO_TODAY).total).toBeGreaterThan(before);
  });
});

describe('topActions', () => {
  it('never returns more than three and leads with the highest priority', () => {
    const a = topActions(items, people, 3, priority);
    expect(a).toHaveLength(3);
    expect(a[0]).toMatchObject({ itemId: 'empIns', label: 'Give Meera access to Employer health & life insurance' });
  });
});

describe('visibleTo (search permission rule, PRD §32)', () => {
  it('shows Kavita only what was shared with her', () => {
    const ids = visibleTo('kavita', items).map((i) => i.id);
    expect(ids).toEqual(['will']);
    expect(ids).not.toContain('hdfc');
  });
});
