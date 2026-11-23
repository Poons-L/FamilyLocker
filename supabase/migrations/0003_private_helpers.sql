-- Move permission helpers out of the API-exposed schema (Supabase security advisor 0029).
-- RLS policies keep working: they reference the functions directly, not by name lookup.
create schema if not exists private;
grant usage on schema private to authenticated;

alter function public.my_person_id(uuid) set schema private;
alter function public.is_member(uuid) set schema private;
alter function public.is_admin(uuid) set schema private;
alter function public.can_view_item(uuid) set schema private;
alter function public.can_edit_item(uuid) set schema private;

alter function private.my_person_id(uuid) set search_path = public, private;
alter function private.is_member(uuid) set search_path = public, private;
alter function private.is_admin(uuid) set search_path = public, private;
alter function private.can_view_item(uuid) set search_path = public, private;
alter function private.can_edit_item(uuid) set search_path = public, private;
