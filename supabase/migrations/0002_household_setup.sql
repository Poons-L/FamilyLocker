-- Household creation (first-run onboarding, PRD §43).
-- A new household has no admin yet, so people/member rows can't pass RLS on their own.
-- This function does the three inserts in one step, only for the signed-in user.

create or replace function create_household(household_name text, my_name text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  hh uuid;
  me uuid;
begin
  if auth.uid() is null then
    raise exception 'Sign in first';
  end if;
  insert into households(name, created_by) values (household_name, auth.uid()) returning id into hh;
  insert into people(household_id, user_id, display_name, relationship, is_trusted)
    values (hh, auth.uid(), my_name, 'Self', true) returning id into me;
  insert into household_members(household_id, user_id, person_id, role) values (hh, auth.uid(), me, 'admin');
  insert into audit_events(household_id, actor_user_id, action, target_type, target_id)
    values (hh, auth.uid(), 'household.created', 'household', hh);
  return hh;
end $$;

-- Signed-out visitors can't call any of the permission helpers or setup functions.
revoke execute on function create_household(text, text) from public, anon;
revoke execute on function my_person_id(uuid) from public, anon;
revoke execute on function is_member(uuid) from public, anon;
revoke execute on function is_admin(uuid) from public, anon;
revoke execute on function can_view_item(uuid) from public, anon;
revoke execute on function can_edit_item(uuid) from public, anon;
grant execute on function create_household(text, text) to authenticated;
grant execute on function my_person_id(uuid), is_member(uuid), is_admin(uuid), can_view_item(uuid), can_edit_item(uuid) to authenticated;

-- Keep updated_at honest.
create or replace function touch_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;
create trigger items_touch before update on items for each row execute function touch_updated_at();
