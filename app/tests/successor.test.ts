// Named successor: FamilyOS must not become a single point of failure itself.
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';

const A = '00000000-0000-0000-0000-0000000000a1'; // owner
const M = '00000000-0000-0000-0000-0000000000b1'; // spouse, named successor
const K = '00000000-0000-0000-0000-0000000000c1'; // sister, ordinary member
const HH = '10000000-0000-0000-0000-0000000000a1';
const pA = '20000000-0000-0000-0000-0000000000a1', pM = '20000000-0000-0000-0000-0000000000b1', pK = '20000000-0000-0000-0000-0000000000c1';
const LOCKER = '30000000-0000-0000-0000-0000000000a1'; // set aside for the successor
const DIARY = '30000000-0000-0000-0000-0000000000a2';  // stays private

let db: PGlite;

async function as<T = Record<string, unknown>>(uid: string, sql: string): Promise<T[]> {
  await db.exec(`set role authenticated; select set_config('app.uid', '${uid}', false);`);
  try { return (await db.query<T>(sql)).rows; } finally { await db.exec('reset role'); }
}
const titles = async (uid: string) => (await as<{ title: string }>(uid, 'select title from items order by title')).map((r) => r.title);
const role = async (uid: string) => (await as<{ role: string }>(uid, `select role::text from household_members where user_id = '${uid}'`))[0]?.role;

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('app.uid', true), '')::uuid $$;
    create role authenticated nologin; create role anon nologin;`);
  for (const f of ['0001_init.sql', '0002_household_setup.sql', '0003_private_helpers.sql', '0004_invitations.sql', '0005_successor.sql']) {
    await db.exec(readFileSync(new URL(`../../supabase/migrations/${f}`, import.meta.url), 'utf8'));
  }
  await db.exec(`
    grant usage on schema public, auth to authenticated;
    grant all on all tables in schema public to authenticated;
    grant execute on function auth.uid() to authenticated;
    insert into auth.users values ('${A}'), ('${M}'), ('${K}');
    insert into households(id, name, created_by) values ('${HH}', 'Mehta', '${A}');
    insert into people(id, household_id, user_id, display_name) values
      ('${pA}', '${HH}', '${A}', 'Arun'), ('${pM}', '${HH}', '${M}', 'Meera'), ('${pK}', '${HH}', '${K}', 'Kavita');
    insert into household_members(household_id, user_id, person_id, role) values
      ('${HH}', '${A}', '${pA}', 'admin'), ('${HH}', '${M}', '${pM}', 'member'), ('${HH}', '${K}', '${pK}', 'member');
    insert into items(id, household_id, created_by, owner_person_id, title, category, release_to_successor) values
      ('${LOCKER}', '${HH}', '${A}', '${pA}', 'SBI locker', 'property', true),
      ('${DIARY}',  '${HH}', '${A}', '${pA}', 'Private notes', 'legal', false);`);
});

describe('named successor', () => {
  it('only an owner can name a successor, and it must be someone who has joined', async () => {
    await expect(as(M, `select set_successor('${HH}', '${pM}')`)).rejects.toThrow(/Only an owner/);
    await expect(as(A, `select set_successor('${HH}', '${pA}')`)).rejects.toThrow(/someone else/);
    await as(A, `select set_successor('${HH}', '${pM}')`);
    expect(await as(A, `select successor_person_id from households`)).toEqual([{ successor_person_id: pM }]);
  });

  it('only the successor can ask to take over', async () => {
    await expect(as(K, `select request_handover('${HH}')`)).rejects.toThrow(/Only the named successor/);
    expect(await as(M, `select request_handover('${HH}') is not null as ok`)).toEqual([{ ok: true }]);
  });

  it('makes the successor wait 7 days', async () => {
    await expect(as(M, `select complete_handover('${HH}')`)).rejects.toThrow(/You can take over from/);
    expect(await role(M)).toBe('member');
    expect(await titles(M)).toEqual([]);
  });

  it('lets the owner cancel during the wait', async () => {
    await as(A, `select cancel_handover('${HH}')`);
    expect(await as(A, `select handover_requested_at from households`)).toEqual([{ handover_requested_at: null }]);
    await expect(as(M, `select complete_handover('${HH}')`)).rejects.toThrow(/Ask to take over first/);
  });

  it('after 7 days the successor becomes an owner and sees only what was set aside', async () => {
    await as(M, `select request_handover('${HH}')`);
    await db.exec(`update households set handover_requested_at = now() - interval '8 days' where id = '${HH}'`);
    await as(M, `select complete_handover('${HH}')`);
    expect(await role(M)).toBe('admin');
    expect(await role(A)).toBe('admin'); // the original owner keeps their access
    expect(await titles(M)).toEqual(['SBI locker']);
    expect(await as(A, `select successor_person_id from households`)).toEqual([{ successor_person_id: null }]);
  });

  it('an owner can hand over straight away', async () => {
    await as(A, `select set_successor('${HH}', '${pK}')`);
    await expect(as(K, `select complete_handover('${HH}')`)).rejects.toThrow(/Ask to take over first/);
    await as(A, `select complete_handover('${HH}')`);
    expect(await role(K)).toBe('admin');
    expect(await titles(K)).toEqual(['SBI locker']);
  });
});
