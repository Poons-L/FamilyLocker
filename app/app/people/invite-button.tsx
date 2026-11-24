'use client';
import { useActionState, useState } from 'react';
import { createInvite } from '../actions';
import type { InviteState } from '@/lib/invite-state';

export function InviteButton({ personId, name, pending }: { personId: string; name: string; pending: boolean }) {
  const [state, action, busy] = useActionState(createInvite, {} as InviteState);
  const [copied, setCopied] = useState(false);

  if (state.link) {
    const copy = async () => {
      try { await navigator.clipboard.writeText(state.link!); setCopied(true); } catch { setCopied(false); }
    };
    return (
      <div className="invite">
        <a className="btn" href={state.whatsapp} target="_blank" rel="noopener noreferrer">Send to {name} on WhatsApp</a>
        <button className="linkbtn" type="button" onClick={copy}>{copied ? 'Copied' : 'Copy link'}</button>
        <input aria-label={`Invite link for ${name}`} readOnly value={state.link} onFocus={(e) => e.currentTarget.select()} />
        <small className="muted">Works once. Expires in 7 days.</small>
      </div>
    );
  }
  return (
    <form action={action} className="invite">
      <input type="hidden" name="person" value={personId} />
      <button className="linkbtn" type="submit" disabled={busy}>
        {busy ? 'Creating link…' : pending ? `Send ${name} a new invite` : `Invite ${name}`}
      </button>
      {state.error && <p className="err">{state.error}</p>}
    </form>
  );
}
