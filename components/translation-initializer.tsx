"use client"

import { useEffect, useState } from "react"
import { TranslationService } from "@/lib/services/translation-service"

export function TranslationInitializer() {
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    // Activar modo debug en desarrollo
    if (process.env.NODE_ENV === "development") {
      TranslationService.setDebugMode(true)
    }

    // Cargar traducciones inmediatamente al montar el componente
    const initTranslations = async () => {
      if (initialized) return

      console.log("Inicializando traducciones...")
      try {
        await TranslationService.initialize()
        console.log("Traducciones inicializadas:", TranslationService.isInitialized)

        // Verificar si hubo algún error durante la inicialización
        const lastError = TranslationService.getLastError()
        if (lastError) {
          console.error("Error al inicializar traducciones:", lastError)
        }

        setInitialized(true)
      } catch (error) {
        console.error("Error inesperado al inicializar traducciones:", error)
      }
    }

    initTranslations()
  }, [initialized])

  // Este componente no renderiza nada visible
  return null
}
