'use server';
// All writes go through here and run as the signed-in user, so RLS applies to every one.
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { serverClient } from '@/lib/supabase/server';
import { loadHousehold, hasHousehold } from '@/lib/household';
import { CATEGORY_LABELS, type Category } from '@/lib/types';
import { hashToken, newToken } from '@/lib/tokens';
import type { InviteState } from '@/lib/invite-state';
import { normalisePhone } from '@/lib/whatsapp';

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

type Supabase = Awaited<ReturnType<typeof serverClient>>;

/** Signs in or signs up from an email + password form. Returns a friendly error, or null when signed in. */
async function authenticate(supabase: Supabase, form: FormData): Promise<string | null> {
  const email = text(form, 'email');
  const password = String(form.get('password') ?? '');
  if (!/^\S+@\S+\.\S+$/.test(email)) return 'Enter a valid email address.';
  if (password.length < 8) return 'Use a password of at least 8 characters.';
  if (text(form, 'mode') === 'signup') {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return /already registered/i.test(error.message) ? 'You already have an account. Sign in instead.' : error.message;
    if (!data?.session) return 'Check your email to confirm your account, then come back to this page.';
  } else {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return /invalid login/i.test(error.message) ? "That email and password don't match. New here? Create an account." : error.message;
  }
  return null;
}

export async function passwordAuth(form: FormData) {
  const supabase = await serverClient();
  const err = await authenticate(supabase, form);
  if (err) redirect('/login?error=' + encodeURIComponent(err));
  revalidatePath('/');
  redirect('/');
}

async function originOf() {
  const h = await headers();
  return h.get('origin') ?? `https://${h.get('host')}`;
}

/** Owner creates a single-use, 7-day invite link for someone in the household. */
export async function createInvite(_prev: InviteState, form: FormData): Promise<InviteState> {
  const d = await loadHousehold();
  if (!hasHousehold(d) || !d.isAdmin) return { error: 'Only the household owner can invite people.' };
  const personId = text(form, 'person');
  const person = d.people[personId];
  if (!person || person.isMember || personId === d.meId) return { error: 'This person already has a login.' };

  const supabase = await serverClient();
  await supabase.from('invitations').delete().eq('person_id', personId).is('accepted_at', null);
  const token = newToken();
  const { error } = await supabase.from('invitations').insert({
    household_id: d.householdId, person_id: personId, invited_by: d.userId,
    token_hash: hashToken(token), expires_at: new Date(Date.now() + 7 * 86_400_000).toISOString(),
  });
  if (error) return { error: 'Could not create the invite. Please try again.' };
  await supabase.from('audit_events').insert({
    household_id: d.householdId, actor_user_id: d.userId, action: 'invitation.created', target_type: 'person', target_id: personId,
  });
  revalidatePath('/people');
  const link = `${await originOf()}/join/${token}`;
  const me = d.people[d.meId]?.name ?? 'I';
  const message = `Hi ${person.name}, it's ${me}. I've set up FamilyOS so you can find our important family things if I'm ever not around. It takes 2 minutes: ${link}`;
  return { link, whatsapp: 'https://wa.me/?text=' + encodeURIComponent(message) };
}

/** Invitee accepts: signs in or creates an account if needed, then joins the household. */
export async function joinInvite(form: FormData) {
  const token = text(form, 'token');
  const back = (m: string): never => redirect(`/join/${encodeURIComponent(token)}?error=${encodeURIComponent(m)}`);
  const supabase = await serverClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const err = await authenticate(supabase, form);
    if (err) back(err);
  }
  const { error } = await supabase.rpc('accept_invitation', { token });
  if (error) {
    back(/another family/i.test(error.message)
      ? "You're already part of another family on FamilyOS. Being in more than one family with the same login is coming soon. We'll let you know."
      : error.message);
  }
  revalidatePath('/');
  redirect('/?joined=1');
}

/** Change where something is and who knows, can open and handles it. */
export async function updateItem(form: FormData) {
  const d = await loadHousehold();
  if (!hasHousehold(d)) redirect('/');
  const id = text(form, 'id');
  const item = d.items.find((i) => i.id === id);
  const back = (m: string): never => redirect(`/items/${id}?error=${encodeURIComponent(m)}`);
  if (!item) redirect('/');
  if (SECRET.test(text(form, 'notes')) || SECRET.test(text(form, 'location'))) {
    back("Please don't store passwords, PINs or OTPs here. Note where they're kept instead.");
  }
  const valid = (pid: string) => (pid && d.people[pid] ? pid : null);
  const owner = item.ownerId;
  const canOpen = form.getAll('canOpen').map(String).filter((p) => d.people[p] && p !== owner);
  const knows = Array.from(new Set([...form.getAll('knows').map(String), ...canOpen])).filter((p) => d.people[p] && p !== owner);

  const supabase = await serverClient();
  const { data: updated, error } = await supabase.from('items').update({
    title: text(form, 'title') || item.title, physical_location: text(form, 'location') || null,
    reference_hint: text(form, 'reference') || null, expires_on: text(form, 'expires') || null,
    is_critical: form.get('critical') === 'on', notes: text(form, 'notes') || null,
    responsible_person_id: valid(text(form, 'responsible')), backup_person_id: valid(text(form, 'backup')),
    release_to_successor: form.get('release') === 'on',
    visibility: canOpen.length ? 'shared' : 'private', last_verified_on: new Date().toISOString().slice(0, 10),
  }).eq('id', id).select('id');
  if (error || !updated?.length) back("You can't change this one. Only its owner can.");

  await supabase.from('item_knows').delete().eq('item_id', id);
  await supabase.from('item_access').delete().eq('item_id', id);
  if (knows.length) await supabase.from('item_knows').insert(knows.map((person_id) => ({ item_id: id, person_id })));
  if (canOpen.length) await supabase.from('item_access').insert(canOpen.map((person_id) => ({ item_id: id, person_id, granted_by: d.userId })));
  const before = new Set(item.canOpen);
  await supabase.from('audit_events').insert({
    household_id: d.householdId, actor_user_id: d.userId, action: 'item.sharing_changed', target_type: 'item', target_id: id,
    detail: { added: canOpen.filter((p) => !before.has(p)).length, removed: [...before].filter((p) => p !== owner && !canOpen.includes(p)).length },
  });
  revalidatePath('/');
  redirect('/?saved=1');
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
  const canOpen = form.getAll('canOpen').map(String).filter((id) => d.people[id]);

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

// ---------- named successor ----------
async function household() {
  const d = await loadHousehold();
  if (!hasHousehold(d)) redirect('/');
  return d;
}

export async function setSuccessor(form: FormData) {
  const d = await household();
  const person = text(form, 'person') || null;
  const supabase = await serverClient();
  const { error } = await supabase.rpc('set_successor', { hh: d.householdId, person });
  if (error) redirect('/people?error=' + encodeURIComponent(error.message));
  revalidatePath('/');
  redirect('/people?successor=1');
}

export async function requestHandover() {
  const d = await household();
  const supabase = await serverClient();
  const { error } = await supabase.rpc('request_handover', { hh: d.householdId });
  if (error) redirect('/?error=' + encodeURIComponent(error.message));
  revalidatePath('/');
  redirect('/');
}

export async function cancelHandover() {
  const d = await household();
  const supabase = await serverClient();
  const { error } = await supabase.rpc('cancel_handover', { hh: d.householdId });
  if (error) redirect('/?error=' + encodeURIComponent(error.message));
  revalidatePath('/');
  redirect('/?cancelled=1');
}

export async function completeHandover() {
  const d = await household();
  const supabase = await serverClient();
  const { error } = await supabase.rpc('complete_handover', { hh: d.householdId });
  if (error) redirect((d.isAdmin ? '/people' : '/') + '?error=' + encodeURIComponent(error.message));
  revalidatePath('/');
  redirect('/?handover=1');
}

// ---------- WhatsApp login ----------
/** Only allow redirects back into this app. */
const safeNext = (n: string) => (n.startsWith('/') && !n.startsWith('//') ? n : '/');

export async function sendPhoneCode(form: FormData) {
  const next = safeNext(text(form, 'next'));
  const phone = normalisePhone(text(form, 'phone'));
  const q = (extra: Record<string, string>) => '/login?' + new URLSearchParams({ ...extra, next }).toString();
  if (!phone) redirect(q({ error: 'Enter your 10-digit mobile number, or include the country code (e.g. +65…).' }));
  const supabase = await serverClient();
  const { error } = await supabase.auth.signInWithOtp({ phone });
  if (error) {
    const friendly = error.status === 429 || /rate limit|after \d+ seconds/i.test(error.message)
      ? 'We just sent you a code. Please wait a minute before asking for another.'
      : /not set up|503|hook/i.test(error.message) ? "WhatsApp login isn't switched on yet. Please use email for now." : error.message;
    redirect(q({ error: friendly }));
  }
  redirect(q({ step: 'code', phone }));
}

export async function verifyPhoneCode(form: FormData) {
  const next = safeNext(text(form, 'next'));
  const phone = normalisePhone(text(form, 'phone'));
  const token = text(form, 'code').replace(/\s/g, '');
  const again = (m: string): never => redirect('/login?' + new URLSearchParams({ step: 'code', phone: phone ?? '', next, error: m }).toString());
  if (!phone) redirect('/login');
  if (!/^\d{6}$/.test(token)) again('Enter the 6-digit code from WhatsApp.');
  const supabase = await serverClient();
  const { error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
  if (error) again(/expired|invalid/i.test(error.message) ? "That code didn't work or has expired. Ask for a new one." : error.message);
  revalidatePath('/');
  redirect(next);
}
