/*import { Suspense } from "react"
import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { HomePage } from "@/components/home-page"

export const dynamic = "force-dynamic"

export default async function Home() {
  const supabase = createServerClient()

  // Verificar si el usuario está autenticado
  const {
    data: { session },
  } = await supabase.auth.getSession()  

  // Redirigir al dashboard si está autenticado, o al login si no lo está
  if (session) {
    redirect("/dashboard")
  } else {
    redirect("/auth/login")
  }

  // Esto nunca se renderizará debido a las redirecciones
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <HomePage />
    </Suspense>
  )
}
*/
import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export default async function Home() {
  const supabase = createServerClient()

  // 1. Usamos getUser() que es más seguro que getSession
  const { data: { user } } = await supabase.auth.getUser()

  // 2. Lógica directa: si hay usuario va al dashboard, si no al login
  if (user) {
    redirect("/dashboard")
  } else {
    redirect("/auth/login")
  }

  // No hace falta return ni Suspense porque el redirect corta la ejecución
}