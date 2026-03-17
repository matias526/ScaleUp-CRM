import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

// Cliente de Supabase con service role key para operaciones administrativas
// Este cliente bypasea RLS y debe usarse solo en API routes del servidor
export function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase service role credentials")
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
