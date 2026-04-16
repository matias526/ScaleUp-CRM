import { createServerClient as createSupabaseClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export function createServerClient() {
  // 1. Obtenemos el store de cookies (en Next 16 es una promesa)
  const cookieStore = cookies()

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // 2. IMPORTANTE: Ponemos 'async' aquí
        async get(name: string) {
          // 3. Agregamos el 'await' antes de cookieStore
          const store = await cookieStore
          return store.get(name)?.value
        },
        async set(name: string, value: string, options: any) {
          const store = await cookieStore
          try {
            store.set({ name, value, ...options })
          } catch (error) {
            // Se ignora si es en un Server Component
          }
        },
        async remove(name: string, options: any) {
          const store = await cookieStore
          try {
            store.set({ name, value: "", ...options, maxAge: -1 })
          } catch (error) {
            // Se ignora si es en un Server Component
          }
        },
      },
    }
  )
}