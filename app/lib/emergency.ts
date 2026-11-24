// Emergency Mode (PRD §33–36). Turns the family's own records into "do this first" steps.
// Works only from items the viewer can see (the caller passes those), and needs no AI (§85).
import type { Category, Item, Person, PersonId } from './types';

export type Scenario = 'medical' | 'death' | 'lost';

export interface Step {
  title: string;
  hint?: string;
  items: Item[];
  people: Person[];
  /** Shown when nothing has been recorded or shared for this step: a gap, said plainly. */
  empty: string;
}
export interface Phase { label?: string; steps: Step[] }

const about = (i: Item, who: PersonId) => i.ownerId === who || i.concerns.includes(who);
const titleHas = (i: Item, re: RegExp) => re.test(`${i.title} ${i.notes ?? ''}`);
const byRole = (people: Record<PersonId, Person>, re: RegExp) =>
  Object.values(people).filter((p) => re.test(p.relationship) || re.test(p.name));
const inCat = (items: Item[], who: PersonId, ...cats: Category[]) => items.filter((i) => cats.includes(i.category) && about(i, who));

export function emergencyPlan(
  scenario: Exclude<Scenario, 'lost'>, who: PersonId, items: Item[], people: Record<PersonId, Person>, viewer: PersonId,
): Phase[] {
  const name = people[who]?.name ?? 'them';
  const family = Object.values(people).filter((p) => p.isMember && p.id !== who && p.id !== viewer);
  const step = (title: string, list: Item[], empty: string, extra: Partial<Step> = {}): Step =>
    ({ title, items: list, people: [], empty, ...extra });

  if (scenario === 'medical') {
    return [{ steps: [
      step('Find the health insurance', items.filter((i) => about(i, who) && (i.category === 'insurance' || (i.category === 'work' && titleHas(i, /insur|cover|health|medical/i)))),
        `No health insurance has been recorded or shared with you for ${name}.`,
        { hint: 'Most hospitals ask for the policy or card at admission. Call the insurer’s helpline for cashless approval.' }),
      step('Get their ID', inCat(items, who, 'identity'), `No ID documents recorded for ${name}. Aadhaar or PAN is usually asked for at admission.`),
      step('Check medication and allergies', inCat(items, who, 'medical'), `No medication or allergy notes recorded for ${name}. Tell the doctor anything you know.`),
      step('Call their doctor', [], 'No doctor has been added on the People page yet.',
        { people: byRole(people, /\b(doctor|dr\.?|physician|cardiolog|gp)\b/i) }),
      step('Tell the family', [], 'Nobody else has joined yet.',
        { people: family, hint: 'One person calls; everyone else waits for updates so the line stays free.' }),
      step('Keep things running', items.filter((i) => i.category === 'bills' && i.responsibleId === who),
        `Nothing that ${name} handles regularly has been recorded.`,
        { hint: 'Check who the backup is for each of these.' }),
    ] }];
  }

  return [
    { label: 'Today', steps: [
      step('Tell the closest family', [], 'Nobody else has joined yet.', { people: family, hint: 'Ask one person to coordinate calls.' }),
      step('Find their identity documents', inCat(items, who, 'identity'), `No ID documents recorded for ${name}.`,
        { hint: 'You will need these for the death certificate.' }),
      step('Find the will and the executor', inCat(items, who, 'legal'), `No will has been recorded or shared with you for ${name}.`,
        { people: byRole(people, /\b(lawyer|advocate|executor)\b/i) }),
      step('Tell the employer', inCat(items, who, 'work'), `No employer details recorded for ${name}.`,
        { people: byRole(people, /\b(hr|employer)\b/i) }),
      step('Secure the phone, email and devices', inCat(items, who, 'digital'), `No digital accounts recorded for ${name}.`,
        { hint: 'Keep the phone charged and safe: it often holds the codes needed to reach bank and email accounts.' }),
    ] },
    { label: 'This week', steps: [
      step('Find life insurance', items.filter((i) => about(i, who) && (i.category === 'insurance' || i.category === 'work') && titleHas(i, /life|term|lic/i)),
        `No life insurance recorded for ${name}.`, { people: byRole(people, /\b(agent|adviser|advisor)\b/i) }),
      step('Speak to the CA and the lawyer', [], 'No CA or lawyer has been added on the People page yet.',
        { people: byRole(people, /\b(ca|chartered|accountant|lawyer|advocate)\b/i) }),
      step('Keep the bills running', items.filter((i) => i.category === 'bills'), 'No regular payments recorded.'),
      step('List bank and investment accounts', items.filter((i) => about(i, who) && (i.category === 'money' || (i.category === 'work' && titleHas(i, /epf|pf|nps|gratuity|stock/i)))),
        `No bank or investment accounts recorded for ${name}.`, { hint: 'Banks will ask for the death certificate and the nominee’s ID.' }),
    ] },
    { label: 'Later', steps: [
      step('Property and lockers', inCat(items, who, 'property'), `No property recorded for ${name}.`),
      step('Digital accounts and social media', items.filter((i) => about(i, who) && i.category === 'digital' && i.afterDeath),
        'No wishes recorded for their digital accounts.'),
    ] },
  ];
}

/** Lost documents: where the original should be, who knows, and how it's usually replaced in India. */
export function replacementAdvice(item: Item): string {
  const t = item.title.toLowerCase();
  if (/passport/.test(t)) return 'Report it on the Passport Seva portal and apply for a reissue. If it was stolen, file a police complaint first.';
  if (/aadhaar/.test(t)) return 'Download a fresh e-Aadhaar from the UIDAI website using the registered mobile number.';
  if (/\bpan\b/.test(t)) return 'Request a reprint of the PAN card through the Income Tax e-filing portal or NSDL/UTIITSL.';
  if (/driving|licen[cs]e/.test(t)) return 'Apply for a duplicate on the Parivahan Sarathi portal. A police report may be needed.';
  if (/birth/.test(t)) return 'Request a copy from the municipal office that issued it.';
  if (/marriage/.test(t)) return 'Request a certified copy from the Sub-Registrar office where it was registered.';
  if (/locker|key/.test(t)) return 'Contact the bank branch immediately to report the lost key.';
  if (/deed|property|flat|house|land/.test(t)) return 'Request a certified copy from the Sub-Registrar office where it was registered, and inform your lawyer.';
  if (/insurance|policy/.test(t)) return 'Ask the insurer for a duplicate policy. Most can email a copy using the policy number.';
  return 'Contact whoever issued it for a replacement. If it was stolen, file a police complaint first.';
}

export const lostCandidates = (items: Item[]) =>
  items.filter((i) => ['identity', 'property', 'legal', 'insurance', 'children'].includes(i.category));
