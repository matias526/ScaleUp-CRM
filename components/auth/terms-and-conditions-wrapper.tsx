"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { TermsAndConditionsModal } from "./terms-and-conditions-modal"
import { TermsService } from "@/lib/services/terms-service"

export function TermsAndConditionsWrapper() {
  const [showTerms, setShowTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const checkTermsAcceptance = async () => {
      try {
        setIsLoading(true)

        // Obtener el usuario actual
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          console.error("Error al obtener la sesión:", sessionError)
          setIsLoading(false)
          return
        }

        if (!session?.user) {
          console.log("No hay usuario autenticado")
          setIsLoading(false)
          return
        }

        const userId = session.user.id
        console.log("Verificando aceptación de términos para el usuario:", userId)

        const termsService = new TermsService(supabase)
        const hasAccepted = await termsService.hasAcceptedTerms(userId)

        console.log("¿El usuario ha aceptado los términos?", hasAccepted)
        setShowTerms(!hasAccepted)
      } catch (error) {
        console.error("Error al verificar la aceptación de términos:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkTermsAcceptance()
  }, [supabase])

  const handleAccept = async () => {
    try {
      // Obtener el usuario actual
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.user) {
        console.error("No hay usuario autenticado para aceptar términos")
        return
      }

      const userId = session.user.id
      console.log("Registrando aceptación de términos para el usuario:", userId)

      const termsService = new TermsService(supabase)
      await termsService.acceptTerms(userId)

      console.log("Términos aceptados correctamente")
      setShowTerms(false)
    } catch (error) {
      console.error("Error al aceptar los términos:", error)
    }
  }

  // No renderizar nada mientras se está cargando
  if (isLoading) {
    return null
  }

  // Solo mostrar el modal si es necesario
  if (!showTerms) {
    return null
  }

  return (
    <TermsAndConditionsModal
      isOpen={showTerms}
      onAccept={handleAccept}
      // No permitir cerrar el modal sin aceptar los términos
      onOpenChange={(open) => {
        if (open === false) {
          // No hacer nada, no permitir cerrar
        }
      }}
    />
  )
}
