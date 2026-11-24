// Runs the real migration in an in-memory Postgres and checks row-level security (PRD §32, §59).
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { hashToken } from '../lib/tokens';
import { beforeAll, describe, expect, it } from 'vitest';

const A = '00000000-0000-0000-0000-00000000000a';
const M = '00000000-0000-0000-0000-00000000000b';
const K = '00000000-0000-0000-0000-00000000000c';
const HH = '10000000-0000-0000-0000-000000000001';
const pA = '20000000-0000-0000-0000-00000000000a', pM = '20000000-0000-0000-0000-00000000000b', pK = '20000000-0000-0000-0000-00000000000c';
const R = '00000000-0000-0000-0000-00000000000d', pR = '20000000-0000-0000-0000-00000000000d', DAD = '30000000-0000-0000-0000-000000000004';
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
  for (const f of ['0001_init.sql', '0002_household_setup.sql', '0003_private_helpers.sql', '0004_invitations.sql']) {
    await db.exec(readFileSync(new URL(`../../supabase/migrations/${f}`, import.meta.url), 'utf8'));
  }
  await db.exec(`
    grant usage on schema public, auth to authenticated;
    grant all on all tables in schema public to authenticated;
    grant execute on all functions in schema public, auth to authenticated;
    insert into auth.users values ('${A}'), ('${M}'), ('${K}'), ('${R}');
    insert into households(id, name, created_by) values ('${HH}', 'Mehta', '${A}');
    insert into people(id, household_id, user_id, display_name) values
      ('${pA}', '${HH}', '${A}', 'Arun'), ('${pM}', '${HH}', '${M}', 'Meera'), ('${pK}', '${HH}', '${K}', 'Kavita'), ('${pR}', '${HH}', null, 'Raj');
    insert into household_members(household_id, user_id, person_id, role) values
      ('${HH}', '${A}', '${pA}', 'admin'), ('${HH}', '${M}', '${pM}', 'member'), ('${HH}', '${K}', '${pK}', 'member');
    insert into items(id, household_id, created_by, owner_person_id, title, category) values
      ('${BANK}', '${HH}', '${A}', '${pA}', 'HDFC account', 'money'),
      ('${WILL}', '${HH}', '${A}', '${pA}', 'Will', 'legal'),
      ('${PPF}',  '${HH}', '${M}', '${pM}', 'Meera private PPF', 'money'),
      ('${DAD}',  '${HH}', '${A}', '${pA}', 'Dad insurance', 'insurance');
    insert into item_access(item_id, person_id, granted_by) values ('${BANK}', '${pM}', '${A}'), ('${WILL}', '${pK}', '${A}'), ('${DAD}', '${pR}', '${A}');`);
});

const titles = async (uid: string) => (await as<{ title: string }>(uid, 'select title from items order by title')).map((r) => r.title);

describe('row-level security', () => {
  it('shows each person only what they own or was shared with them', async () => {
    expect(await titles(A)).toEqual(['Dad insurance', 'HDFC account', 'Will']);
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

async function asAnon<T = Record<string, unknown>>(sql: string): Promise<T[]> {
  await db.exec(`set role anon; select set_config('app.uid', '', false);`);
  try { return (await db.query<T>(sql)).rows; } finally { await db.exec('reset role'); }
}

describe('invitations', () => {
  const TOKEN = 'test-secret-token-for-raj';
  const invite = (uid: string, token: string, expires = "now() + interval '7 days'") =>
    as(uid, `insert into invitations(household_id, person_id, invited_by, token_hash, expires_at)
             values ('${HH}', '${pR}', '${uid}', '${hashToken(token)}', ${expires}) returning id`);

  beforeAll(async () => {
    await db.exec(`grant usage on schema public to anon; grant execute on function invitation_preview(text) to anon;`);
  });

  it('only the household admin can create an invite', async () => {
    await expect(invite(M, 'meera-tries')).rejects.toThrow(/row-level security/);
    expect(await invite(A, TOKEN)).toHaveLength(1);
  });

  it('greets the invitee by name only with the right link, even before sign-in', async () => {
    expect(await asAnon(`select * from invitation_preview('${TOKEN}')`)).toEqual([
      { household_name: 'Mehta', person_name: 'Raj', invited_by_name: 'Arun' },
    ]);
    expect(await asAnon(`select * from invitation_preview('wrong-token')`)).toEqual([]);
  });

  it('gives the invitee exactly what was shared with them, once', async () => {
    expect(await titles(R)).toEqual([]);
    expect(await as(R, `select accept_invitation('${TOKEN}') as hh`)).toEqual([{ hh: HH }]);
    expect(await titles(R)).toEqual(['Dad insurance']);
    expect(await as(R, `select role::text from household_members where user_id = '${R}'`)).toEqual([{ role: 'member' }]);
    await expect(as(R, `select accept_invitation('${TOKEN}')`)).rejects.toThrow(/expired or was already used/);
  });

  it('refuses an expired link', async () => {
    await db.exec(`update people set user_id = null where id = '${pR}'; delete from household_members where user_id = '${R}';`);
    await invite(A, 'old-token', "now() - interval '1 day'");
    await expect(as(R, `select accept_invitation('old-token')`)).rejects.toThrow(/expired/);
    expect(await asAnon(`select * from invitation_preview('old-token')`)).toEqual([]);
  });
});
