// Loads the signed-in user's household and turns database rows into engine Items.
import { serverClient } from './supabase/server';
import type { Category, Item, Person } from './types';

export interface HouseholdData {
  userId: string;
  householdId: string;
  householdName: string;
  meId: string;
  isAdmin: boolean;
  people: Record<string, Person>;
  items: Item[];
}

type ItemRow = {
  id: string; created_by: string; title: string; category: Category; owner_person_id: string;
  physical_location: string | null; external_location: string | null; reference_hint: string | null;
  expires_on: string | null; last_verified_on: string; responsible_person_id: string | null; backup_person_id: string | null;
  is_critical: boolean; emergency_kinds: string[]; notes: string | null;
  item_knows: { person_id: string }[]; item_access: { person_id: string }[];
};

export async function loadHousehold(): Promise<HouseholdData | { userId: string | null }> {
  const supabase = await serverClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { userId: null };

  const { data: membership } = await supabase
    .from('household_members')
    .select('household_id, person_id, role, households(name)')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();
  if (!membership) return { userId: user.id };

  const hh = membership.household_id as string;
  const [{ data: peopleRows }, { data: itemRows }] = await Promise.all([
    supabase.from('people').select('id, display_name, full_name, relationship, user_id').eq('household_id', hh).order('created_at'),
    supabase.from('items')
      .select('id, created_by, title, category, owner_person_id, physical_location, external_location, reference_hint, expires_on, last_verified_on, responsible_person_id, backup_person_id, is_critical, emergency_kinds, notes, item_knows(person_id), item_access(person_id)')
      .eq('household_id', hh).order('created_at'),
  ]);

  const people: Record<string, Person> = {};
  for (const p of peopleRows ?? []) {
    people[p.id] = { id: p.id, name: p.display_name, fullName: p.full_name ?? p.display_name, relationship: p.relationship ?? '', isMember: Boolean(p.user_id) };
  }

  const items: Item[] = ((itemRows ?? []) as unknown as ItemRow[]).map((r) => {
    const knows = Array.from(new Set([r.owner_person_id, ...r.item_knows.map((k) => k.person_id)]));
    const canOpen = Array.from(new Set([r.owner_person_id, ...r.item_access.map((a) => a.person_id)]));
    return {
      id: r.id, createdBy: r.created_by, title: r.title, category: r.category, ownerId: r.owner_person_id, concerns: [r.owner_person_id],
      location: [r.physical_location, r.external_location].filter(Boolean).join(' · '),
      reference: r.reference_hint ?? undefined, expiresOn: r.expires_on ?? undefined, lastVerifiedOn: r.last_verified_on,
      knows, canOpen, responsibleId: r.responsible_person_id, backupId: r.backup_person_id,
      critical: r.is_critical, emergencies: (r.emergency_kinds ?? []) as Item['emergencies'], notes: r.notes ?? undefined,
    };
  });

  const households = membership.households as unknown as { name: string } | null;
  return {
    userId: user.id, householdId: hh, householdName: households?.name ?? 'Our family',
    meId: membership.person_id as string, isAdmin: membership.role === 'admin', people, items,
  };
}

export const hasHousehold = (d: HouseholdData | { userId: string | null }): d is HouseholdData => 'householdId' in d;
