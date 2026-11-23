-- FamilyOS initial schema (PRD §22, §23, §25, §58, §59).
-- Metadata first: items describe what exists and where. Files are optional.
-- Row-level security is the second layer of permission enforcement; the app checks too.


-- ---------- households & people ----------
create table households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

-- Anyone in the family: members with logins and people without (children, parents, advisers).
create table people (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  user_id uuid references auth.users(id),          -- null until they accept an invite
  display_name text not null,
  full_name text,
  relationship text,
  is_trusted boolean not null default false,
  emergency_role text,
  contact_phone text,
  contact_email text,
  created_at timestamptz not null default now(),
  unique (household_id, user_id)
);

create type member_role as enum ('admin', 'member');
create table household_members (
  household_id uuid not null references households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  person_id uuid not null references people(id) on delete cascade,
  role member_role not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

-- ---------- items ----------
create type item_category as enum ('identity','money','insurance','property','legal','medical','work','children','digital','bills');
create type visibility as enum ('private','shared','emergency_preauthorised');
create type after_death_wish as enum ('keep','transfer','archive','memorialise','close');

create table items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  owner_person_id uuid not null references people(id),
  title text not null,
  category item_category not null,
  subtype text,
  description text,
  physical_location text,          -- "Bedroom cupboard, blue folder"
  external_location text,          -- "Google Drive > Insurance", "DigiLocker"
  reference_hint text,             -- partial identifiers only, e.g. "ending 8732"
  relevant_date date,
  expires_on date,
  last_verified_on date not null default current_date,
  visibility visibility not null default 'private',
  responsible_person_id uuid references people(id),
  backup_person_id uuid references people(id),
  is_critical boolean not null default false,
  emergency_kinds text[] not null default '{}',
  after_death after_death_wish,
  notes text,
  tags text[] not null default '{}',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on items (household_id);

-- Who knows the item exists vs who can open it in FamilyOS (PRD §5: different things).
create table item_knows (
  item_id uuid not null references items(id) on delete cascade,
  person_id uuid not null references people(id) on delete cascade,
  primary key (item_id, person_id)
);
create table item_access (
  item_id uuid not null references items(id) on delete cascade,
  person_id uuid not null references people(id) on delete cascade,
  granted_by uuid not null references auth.users(id),
  granted_at timestamptz not null default now(),
  primary key (item_id, person_id)
);

-- Optional files. Stored in a private bucket; served only through short-lived signed URLs.
create table documents (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references items(id) on delete cascade,
  storage_path text not null,
  mime_type text not null,
  size_bytes bigint not null,
  scan_status text not null default 'pending',   -- malware scan (PRD §49)
  uploaded_by uuid not null references auth.users(id),
  uploaded_at timestamptz not null default now()
);

-- AI suggestions are never authoritative until a person confirms them (PRD §56).
create table ai_extraction_records (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references items(id) on delete cascade,
  field text not null,
  proposed_value text,
  confidence numeric(3,2),
  status text not null default 'proposed',     -- proposed | confirmed | edited | rejected
  decided_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table reminders (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  item_id uuid references items(id) on delete cascade,
  kind text not null,                          -- expiry | renewal | annual_review | stale
  due_on date not null,
  for_person_id uuid references people(id),
  done_at timestamptz
);

create table invitations (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  person_id uuid not null references people(id) on delete cascade,
  email text not null,
  invited_by uuid not null references auth.users(id),
  token_hash text not null,
  expires_at timestamptz not null,
  accepted_at timestamptz
);

-- Append-only audit trail (PRD §49, §51).
create table audit_events (
  id bigint generated always as identity primary key,
  household_id uuid references households(id) on delete cascade,
  actor_user_id uuid,
  action text not null,                        -- item.viewed | item.shared | access.revoked | document.downloaded ...
  target_type text,
  target_id uuid,
  detail jsonb not null default '{}',
  at timestamptz not null default now()
);

-- ---------- permission helpers ----------
create or replace function my_person_id(hh uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select person_id from household_members where household_id = hh and user_id = auth.uid()
$$;

create or replace function is_member(hh uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from household_members where household_id = hh and user_id = auth.uid())
$$;

create or replace function is_admin(hh uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from household_members where household_id = hh and user_id = auth.uid() and role = 'admin')
$$;

-- The single rule (PRD §59): you can see an item only if you created it, it's yours,
-- or it was explicitly shared with you. Being an admin does NOT grant content access.
create or replace function can_view_item(i uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from items it
    where it.id = i
      and is_member(it.household_id)
      and (
        it.created_by = auth.uid()
        or it.owner_person_id = my_person_id(it.household_id)
        or exists (select 1 from item_access a where a.item_id = it.id and a.person_id = my_person_id(it.household_id))
      )
  )
$$;

create or replace function can_edit_item(i uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from items it
    where it.id = i and is_member(it.household_id)
      and (it.created_by = auth.uid() or it.owner_person_id = my_person_id(it.household_id))
  )
$$;

-- ---------- row-level security ----------
alter table households enable row level security;
alter table people enable row level security;
alter table household_members enable row level security;
alter table items enable row level security;
alter table item_knows enable row level security;
alter table item_access enable row level security;
alter table documents enable row level security;
alter table ai_extraction_records enable row level security;
alter table reminders enable row level security;
alter table invitations enable row level security;
alter table audit_events enable row level security;

create policy hh_read on households for select using (is_member(id));
create policy hh_create on households for insert with check (created_by = auth.uid());
create policy hh_update on households for update using (is_admin(id));

create policy people_read on people for select using (is_member(household_id));
create policy people_write on people for all using (is_admin(household_id)) with check (is_admin(household_id));

create policy members_read on household_members for select using (is_member(household_id));
create policy members_admin on household_members for all using (is_admin(household_id)) with check (is_admin(household_id));

create policy items_read on items for select using (can_view_item(id));
create policy items_create on items for insert with check (is_member(household_id) and created_by = auth.uid());
create policy items_update on items for update using (can_edit_item(id)) with check (can_edit_item(id));
create policy items_delete on items for delete using (can_edit_item(id));

create policy knows_read on item_knows for select using (can_view_item(item_id));
create policy knows_write on item_knows for all using (can_edit_item(item_id)) with check (can_edit_item(item_id));
create policy access_read on item_access for select using (can_view_item(item_id));
create policy access_write on item_access for all using (can_edit_item(item_id)) with check (can_edit_item(item_id) and granted_by = auth.uid());

create policy docs_read on documents for select using (can_view_item(item_id));
create policy docs_write on documents for all using (can_edit_item(item_id)) with check (can_edit_item(item_id));
create policy ai_read on ai_extraction_records for select using (can_view_item(item_id));
create policy ai_write on ai_extraction_records for all using (can_edit_item(item_id)) with check (can_edit_item(item_id));

create policy rem_read on reminders for select using (is_member(household_id) and (item_id is null or can_view_item(item_id)));
create policy rem_write on reminders for all using (is_member(household_id)) with check (is_member(household_id));

create policy inv_admin on invitations for all using (is_admin(household_id)) with check (is_admin(household_id));

-- Audit: members can add events and read their household's trail; nobody can edit or delete.
create policy audit_insert on audit_events for insert with check (household_id is null or is_member(household_id));
create policy audit_read on audit_events for select using (is_admin(household_id));
