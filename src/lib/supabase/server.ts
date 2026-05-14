import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// No-auth server client — uses the anon key directly
// RLS is disabled in schema (see supabase-schema.sql notes)
export async function createClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
