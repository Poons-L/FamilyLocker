// Fictional demo household (PRD §47). No real personal data.
import type { Item, Person, PersonId } from './types';

export const DEMO_TODAY = new Date('2026-11-23T00:00:00Z');
const d = (offsetDays: number) => new Date(DEMO_TODAY.getTime() + offsetDays * 86_400_000).toISOString().slice(0, 10);

export const people: Record<PersonId, Person> = {
  arun: { id: 'arun', name: 'Arun', fullName: 'Arun Mehta', relationship: 'Self', isMember: true },
  meera: { id: 'meera', name: 'Meera', fullName: 'Meera Mehta', relationship: 'Spouse', isMember: true },
  kavita: { id: 'kavita', name: 'Kavita', fullName: 'Kavita Shah', relationship: 'Sister · executor', isMember: true },
  raj: { id: 'raj', name: 'Raj', fullName: 'Raj Mehta', relationship: 'Cousin · helps with parents', isMember: true },
  riya: { id: 'riya', name: 'Riya', fullName: 'Riya Mehta', relationship: 'Daughter, 12', isMember: false },
  suresh: { id: 'suresh', name: 'Dad', fullName: 'Suresh Mehta', relationship: 'Father, 72', isMember: false },
  lata: { id: 'lata', name: 'Mum', fullName: 'Lata Mehta', relationship: 'Mother, 68', isMember: false },
};

/** Lower number = shown first in "Do these next". */
export const priority: Record<string, number> = {
  empIns: 1, dadMeds: 1.5, locker: 2, parentsMoney: 2.5, pwm: 3.2, gmail: 3.5, lic: 4, will: 4.5, demat: 5, aadhaar: 6, epf: 7, loan: 8, mf: 9,
};

type Seed = Omit<Item, 'lastVerifiedOn' | 'expiresOn' | 'concerns' | 'emergencies'> & {
  verifiedDaysAgo: number; expiresInDays?: number; concerns?: string[]; emergencies?: Item['emergencies'];
};

const seeds: Seed[] = [
  { id: 'passport', title: "Arun's passport", category: 'identity', ownerId: 'arun', location: 'Bedroom cupboard, blue document folder', reference: 'ending 4471', expiresInDays: 79, verifiedDaysAgo: 200, knows: ['arun', 'meera'], canOpen: ['arun', 'meera'], responsibleId: 'arun', backupId: 'meera', critical: true, emergencies: ['death', 'lost'] },
  { id: 'aadhaar', title: "Arun's Aadhaar & PAN", category: 'identity', ownerId: 'arun', location: "DigiLocker on Arun's phone", verifiedDaysAgo: 120, knows: ['arun', 'meera'], canOpen: ['arun'], responsibleId: 'arun', backupId: null, critical: true, emergencies: ['medical', 'death', 'lost'] },
  { id: 'demat', title: 'Zerodha demat account', category: 'money', ownerId: 'arun', location: 'Zerodha app (Arun only)', verifiedDaysAgo: 30, knows: ['arun'], canOpen: ['arun'], responsibleId: 'arun', backupId: null, critical: true, emergencies: ['death'] },
  { id: 'hdfc', title: 'HDFC joint savings account', category: 'money', ownerId: 'arun', concerns: ['arun', 'meera'], location: 'HDFC NetBanking', verifiedDaysAgo: 60, knows: ['arun', 'meera'], canOpen: ['arun', 'meera'], responsibleId: 'arun', backupId: 'meera', critical: true, emergencies: ['death'] },
  { id: 'epf', title: "Arun's EPF", category: 'work', ownerId: 'arun', location: 'EPFO member portal', verifiedDaysAgo: 500, knows: ['arun'], canOpen: ['arun'], responsibleId: 'arun', backupId: null, critical: true, emergencies: ['death'], notes: 'Nominee: Meera.' },
  { id: 'lic', title: 'LIC term policy, ₹1 crore', category: 'insurance', ownerId: 'arun', location: 'Original bond in SBI locker', reference: 'ending 8732', verifiedDaysAgo: 150, knows: ['arun', 'meera'], canOpen: ['arun', 'meera'], responsibleId: 'meera', backupId: null, critical: true, emergencies: ['death'] },
  { id: 'health', title: 'Star Health family floater', category: 'insurance', ownerId: 'arun', concerns: ['arun', 'meera', 'riya'], location: 'Policy PDF in Gmail · card in wallet', expiresInDays: 25, verifiedDaysAgo: 330, knows: ['arun', 'meera'], canOpen: ['arun', 'meera'], responsibleId: 'arun', backupId: 'meera', critical: true, emergencies: ['medical'] },
  { id: 'empIns', title: 'Employer health & life insurance', category: 'work', ownerId: 'arun', concerns: ['arun', 'meera', 'riya'], location: 'Northwind HR portal', verifiedDaysAgo: 380, knows: ['arun'], canOpen: ['arun'], responsibleId: 'arun', backupId: null, critical: true, emergencies: ['medical', 'death'] },
  { id: 'locker', title: 'SBI locker, Indiranagar', category: 'property', ownerId: 'arun', location: '', reference: 'Locker 214', verifiedDaysAgo: 620, knows: ['arun'], canOpen: ['arun'], responsibleId: 'arun', backupId: null, critical: true, emergencies: ['death', 'lost'] },
  { id: 'will', title: "Arun's will", category: 'legal', ownerId: 'arun', location: 'Original with Adv. Sanjay Rao', verifiedDaysAgo: 420, knows: ['arun', 'kavita'], canOpen: ['arun', 'kavita'], responsibleId: 'kavita', backupId: null, critical: true, emergencies: ['death'] },
  { id: 'dadMeds', title: "Dad's medication & cardiologist", category: 'medical', ownerId: 'suresh', concerns: ['suresh'], location: "Prescription file on the fridge, parents' flat", verifiedDaysAgo: 100, knows: ['arun', 'raj'], canOpen: ['arun', 'raj'], responsibleId: null, backupId: null, critical: true, emergencies: ['medical'] },
  { id: 'school', title: "Riya's school", category: 'children', ownerId: 'meera', concerns: ['riya'], location: 'School app', verifiedDaysAgo: 90, knows: ['meera', 'arun'], canOpen: ['meera', 'arun'], responsibleId: 'meera', backupId: 'arun', critical: true, emergencies: ['medical', 'death'] },
  { id: 'gmail', title: "Arun's main Gmail", category: 'digital', ownerId: 'arun', location: 'Recovery codes: not recorded', verifiedDaysAgo: 700, knows: ['arun'], canOpen: ['arun'], responsibleId: null, backupId: null, critical: true, emergencies: ['death'], afterDeath: 'Archive' },
  { id: 'pwm', title: 'Password manager', category: 'digital', ownerId: 'arun', location: 'Emergency kit: not recorded', verifiedDaysAgo: 200, knows: ['arun'], canOpen: ['arun'], responsibleId: 'arun', backupId: null, critical: true, emergencies: ['death'], afterDeath: 'Transfer' },
  { id: 'loan', title: 'Home loan EMI', category: 'bills', ownerId: 'arun', location: 'Auto-debit from HDFC on the 5th', verifiedDaysAgo: 90, knows: ['arun', 'meera'], canOpen: ['arun', 'meera'], responsibleId: 'arun', backupId: null, critical: true, emergencies: ['death', 'medical'] },
  { id: 'parentsMoney', title: 'Monthly transfer to parents', category: 'bills', ownerId: 'arun', concerns: ['suresh', 'lata'], location: 'Standing instruction from HDFC', verifiedDaysAgo: 60, knows: ['arun', 'raj'], canOpen: ['arun'], responsibleId: 'arun', backupId: null, critical: true, emergencies: ['medical', 'death'] },
];

export const items: Item[] = seeds.map(({ verifiedDaysAgo, expiresInDays, concerns, emergencies, ...rest }) => ({
  ...rest,
  concerns: concerns ?? [rest.ownerId],
  emergencies: emergencies ?? [],
  lastVerifiedOn: d(-verifiedDaysAgo),
  expiresOn: expiresInDays != null ? d(expiresInDays) : undefined,
}));
