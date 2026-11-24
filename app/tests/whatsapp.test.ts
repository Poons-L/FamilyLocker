import { Webhook } from 'standardwebhooks';
import { describe, expect, it, vi } from 'vitest';
import { handleSendOtp } from '../lib/send-otp';
import { loginCodeMessage, normalisePhone } from '../lib/whatsapp';

const SECRET_B64 = Buffer.from('test-secret-key-32-bytes-long!!!').toString('base64');
const env = {
  SEND_SMS_HOOK_SECRET: `v1,whsec_${SECRET_B64}`,
  WHATSAPP_TOKEN: 'meta-token',
  WHATSAPP_PHONE_NUMBER_ID: '1234567890',
} as unknown as NodeJS.ProcessEnv;

function signedRequest(payload: object, secret = SECRET_B64) {
  const body = JSON.stringify(payload);
  const id = 'msg_1';
  const ts = new Date();
  const signature = new Webhook(secret).sign(id, ts, body);
  return new Request('https://example.test/api/auth/send-otp', {
    method: 'POST', body,
    headers: { 'webhook-id': id, 'webhook-timestamp': String(Math.floor(ts.getTime() / 1000)), 'webhook-signature': signature },
  });
}

describe('phone numbers', () => {
  it('defaults to India and accepts common formats', () => {
    expect(normalisePhone('98765 43210')).toBe('+919876543210');
    expect(normalisePhone('09876543210')).toBe('+919876543210');
    expect(normalisePhone('+91 98765-43210')).toBe('+919876543210');
    expect(normalisePhone('+6591234567')).toBe('+6591234567');
    expect(normalisePhone('12345')).toBeNull();
  });
});

describe('WhatsApp login code hook', () => {
  it('sends the code with the approved template to the right number', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    const res = await handleSendOtp(signedRequest({ user: { phone: '919876543210' }, sms: { otp: '561166' } }), env, fetchMock);
    expect(res.status).toBe(200);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://graph.facebook.com/v21.0/1234567890/messages');
    const sent = JSON.parse(init.body);
    expect(sent.to).toBe('919876543210');
    expect(sent.template.name).toBe('familyos_login_code');
    expect(sent.template.components[0].parameters[0].text).toBe('561166');
    expect(init.headers.Authorization).toBe('Bearer meta-token');
  });

  it('refuses requests not signed by Supabase', async () => {
    const fetchMock = vi.fn();
    const forged = signedRequest({ user: { phone: '+919876543210' }, sms: { otp: '000000' } }, Buffer.from('wrong-secret-wrong-secret-wrong!').toString('base64'));
    const res = await handleSendOtp(forged, env, fetchMock);
    expect(res.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('says clearly when WhatsApp is not set up yet', async () => {
    const res = await handleSendOtp(signedRequest({ user: { phone: '+91' }, sms: { otp: '1' } }), {} as NodeJS.ProcessEnv);
    expect(res.status).toBe(503);
  });

  it('reports a WhatsApp failure back to Supabase', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{"error":"bad"}', { status: 400 }));
    const res = await handleSendOtp(signedRequest({ user: { phone: '+919876543210' }, sms: { otp: '1' } }), env, fetchMock);
    expect(res.status).toBe(502);
  });

  it('builds the copy-code button parameter Meta requires', () => {
    const m = loginCodeMessage('+919876543210', '123456', { token: 't', phoneNumberId: 'p', template: 'x', language: 'en' });
    expect(m.template.components[1]).toEqual({ type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: '123456' }] });
  });
});
