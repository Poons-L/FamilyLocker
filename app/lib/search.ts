// Ask FamilyOS (PRD §31–32). Plain keyword matching, no AI: it must keep working offline and in a crisis (§85).
// Permission rule: the caller passes only items the viewer may see; `searchItems` filters again by viewer
// before any matching, so search can never become a way around sharing.
import { dependsOn, isSinglePointOfFailure } from './readiness';
import { CATEGORY_LABELS, type Item, type Person, type PersonId } from './types';

export interface Viewer { personId: PersonId; userId?: string }

export type SearchResult =
  | { kind: 'items'; items: Item[] }
  | { kind: 'people'; people: Person[] }
  | { kind: 'depends'; person: Person | null; items: Item[] }
  | { kind: 'none' };

/** Second permission layer (the database is the first). */
export const canSee = (i: Item, v: Viewer) =>
  i.ownerId === v.personId || i.canOpen.includes(v.personId) || (v.userId !== undefined && i.createdBy === v.userId);

const STOP = new Set(['where', 'what', 'which', 'who', 'whos', 'the', 'our', 'are', 'has', 'have', 'about', 'knows', 'know',
  'does', 'is', 'show', 'me', 'find', 'for', 'and', 'any', 'all', 'my', 'of', 'is', 'kept', 'keep', 'can', 'get']);
const FILLER = new Set(['documents', 'document', 'papers', 'paper', 'information', 'info', 'details', 'stuff', 'things']);

// Everyday words people use → words that appear in item titles and categories.
const SYNONYMS: Record<string, string[]> = {
  insurance: ['insurance', 'policy', 'cover', 'health', 'life', 'lic', 'floater', 'mediclaim'],
  policy: ['insurance', 'policy', 'cover'],
  medical: ['medical', 'medication', 'medicine', 'doctor', 'allergy', 'hospital', 'health'],
  medicine: ['medication', 'medicine', 'prescription'],
  bank: ['bank', 'account', 'savings', 'hdfc', 'sbi', 'icici', 'axis', 'kotak', 'money'],
  money: ['bank', 'account', 'demat', 'mutual', 'fund', 'ppf', 'epf', 'nps', 'fd', 'deposit', 'money'],
  investments: ['demat', 'mutual', 'fund', 'shares', 'stocks', 'ppf', 'nps', 'epf'],
  property: ['flat', 'house', 'home', 'land', 'deed', 'property', 'sale'],
  house: ['flat', 'house', 'home', 'property', 'deed'],
  jewellery: ['gold', 'jewellery', 'jewelry', 'locker'],
  gold: ['gold', 'jewellery', 'jewelry', 'locker'],
  will: ['will', 'executor', 'testament'],
  id: ['aadhaar', 'pan', 'passport', 'licence', 'license', 'identity'],
  passport: ['passport'],
  school: ['school', 'fees', 'tuition'],
  email: ['gmail', 'email', 'outlook', 'mail'],
  password: ['password', 'bitwarden', '1password', 'lastpass', 'keychain'],
  loan: ['loan', 'emi', 'mortgage'],
  bills: ['bill', 'emi', 'rent', 'maintenance', 'electricity', 'salary', 'fees', 'subscription'],
};

// Words that name a relationship rather than a person.
const RELATION: Record<string, RegExp> = {
  dad: /^(dad|father|papa|appa|pitaji)\b/i,
  father: /^(dad|father|papa|appa)\b/i,
  mum: /^(mum|mom|mother|amma|maa|mummy)\b/i,
  mom: /^(mum|mom|mother|amma|maa|mummy)\b/i,
  mother: /^(mum|mom|mother|amma|maa)\b/i,
  wife: /^(wife|spouse)\b/i,
  husband: /^(husband|spouse)\b/i,
  spouse: /^(wife|husband|spouse|partner)\b/i,
  daughter: /^daughter\b/i,
  son: /^son\b/i,
};

// Roles people search for ("who is our CA?").
const ROLES: Record<string, RegExp> = {
  ca: /\b(ca|chartered accountant|accountant|tax)\b/i,
  accountant: /\b(ca|chartered accountant|accountant)\b/i,
  lawyer: /\b(lawyer|advocate|legal|solicitor)\b/i,
  advocate: /\b(lawyer|advocate)\b/i,
  doctor: /\b(doctor|dr\.?|gp|physician|cardiologist|paediatrician|pediatrician)\b/i,
  adviser: /\b(adviser|advisor|agent|planner|broker)\b/i,
  agent: /\b(agent|adviser|advisor)\b/i,
  hr: /\b(hr|human resources|employer)\b/i,
  executor: /\bexecutor\b/i,
};

const words = (q: string) => q.toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').split(/\s+/).map((w) => w.replace(/'s$/, '')).filter(Boolean);

/** People a query mentions, by name or by relationship ("Dad", "my wife"). */
export function namedPeople(q: string, people: Record<PersonId, Person>): Person[] {
  const ws = words(q);
  const all = Object.values(people);
  const found = new Map<string, Person>();
  for (const w of ws) {
    for (const p of all) {
      if (p.name.toLowerCase() === w || p.fullName.toLowerCase().split(/\s+/).includes(w)) found.set(p.id, p);
    }
    const rel = RELATION[w];
    if (rel) for (const p of all) if (rel.test(p.relationship) || rel.test(p.name)) found.set(p.id, p);
  }
  return [...found.values()];
}

export function searchItems(query: string, items: Item[], people: Record<PersonId, Person>, viewer: Viewer): SearchResult {
  const q = query.trim();
  if (!q) return { kind: 'none' };
  const visible = items.filter((i) => canSee(i, viewer)); // permission filter FIRST

  // "What depends entirely on Mum?"
  const dep = q.match(/depend\w*\s+(?:\w+\s+)?on\s+(.+)$/i);
  if (dep) {
    const who = dep[1].trim().toLowerCase() === 'me' ? people[viewer.personId] : namedPeople(dep[1], people)[0] ?? null;
    return { kind: 'depends', person: who ?? null, items: who ? visible.filter((i) => isSinglePointOfFailure(i) && dependsOn(i) === who.id) : [] };
  }

  const ws = words(q);
  // "Who is our CA?" → people with that role.
  if (/^who('?s| is| are)?\b/i.test(q)) {
    const role = ws.find((w) => ROLES[w]);
    if (role) {
      const matches = Object.values(people).filter((p) => ROLES[role].test(p.relationship) || ROLES[role].test(p.name));
      if (matches.length) return { kind: 'people', people: matches };
    }
  }

  const named = namedPeople(q, people);
  const namedWords = new Set(named.flatMap((p) => [p.name.toLowerCase(), ...p.fullName.toLowerCase().split(/\s+/)]));
  const topical = ws.filter((w) => !STOP.has(w) && !FILLER.has(w) && !namedWords.has(w) && !RELATION[w] && w.length > 1);
  const typed = new Set(topical);
  const expanded = [...new Set(topical.flatMap((w) => SYNONYMS[w] ?? [w]))];

  const scored = visible.map((i) => {
    const about = [i.ownerId, ...i.concerns];
    const hay = [i.title, CATEGORY_LABELS[i.category], i.notes ?? '', i.reference ?? '', i.location].join(' ').toLowerCase();
    const hit = (w: string) => new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(hay); // word starts only: "lic" ≠ "policy"
    const topicalScore = expanded.reduce((s, w) => s + (hit(w) ? (typed.has(w) ? 2 : 1) : 0), 0);
    const aboutScore = named.some((p) => about.includes(p.id) || hay.includes(p.name.toLowerCase())) ? 3 : 0;
    // A person's name alone isn't a match unless that's all they asked ("Riya's documents").
    const score = expanded.length ? (topicalScore ? topicalScore + aboutScore : 0) : aboutScore;
    return { i, score, aboutScore };
  }).filter((x) => x.score > 0);

  let ranked = scored;
  if (named.length && scored.some((x) => x.aboutScore)) ranked = scored.filter((x) => x.aboutScore);
  ranked.sort((a, b) => b.score - a.score);
  return ranked.length ? { kind: 'items', items: ranked.slice(0, 5).map((x) => x.i) } : { kind: 'none' };
}
