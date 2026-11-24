// Supabase "Send SMS" auth hook endpoint. Logic and signature check live in lib/send-otp.ts.
import { handleSendOtp } from '@/lib/send-otp';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  return handleSendOtp(req);
}
