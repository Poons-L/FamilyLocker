# WhatsApp login setup (MVP, personal sender)

FamilyOS sends login codes on WhatsApp. For the MVP we use Meta's WhatsApp Cloud API with a personal (unverified) business account. Before public launch, this moves to a verified FamilyOS business sender; only the settings below change, not the app.

**Limits while unverified:** Meta's free test number can message up to **5 numbers you add**. To go beyond that, add a real number (a spare SIM not already on WhatsApp), which allows roughly 250 people a day.

**Time:** about 30–45 minutes, plus template approval (often minutes, sometimes a day).

---

## 1. Create the Meta app (15 min)

1. Go to https://developers.facebook.com and log in with your Facebook account.
2. **My Apps → Create app.** Choose the use case **"Connect with customers through WhatsApp"** (or type **Business**). Name it `FamilyOS`.
3. When asked for a business portfolio, create one called `FamilyOS` (a personal one is fine for now).
4. In the app, open **WhatsApp → API Setup**. You'll see a free **test phone number** and its **Phone number ID**. Copy the Phone number ID somewhere safe.
5. Under **"To"**, add the WhatsApp numbers of your first testers (you, your spouse, up to 5). Each person confirms with a code Meta sends them.

## 2. Create the login-code template (5 min)

1. Open **WhatsApp Manager → Message templates → Create template**.
2. **Category:** Authentication. **Name:** `familyos_login_code`. **Language:** English.
3. **Code delivery:** Copy code. Keep the security line ("For your security, do not share this code") switched on.
4. Submit. Wait for status **Active** (usually within minutes).

## 3. Create a permanent access token (10 min)

The token on the API Setup page expires in 24 hours, so make a permanent one:

1. Go to **Business settings → Users → System users → Add**. Name: `familyos-app`. Role: Admin.
2. **Assign assets:** add the FamilyOS app (full control) and your WhatsApp account.
3. **Generate new token:** pick the FamilyOS app, expiry **Never**, permissions `whatsapp_business_messaging` and `whatsapp_business_management`.
4. Copy the token. **Don't paste it into chat or email.** You'll paste it straight into Vercel in step 5.

## 4. Turn on phone login in Supabase (5 min)

FamilyOS project: https://supabase.com/dashboard/project/zrtxegzgbhluwvnjsfrm

1. **Authentication → Sign In / Providers → Phone:** switch on and save. (No SMS provider details are needed; FamilyOS sends the codes.)
2. **Authentication → Auth Hooks → Add hook → Send SMS hook.**
   - Type: **HTTPS**
   - URL: `https://familyos-peach.vercel.app/api/auth/send-otp`
   - Click **Generate secret** and copy it (starts with `v1,whsec_`).
   - Save.

## 5. Add the keys to Vercel (5 min)

Vercel → project **familyos** → **Settings → Environment Variables**. Add each one as **Sensitive**, for **Production** (and Preview if offered):

| Name | Value |
|---|---|
| `SEND_SMS_HOOK_SECRET` | the secret from step 4 |
| `WHATSAPP_TOKEN` | the permanent token from step 3 |
| `WHATSAPP_PHONE_NUMBER_ID` | the Phone number ID from step 1 |

Then tell Claude "WhatsApp keys added". Claude redeploys and tests a login code.

---

## Before public launch

- Verify the FamilyOS business with Meta (registered entity, website, business email).
- Register a dedicated FamilyOS WhatsApp number and display name.
- Update the three Vercel values. Remove the "test number" note on the login page.
- Turn email confirmation back on in Supabase for email sign-ups.
