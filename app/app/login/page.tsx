import { Nav } from '../nav';
import { passwordAuth, sendLoginLink, sendPhoneCode, verifyPhoneCode } from '../actions';
import { whatsappConfig } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

type Params = { sent?: string; error?: string; step?: string; phone?: string; next?: string };

export default async function Login({ searchParams }: { searchParams: Promise<Params> }) {
  const { sent, error, step, phone, next = '/' } = await searchParams;
  const phoneOn = Boolean(whatsappConfig() && process.env.SEND_SMS_HOOK_SECRET);
  const masked = phone ? phone.replace(/^(\+\d{2})(\d+)(\d{4})$/, (_, cc, mid, end) => `${cc} ${'•'.repeat(mid.length)}${end}`) : '';

  return (
    <main>
      <Nav />
      {phoneOn && (
        <section className="panel">
          <h1>Sign in with your mobile number</h1>
          {error && <p className="err">{error}</p>}
          {step === 'code' && phone ? (
            <form action={verifyPhoneCode} className="stack">
              <input type="hidden" name="phone" value={phone} />
              <input type="hidden" name="next" value={next} />
              <p>We&apos;ve sent a 6-digit code on WhatsApp to <strong>{masked}</strong>.</p>
              <label>Code<input name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,7}" maxLength={7} required autoFocus /></label>
              <button className="btn" type="submit">Sign in</button>
              <p className="muted small"><a href={`/login?next=${encodeURIComponent(next)}`}>Use a different number or send a new code</a></p>
            </form>
          ) : (
            <form action={sendPhoneCode} className="stack">
              <input type="hidden" name="next" value={next} />
              <label>Mobile number <small>We&apos;ll send a code on WhatsApp. No password needed.</small>
                <input name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="98765 43210" defaultValue={phone ?? ''} required />
              </label>
              <button className="btn" type="submit">Send code on WhatsApp</button>
              <p className="muted small">Early version: codes come from a FamilyOS test number. It will change to our official WhatsApp account at launch.</p>
            </form>
          )}
        </section>
      )}

      <details className="panel" open={!phoneOn}>
        <summary><h2 style={{ display: 'inline' }}>{phoneOn ? 'Use email instead' : 'Sign in'}</h2></summary>
        {sent && <p className="ok">Check your email for a link. It comes from noreply@mail.app.supabase.io, so look in spam or promotions if you don&apos;t see it.</p>}
        {!phoneOn && error && <p className="err">{error}</p>}
        <form action={passwordAuth} className="stack" style={{ marginTop: 12 }}>
          <label>Email<input name="email" type="email" autoComplete="email" required /></label>
          <label>Password <small>At least 8 characters</small><input name="password" type="password" autoComplete="current-password" minLength={8} required /></label>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn" type="submit" name="mode" value="signin">Sign in</button>
            <button className="linkbtn" type="submit" name="mode" value="signup">Create account</button>
          </div>
        </form>
        <form action={sendLoginLink} className="stack" style={{ marginTop: 12 }}>
          <label>Or get a sign-in link by email<input name="email" type="email" autoComplete="email" required /></label>
          <button className="linkbtn" type="submit">Email me a sign-in link</button>
        </form>
      </details>
    </main>
  );
}
