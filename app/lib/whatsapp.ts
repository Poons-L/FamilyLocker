// Sends a login code on WhatsApp through Meta's WhatsApp Cloud API.
// MVP: a personal (unverified) WhatsApp Business sender, limited by Meta to ~250 people a day.
// Before public launch this moves to a verified business sender; only the env values change.

export interface WhatsAppConfig {
  token: string;          // WHATSAPP_TOKEN (server only, never sent to the browser)
  phoneNumberId: string;  // WHATSAPP_PHONE_NUMBER_ID
  template: string;       // WHATSAPP_TEMPLATE, an approved "Authentication" template
  language: string;       // WHATSAPP_TEMPLATE_LANG, e.g. "en"
}

export function whatsappConfig(env = process.env): WhatsAppConfig | null {
  if (!env.WHATSAPP_TOKEN || !env.WHATSAPP_PHONE_NUMBER_ID) return null;
  return {
    token: env.WHATSAPP_TOKEN,
    phoneNumberId: env.WHATSAPP_PHONE_NUMBER_ID,
    template: env.WHATSAPP_TEMPLATE || 'familyos_login_code',
    language: env.WHATSAPP_TEMPLATE_LANG || 'en',
  };
}

/** Meta wants the number without "+" (e.g. 919876543210). */
export const toWhatsAppNumber = (e164: string) => e164.replace(/[^\d]/g, '');

/** Authentication templates carry the code in the body and in the copy-code button. */
export function loginCodeMessage(to: string, code: string, cfg: WhatsAppConfig) {
  return {
    messaging_product: 'whatsapp',
    to: toWhatsAppNumber(to),
    type: 'template',
    template: {
      name: cfg.template,
      language: { code: cfg.language },
      components: [
        { type: 'body', parameters: [{ type: 'text', text: code }] },
        { type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: code }] },
      ],
    },
  };
}

export async function sendLoginCode(to: string, code: string, cfg: WhatsAppConfig, fetchImpl: typeof fetch = fetch) {
  const res = await fetchImpl(`https://graph.facebook.com/v21.0/${cfg.phoneNumberId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${cfg.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(loginCodeMessage(to, code, cfg)),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`WhatsApp send failed (${res.status}): ${detail.slice(0, 300)}`);
  }
}

/** Accepts "98765 43210", "09876543210", "+91 98765 43210"; returns E.164 or null. Defaults to India. */
export function normalisePhone(input: string): string | null {
  const raw = input.replace(/[\s\-()]/g, '');
  if (/^\+\d{8,15}$/.test(raw)) return raw;
  const digits = raw.replace(/^0+/, '');
  if (/^[6-9]\d{9}$/.test(digits)) return `+91${digits}`;
  if (/^91[6-9]\d{9}$/.test(digits)) return `+${digits}`;
  return null;
}
