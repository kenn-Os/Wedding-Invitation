import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('CRITICAL: Missing Supabase environment variables for Admin. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
}

// Admin client with service role — NEVER expose this to the browser
export const supabaseAdmin = createClient(
  supabaseUrl || 'https://MISSING_URL.supabase.co',
  serviceRoleKey || 'MISSING_KEY',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
