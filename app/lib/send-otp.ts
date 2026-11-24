// Supabase "Send SMS" auth hook. Supabase calls this with a signed payload holding the phone number
// and the one-time code; we deliver the code on WhatsApp. The signature check stops anyone else
// from using this endpoint to send messages.
import { Webhook } from 'standardwebhooks';
import { sendLoginCode, whatsappConfig } from '@/lib/whatsapp';

type HookPayload = { user: { phone?: string }; sms: { otp: string } };

const fail = (status: number, message: string) =>
  Response.json({ error: { http_code: status, message } }, { status });

export async function handleSendOtp(req: Request, env = process.env, fetchImpl: typeof fetch = fetch) {
  const secret = env.SEND_SMS_HOOK_SECRET;
  const cfg = whatsappConfig(env);
  if (!secret || !cfg) return fail(503, 'WhatsApp login is not set up yet.');

  const body = await req.text();
  let payload: HookPayload;
  try {
    payload = new Webhook(secret.replace(/^v1,whsec_/, '')).verify(body, Object.fromEntries(req.headers)) as HookPayload;
  } catch {
    return fail(401, 'Invalid signature');
  }
  const phone = payload.user?.phone;
  if (!phone || !payload.sms?.otp) return fail(400, 'Missing phone number or code');

  try {
    await sendLoginCode(phone.startsWith('+') ? phone : `+${phone}`, payload.sms.otp, cfg, fetchImpl);
  } catch (e) {
    console.error('send-otp', e instanceof Error ? e.message : e);
    return fail(502, 'Could not send the WhatsApp code. Please try again.');
  }
  return Response.json({});
}
