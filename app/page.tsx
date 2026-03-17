import { Suspense } from "react"
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
