import { describe, expect, it } from 'vitest';
import { searchItems } from '../lib/search';
import { items, people as demoPeople } from '../lib/demo-household';
import type { Person } from '../lib/types';

const people: Record<string, Person> = {
  ...demoPeople,
  neha: { id: 'neha', name: 'Neha Kapoor', fullName: 'Neha Kapoor', relationship: 'CA', isMember: false },
};
const arun = { personId: 'arun' };
const kavita = { personId: 'kavita' };
const ids = (r: ReturnType<typeof searchItems>) => (r.kind === 'items' ? r.items.map((i) => i.id) : []);

describe('Ask FamilyOS', () => {
  it("finds Dad's medication for a question about Dad", () => {
    expect(ids(searchItems("Where is Dad's medication?", items, people, arun))[0]).toBe('dadMeds');
  });

  it('finds the health insurance', () => {
    expect(ids(searchItems('where is our health insurance', items, people, arun))[0]).toBe('health');
  });

  it('finds the employer cover', () => {
    expect(ids(searchItems("Who knows about Arun's employer insurance?", items, people, arun))[0]).toBe('empIns');
  });

  it("returns Riya's things for \"Riya's documents\"", () => {
    expect(ids(searchItems("Where are Riya's documents?", items, people, arun))).toContain('school');
  });

  it('answers role questions with people', () => {
    const r = searchItems('Who is our CA?', items, people, arun);
    expect(r.kind === 'people' && r.people.map((p) => p.id)).toEqual(['neha']);
  });

  it('lists what depends on a person', () => {
    const r = searchItems('What depends entirely on Arun?', items, people, arun);
    expect(r.kind).toBe('depends');
    expect(r.kind === 'depends' && r.items.length).toBeGreaterThanOrEqual(8);
  });

  it('never shows anything that was not shared with the viewer (PRD §32)', () => {
    expect(searchItems("Show me Arun's bank information", items, people, kavita)).toEqual({ kind: 'none' });
    expect(ids(searchItems('will', items, people, kavita))).toEqual(['will']);
    const dep = searchItems('What depends on Arun?', items, people, kavita);
    expect(dep.kind === 'depends' && dep.items.every((i) => i.canOpen.includes('kavita'))).toBe(true);
  });

  it('says nothing found rather than guessing', () => {
    expect(searchItems('xylophone', items, people, arun)).toEqual({ kind: 'none' });
  });
});
