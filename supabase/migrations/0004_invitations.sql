-- Invites (PRD §69 growth loop). The owner creates a single-use link and sends it on WhatsApp.
-- Only a SHA-256 hash of the link's secret is stored, so a database leak can't be replayed.

alter table invitations alter column email drop not null;
create unique index if not exists invitations_token_hash_key on invitations (token_hash);

-- Lets the join page greet the invitee before they sign in. Reveals names only to someone holding the secret link.
create or replace function public.invitation_preview(token text)
returns table (household_name text, person_name text, invited_by_name text)
language sql stable security definer set search_path = public as $$
  select h.name, p.display_name, ip.display_name
  from invitations i
  join households h on h.id = i.household_id
  join people p on p.id = i.person_id
  left join people ip on ip.household_id = i.household_id and ip.user_id = i.invited_by
  where i.token_hash = encode(sha256(convert_to(token, 'UTF8')), 'hex')
    and i.accepted_at is null
    and i.expires_at > now()
    and p.user_id is null
$$;

-- Links the signed-in user to the invited person and makes them a member (never an admin).
create or replace function public.accept_invitation(token text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  inv invitations%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Sign in first';
  end if;
  select * into inv from invitations
   where token_hash = encode(sha256(convert_to(token, 'UTF8')), 'hex')
   for update;
  if not found or inv.accepted_at is not null or inv.expires_at <= now() then
    raise exception 'This invite link has expired or was already used. Ask for a new one.';
  end if;
  if exists (select 1 from household_members where household_id = inv.household_id and user_id = auth.uid()) then
    raise exception 'You are already part of this family.';
  end if;
  if exists (select 1 from household_members where user_id = auth.uid()) then
    raise exception 'This account already belongs to another family. Use a different email for this invite.';
  end if;
  update people set user_id = auth.uid() where id = inv.person_id and user_id is null;
  if not found then
    raise exception 'This invite has already been claimed.';
  end if;
  insert into household_members (household_id, user_id, person_id, role)
    values (inv.household_id, auth.uid(), inv.person_id, 'member');
  update invitations set accepted_at = now() where id = inv.id;
  insert into audit_events (household_id, actor_user_id, action, target_type, target_id)
    values (inv.household_id, auth.uid(), 'invitation.accepted', 'person', inv.person_id);
  return inv.household_id;
end $$;

revoke execute on function public.invitation_preview(text) from public;
grant execute on function public.invitation_preview(text) to anon, authenticated;
revoke execute on function public.accept_invitation(text) from public, anon;
grant execute on function public.accept_invitation(text) to authenticated;
