// Supabase clients. Not used by the demo page yet; ready for when the project is connected.
// Every query runs as the signed-in user, so the database's row-level security
// (supabase/migrations/0001_init.sql) decides what they can see. The service-role key
// must never be used to read family content on behalf of a user (PRD §51, §59).
import { createBrowserClient } from '@supabase/ssr';

export function browserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase is not configured. Copy .env.example to .env.local and fill it in.');
  return createBrowserClient(url, key);
}
