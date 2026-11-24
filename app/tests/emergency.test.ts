import { describe, expect, it } from 'vitest';
import { emergencyPlan, lostCandidates, replacementAdvice } from '../lib/emergency';
import { items, people } from '../lib/demo-household';

const titles = (phases: ReturnType<typeof emergencyPlan>, step: string) =>
  phases.flatMap((p) => p.steps).find((s) => s.title === step)!.items.map((i) => i.id);

describe('Medical emergency', () => {
  const plan = emergencyPlan('medical', 'arun', items, people, 'meera');
  it('starts with health insurance, including the employer cover', () => {
    expect(plan[0].steps[0].title).toBe('Find the health insurance');
    expect(titles(plan, 'Find the health insurance')).toEqual(expect.arrayContaining(['health', 'empIns']));
  });
  it('pulls in ID and the bills the person normally handles', () => {
    expect(titles(plan, 'Get their ID')).toEqual(expect.arrayContaining(['passport', 'aadhaar']));
    expect(titles(plan, 'Keep things running')).toEqual(expect.arrayContaining(['loan', 'parentsMoney']));
  });
  it("finds Dad's medication when it's about Dad", () => {
    const dad = emergencyPlan('medical', 'suresh', items, people, 'arun');
    expect(titles(dad, 'Check medication and allergies')).toEqual(['dadMeds']);
  });
  it('tells the family, without listing the person it is about or the viewer', () => {
    const fam = plan[0].steps.find((s) => s.title === 'Tell the family')!.people.map((p) => p.id);
    expect(fam).not.toContain('arun');
    expect(fam).not.toContain('meera');
  });
});

describe('Death', () => {
  const plan = emergencyPlan('death', 'arun', items, people, 'meera');
  it('runs Today, This week, Later', () => {
    expect(plan.map((p) => p.label)).toEqual(['Today', 'This week', 'Later']);
  });
  it('finds the will, life insurance and the locker', () => {
    expect(titles(plan, 'Find the will and the executor')).toEqual(['will']);
    expect(titles(plan, 'Find life insurance')).toEqual(expect.arrayContaining(['lic', 'empIns']));
    expect(titles(plan, 'Property and lockers')).toEqual(['locker']);
  });
  it('says plainly when something is missing', () => {
    const none = emergencyPlan('death', 'arun', [], people, 'meera');
    expect(none[0].steps[2].empty).toMatch(/No will has been recorded/);
  });
});

describe('Lost documents', () => {
  it('offers ID, property and legal documents', () => {
    expect(lostCandidates(items).map((i) => i.id)).toEqual(expect.arrayContaining(['passport', 'locker', 'will']));
  });
  it('gives India-specific replacement steps', () => {
    expect(replacementAdvice(items.find((i) => i.id === 'passport')!)).toMatch(/Passport Seva/);
    expect(replacementAdvice(items.find((i) => i.id === 'aadhaar')!)).toMatch(/UIDAI/);
  });
});
