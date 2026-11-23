import { Nav } from '../nav';
import { passwordAuth, sendLoginLink } from '../actions';

export default async function Login({ searchParams }: { searchParams: Promise<{ sent?: string; error?: string }> }) {
  const { sent, error } = await searchParams;
  return (
    <main>
      <Nav />
      <section className="panel">
        <h1>Sign in</h1>
        {sent && (
          <p className="ok">Check your email for a link. It comes from noreply@mail.app.supabase.io, so look in spam or promotions if you don&apos;t see it.</p>
        )}
        {error && <p className="err">{error}</p>}
        <form action={passwordAuth} className="stack">
          <label>Email<input name="email" type="email" autoComplete="email" required /></label>
          <label>Password <small>At least 8 characters</small><input name="password" type="password" autoComplete="current-password" minLength={8} required /></label>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn" type="submit" name="mode" value="signin">Sign in</button>
            <button className="linkbtn" type="submit" name="mode" value="signup">Create account</button>
          </div>
        </form>
      </section>
      <section className="panel">
        <h2>Prefer a link?</h2>
        <form action={sendLoginLink} className="stack">
          <label>Email<input name="email" type="email" autoComplete="email" required /></label>
          <button className="linkbtn" type="submit">Email me a sign-in link</button>
        </form>
      </section>
    </main>
  );
}
