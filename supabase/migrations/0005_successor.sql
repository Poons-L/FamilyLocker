-- Named successor (PRD §17, §25 "Emergency pre-authorised", §64).
-- FamilyOS must not itself become a single point of failure: if the owner can't manage it,
-- a named successor can take over after a 7-day waiting period the owner can cancel.
-- The successor only gains the items the owner set aside for them; everything else stays private.

alter table households
  add column successor_person_id uuid references people (id) on delete set null,
  add column handover_requested_at timestamptz,
  add column handover_requested_by uuid references auth.users (id);

alter table items add column release_to_successor boolean not null default false;

create or replace function public.set_successor(hh uuid, person uuid)
returns void
language plpgsql security definer set search_path = public, private as $$
begin
  if not private.is_admin(hh) then raise exception 'Only an owner can choose a successor.'; end if;
  if person is not null and not exists (
    select 1 from household_members m where m.household_id = hh and m.person_id = person and m.user_id <> auth.uid()
  ) then
    raise exception 'Your successor must be someone else who has joined this family.';
  end if;
  update households set successor_person_id = person, handover_requested_at = null, handover_requested_by = null where id = hh;
  insert into audit_events (household_id, actor_user_id, action, target_type, target_id)
    values (hh, auth.uid(), case when person is null then 'successor.removed' else 'successor.set' end, 'person', person);
end $$;

create or replace function public.request_handover(hh uuid)
returns timestamptz
language plpgsql security definer set search_path = public, private as $$
declare requested timestamptz;
begin
  if not exists (select 1 from households h where h.id = hh and h.successor_person_id = private.my_person_id(hh)) then
    raise exception 'Only the named successor can ask to take over.';
  end if;
  update households set handover_requested_at = coalesce(handover_requested_at, now()), handover_requested_by = auth.uid()
   where id = hh returning handover_requested_at into requested;
  insert into audit_events (household_id, actor_user_id, action) values (hh, auth.uid(), 'handover.requested');
  return requested + interval '7 days';
end $$;

create or replace function public.cancel_handover(hh uuid)
returns void
language plpgsql security definer set search_path = public, private as $$
begin
  if not private.is_admin(hh) then raise exception 'Only an owner can cancel a handover.'; end if;
  update households set handover_requested_at = null, handover_requested_by = null where id = hh;
  insert into audit_events (household_id, actor_user_id, action) values (hh, auth.uid(), 'handover.cancelled');
end $$;

-- Completes the handover: immediately when an owner hands over, or by the successor once 7 days have passed.
create or replace function public.complete_handover(hh uuid)
returns void
language plpgsql security definer set search_path = public, private as $$
declare
  h households%rowtype;
  succ_user uuid;
begin
  select * into h from households where id = hh for update;
  if h.successor_person_id is null then raise exception 'No successor has been named.'; end if;
  if private.is_admin(hh) then
    null; -- an owner is handing over voluntarily
  elsif h.successor_person_id = private.my_person_id(hh) then
    if h.handover_requested_at is null then raise exception 'Ask to take over first.'; end if;
    if h.handover_requested_at > now() - interval '7 days' then
      raise exception 'You can take over from %.', to_char(h.handover_requested_at + interval '7 days', 'DD Mon YYYY');
    end if;
  else
    raise exception 'Only the named successor or an owner can do this.';
  end if;

  select user_id into succ_user from people where id = h.successor_person_id;
  update household_members set role = 'admin' where household_id = hh and user_id = succ_user;

  -- Give the successor the items owners set aside for them.
  insert into item_knows (item_id, person_id)
    select i.id, h.successor_person_id from items i
     where i.household_id = hh and i.release_to_successor and i.owner_person_id <> h.successor_person_id
    on conflict do nothing;
  insert into item_access (item_id, person_id, granted_by)
    select i.id, h.successor_person_id, i.created_by from items i
     where i.household_id = hh and i.release_to_successor and i.owner_person_id <> h.successor_person_id
    on conflict do nothing;

  update households set successor_person_id = null, handover_requested_at = null, handover_requested_by = null where id = hh;
  insert into audit_events (household_id, actor_user_id, action, target_type, target_id)
    values (hh, auth.uid(), 'handover.completed', 'person', h.successor_person_id);
end $$;

revoke execute on function public.set_successor(uuid, uuid) from public, anon;
revoke execute on function public.request_handover(uuid) from public, anon;
revoke execute on function public.cancel_handover(uuid) from public, anon;
revoke execute on function public.complete_handover(uuid) from public, anon;
grant execute on function public.set_successor(uuid, uuid), public.request_handover(uuid),
  public.cancel_handover(uuid), public.complete_handover(uuid) to authenticated;
