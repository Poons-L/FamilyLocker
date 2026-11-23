// Runs the real migration in an in-memory Postgres and checks row-level security (PRD §32, §59).
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';

const A = '00000000-0000-0000-0000-00000000000a';
const M = '00000000-0000-0000-0000-00000000000b';
const K = '00000000-0000-0000-0000-00000000000c';
const HH = '10000000-0000-0000-0000-000000000001';
const pA = '20000000-0000-0000-0000-00000000000a', pM = '20000000-0000-0000-0000-00000000000b', pK = '20000000-0000-0000-0000-00000000000c';
const BANK = '30000000-0000-0000-0000-000000000001', WILL = '30000000-0000-0000-0000-000000000002', PPF = '30000000-0000-0000-0000-000000000003';

let db: PGlite;

async function as<T = Record<string, unknown>>(uid: string, sql: string): Promise<T[]> {
  await db.exec(`set role authenticated; select set_config('app.uid', '${uid}', false);`);
  try { return (await db.query<T>(sql)).rows; } finally { await db.exec('reset role'); }
}

beforeAll(async () => {
  db = new PGlite();
  // Minimal stand-in for Supabase's auth schema.
  await db.exec(`
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('app.uid', true), '')::uuid $$;
    create role authenticated nologin;`);
  await db.exec('create role anon nologin;');
  for (const f of ['0001_init.sql', '0002_household_setup.sql', '0003_private_helpers.sql']) {
    await db.exec(readFileSync(new URL(`../../supabase/migrations/${f}`, import.meta.url), 'utf8'));
  }
  await db.exec(`
    grant usage on schema public, auth to authenticated;
    grant all on all tables in schema public to authenticated;
    grant execute on all functions in schema public, auth to authenticated;
    insert into auth.users values ('${A}'), ('${M}'), ('${K}');
    insert into households(id, name, created_by) values ('${HH}', 'Mehta', '${A}');
    insert into people(id, household_id, user_id, display_name) values
      ('${pA}', '${HH}', '${A}', 'Arun'), ('${pM}', '${HH}', '${M}', 'Meera'), ('${pK}', '${HH}', '${K}', 'Kavita');
    insert into household_members(household_id, user_id, person_id, role) values
      ('${HH}', '${A}', '${pA}', 'admin'), ('${HH}', '${M}', '${pM}', 'member'), ('${HH}', '${K}', '${pK}', 'member');
    insert into items(id, household_id, created_by, owner_person_id, title, category) values
      ('${BANK}', '${HH}', '${A}', '${pA}', 'HDFC account', 'money'),
      ('${WILL}', '${HH}', '${A}', '${pA}', 'Will', 'legal'),
      ('${PPF}',  '${HH}', '${M}', '${pM}', 'Meera private PPF', 'money');
    insert into item_access(item_id, person_id, granted_by) values ('${BANK}', '${pM}', '${A}'), ('${WILL}', '${pK}', '${A}');`);
});

const titles = async (uid: string) => (await as<{ title: string }>(uid, 'select title from items order by title')).map((r) => r.title);

describe('row-level security', () => {
  it('shows each person only what they own or was shared with them', async () => {
    expect(await titles(A)).toEqual(['HDFC account', 'Will']);
    expect(await titles(M)).toEqual(['HDFC account', 'Meera private PPF']);
    expect(await titles(K)).toEqual(['Will']);
  });
  it('does not let a household admin read private items', async () => {
    expect(await titles(A)).not.toContain('Meera private PPF');
  });
  it('does not let someone grant themselves access', async () => {
    await expect(as(K, `insert into item_access(item_id, person_id, granted_by) values ('${BANK}', '${pK}', '${K}')`)).rejects.toThrow(/row-level security/);
  });
  it('does not let a viewer edit an item shared with them', async () => {
    expect(await as(K, `update items set title = 'changed' where id = '${WILL}' returning id`)).toEqual([]);
  });
  it('keeps the audit trail append-only', async () => {
    await as(A, `insert into audit_events(household_id, actor_user_id, action) values ('${HH}', '${A}', 'item.shared')`);
    expect(await as(A, 'delete from audit_events returning id')).toEqual([]);
    expect((await as(A, 'select count(*)::int as n from audit_events'))[0]).toEqual({ n: 1 });
  });
});
