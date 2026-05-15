import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Server client — uses service role key so reads bypass RLS on all dashboard pages
export async function createClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
