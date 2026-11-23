import { Nav } from '../nav';
import { sendLoginLink } from '../actions';

export default async function Login({ searchParams }: { searchParams: Promise<{ sent?: string; error?: string }> }) {
  const { sent, error } = await searchParams;
  return (
    <main>
      <Nav />
      <section className="panel">
        <h1>Sign in</h1>
        {sent ? (
          <p className="ok">Check your email. We&apos;ve sent you a link to sign in. It works once and expires in an hour. It comes from noreply@mail.app.supabase.io, so check your spam or promotions folder if you don&apos;t see it.</p>
        ) : (
          <>
            <p className="muted">No password needed. We&apos;ll email you a sign-in link.</p>
            {error && <p className="err">{error}</p>}
            <form action={sendLoginLink} className="stack">
              <label>Email<input name="email" type="email" autoComplete="email" required /></label>
              <button className="btn" type="submit">Email me a sign-in link</button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}
