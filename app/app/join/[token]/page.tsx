// Where an invite link lands. Greets the person by name, then signs them in (or up) and joins them to the family.
import Link from 'next/link';
import { Nav } from '../../nav';
import { joinInvite } from '../../actions';
import { serverClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type Preview = { household_name: string; person_name: string; invited_by_name: string | null };

export default async function Join({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ error?: string }> }) {
  const { token } = await params;
  const { error } = await searchParams;
  const supabase = await serverClient();
  const [{ data }, { data: { user } }] = await Promise.all([
    supabase.rpc('invitation_preview', { token }),
    supabase.auth.getUser(),
  ]);
  const inv = (Array.isArray(data) ? data[0] : null) as Preview | null;

  if (!inv) {
    return (
      <main>
        <Nav />
        <section className="panel">
          <h1>This invite link doesn&apos;t work any more</h1>
          {error && <p className="err">{error}</p>}
          <p className="muted">It may have expired, been used already, or been replaced by a newer one. Ask the person who invited you to send a new link.</p>
          <p><Link className="linkbtn" href="/">Go to FamilyOS</Link></p>
        </section>
      </main>
    );
  }

  const from = inv.invited_by_name ?? 'Someone in your family';
  return (
    <main>
      <Nav />
      <section className="panel">
        <h1>Hi {inv.person_name}, {from} has invited you to {inv.household_name}</h1>
        <p className="muted">
          FamilyOS helps your family find what matters and know what to do if someone can&apos;t handle things.
          You&apos;ll only see what {from} has chosen to share with you.
        </p>
        {error && <p className="err">{error}</p>}
        {user ? (
          <form action={joinInvite} className="stack">
            <input type="hidden" name="token" value={token} />
            <p>You&apos;re signed in as <strong>{user.email}</strong>.</p>
            <button className="btn" type="submit">Join {inv.household_name}</button>
          </form>
        ) : (
          <form action={joinInvite} className="stack">
            <input type="hidden" name="token" value={token} />
            <label>Your email<input name="email" type="email" autoComplete="email" required /></label>
            <label>Choose a password <small>At least 8 characters</small><input name="password" type="password" autoComplete="new-password" minLength={8} required /></label>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className="btn" type="submit" name="mode" value="signup">Create account and join</button>
              <button className="linkbtn" type="submit" name="mode" value="signin">I already have an account</button>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}
