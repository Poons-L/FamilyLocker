'use server';
// All writes go through here and run as the signed-in user, so RLS applies to every one.
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { serverClient } from '@/lib/supabase/server';
import { loadHousehold, hasHousehold } from '@/lib/household';
import { CATEGORY_LABELS, type Category } from '@/lib/types';

const text = (f: FormData, k: string) => String(f.get(k) ?? '').trim();
// PRD §50: warn against secrets in free text.
const SECRET = /\b(password|passwd|pin|otp|cvv|upi pin)\b\s*[:=]/i;

export async function sendLoginLink(form: FormData) {
  const email = text(form, 'email');
  if (!/^\S+@\S+\.\S+$/.test(email)) redirect('/login?error=' + encodeURIComponent('Enter a valid email address.'));
  const h = await headers();
  const origin = h.get('origin') ?? `https://${h.get('host')}`;
  const supabase = await serverClient();
  const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${origin}/auth/callback` } });
  if (error) {
    const friendly = error.status === 429 || /rate limit|after \d+ seconds/i.test(error.message)
      ? "We've just sent you a link. Please check your inbox and spam folder, or wait a minute before asking for another."
      : error.message;
    redirect('/login?error=' + encodeURIComponent(friendly));
  }
  redirect('/login?sent=1');
}

export async function passwordAuth(form: FormData) {
  const email = text(form, 'email');
  const password = String(form.get('password') ?? '');
  const mode = text(form, 'mode');
  const back = (m: string) => redirect('/login?error=' + encodeURIComponent(m));
  if (!/^\S+@\S+\.\S+$/.test(email)) back('Enter a valid email address.');
  if (password.length < 8) back('Use a password of at least 8 characters.');
  const supabase = await serverClient();
  if (mode === 'signup') {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) back(/already registered/i.test(error.message) ? 'You already have an account. Sign in instead.' : error.message);
    if (!data?.session) redirect('/login?sent=1');
  } else {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) back(/invalid login/i.test(error.message) ? "That email and password don't match. New here? Create an account." : error.message);
  }
  revalidatePath('/');
  redirect('/');
}

export async function signOut() {
  const supabase = await serverClient();
  await supabase.auth.signOut();
  redirect('/');
}

export async function createHousehold(form: FormData) {
  const name = text(form, 'household') || 'Our family';
  const me = text(form, 'me');
  if (!me) redirect('/?error=' + encodeURIComponent('Tell us your name.'));
  const supabase = await serverClient();
  const { error } = await supabase.rpc('create_household', { household_name: name, my_name: me });
  if (error) redirect('/?error=' + encodeURIComponent(error.message));
  revalidatePath('/');
  redirect('/');
}

export async function addPerson(form: FormData) {
  const d = await loadHousehold();
  if (!hasHousehold(d)) redirect('/');
  const name = text(form, 'name');
  if (!name) redirect('/people?error=' + encodeURIComponent('Add a name.'));
  const supabase = await serverClient();
  const { error } = await supabase.from('people').insert({
    household_id: d.householdId, display_name: name, full_name: text(form, 'full') || null,
    relationship: text(form, 'relationship') || null, contact_email: text(form, 'email') || null,
  });
  if (error) redirect('/people?error=' + encodeURIComponent(error.message));
  revalidatePath('/people');
  redirect('/people');
}

export async function addItem(form: FormData) {
  const d = await loadHousehold();
  if (!hasHousehold(d)) redirect('/');
  const title = text(form, 'title');
  const category = text(form, 'category') as Category;
  if (!title || !(category in CATEGORY_LABELS)) redirect('/items/new?error=' + encodeURIComponent('Add a name and pick a category.'));
  const notes = text(form, 'notes');
  if (SECRET.test(notes) || SECRET.test(text(form, 'location'))) {
    redirect('/items/new?error=' + encodeURIComponent("Please don't store passwords, PINs or OTPs here. Note where they're kept instead."));
  }
  const valid = (id: string) => (id && d.people[id] ? id : null);
  const owner = valid(text(form, 'owner')) ?? d.meId;
  const knows = form.getAll('knows').map(String).filter((id) => d.people[id]);
  const canOpen = form.getAll('canOpen').map(String).filter((id) => d.people[id]?.isMember);

  const supabase = await serverClient();
  const { data: item, error } = await supabase.from('items').insert({
    household_id: d.householdId, created_by: d.userId, owner_person_id: owner, title, category,
    physical_location: text(form, 'location') || null, reference_hint: text(form, 'reference') || null,
    expires_on: text(form, 'expires') || null, is_critical: form.get('critical') === 'on',
    responsible_person_id: valid(text(form, 'responsible')), backup_person_id: valid(text(form, 'backup')),
    notes: notes || null, visibility: canOpen.length ? 'shared' : 'private',
  }).select('id').single();
  if (error || !item) redirect('/items/new?error=' + encodeURIComponent(error?.message ?? 'Could not save.'));

  const knowsRows = Array.from(new Set([...knows, ...canOpen])).filter((p) => p !== owner).map((person_id) => ({ item_id: item.id, person_id }));
  const accessRows = canOpen.filter((p) => p !== owner).map((person_id) => ({ item_id: item.id, person_id, granted_by: d.userId }));
  if (knowsRows.length) await supabase.from('item_knows').insert(knowsRows);
  if (accessRows.length) await supabase.from('item_access').insert(accessRows);
  await supabase.from('audit_events').insert({
    household_id: d.householdId, actor_user_id: d.userId, action: 'item.created', target_type: 'item', target_id: item.id,
    detail: { shared_with: accessRows.length },
  });
  revalidatePath('/');
  redirect('/');
}
