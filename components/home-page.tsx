"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/auth-provider"

export function HomePage() {
  const { session, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (session) {
        router.push("/dashboard")
      } else {
        router.push("/auth/login")
      }
    }
  }, [session, loading, router])

  // Mostrar un indicador de carga mientras se verifica la autenticación
  return <div className="flex items-center justify-center min-h-screen">Cargando...</div>
}
