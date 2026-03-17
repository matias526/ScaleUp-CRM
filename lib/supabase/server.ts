import { createServerClient as createSSRServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { Database } from "@/types/supabase"

// Create a Supabase client for server-side operations
// Uses cookies() from Next.js for session management
export async function createServerClientInstance() {
  const cookieStore = await cookies()
  
  return createSSRServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setCookie(name, value, options) {
          try {
            cookieStore.set(name, value, options)
          } catch (error) {
            // Handle errors in setting cookies
          }
        },
        removeCookie(name, options) {
          try {
            cookieStore.delete(name)
          } catch (error) {
            // Handle errors in removing cookies
          }
        },
      },
    }
  )
}

// Export with the name expected by existing code
export const createServerClient = createServerClientInstance

// Maintain compatibility with existing code
export const createClient = createServerClientInstance
