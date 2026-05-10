"use client"

import { useState, useEffect, useCallback } from "react"
import { TranslationService } from "@/lib/services/translation-service-fixed"
import { useAuth } from "@/components/auth/auth-provider"
import { supabase } from "@/lib/supabase/client"

export function useTranslations(localDictionary?: Record<string, Record<string, string>>) {
  const [language, setLanguage] = useState<string>("es") // Default to Spanish
  const [isLoaded, setIsLoaded] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState<number>(0)
  const { user } = useAuth()

  // Función para obtener el idioma preferido del usuario desde la base de datos
  const fetchUserLanguagePreference = useCallback(async (userId: string) => {
    try {
      // Primero intentamos obtener desde la tabla de usuarios (más confiable)
      const { data, error } = await supabase.from("users").select("preferred_language").eq("id", userId).single()

      if (error) {
        console.error("Error al obtener preferencia de idioma:", error)
        return null
      }

      return data?.preferred_language || null
    } catch (err) {
      console.error("Error inesperado al obtener preferencia de idioma:", err)
      return null
    }
  }, [])

  useEffect(() => {
    const initTranslations = async () => {
      try {
        console.log("🔄 Iniciando carga de traducciones (intento #" + (retryCount + 1) + ")...")

        // Verificar si el servicio ya está inicializado
        if (TranslationService.isInitialized) {
          console.log("✅ TranslationService ya está inicializado")
          setIsLoaded(true)
          setError(null)
          
          // Si el servicio ya está inicializado, establecer el idioma desde el usuario
          if (user) {
            const dbLanguage = await fetchUserLanguagePreference(user.id)
            if (dbLanguage) {
              console.log("🌍 Idioma obtenido de la base de datos (paso rápido):", dbLanguage)
              setLanguage(dbLanguage)
              localStorage.setItem("userLanguage", dbLanguage)
            }
          }
          return
        }

        // Intentar inicializar el servicio de traducciones
        console.log("🚀 Inicializando TranslationService...")
        await TranslationService.initialize()

        // VERIFICACIÓN CRÍTICA: Comprobar que realmente se inicializó
        if (!TranslationService.isInitialized) {
          const lastError = TranslationService.getLastError()
          const errorMsg = lastError ? lastError.message : "TranslationService no se inicializó correctamente"

          console.error("❌ TranslationService NO se inicializó:", errorMsg)
          setError(errorMsg)

          // Si hay un error, intentar de nuevo después de un tiempo
          if (retryCount < 5) {
            console.log(`⏳ Reintentando inicialización en 3 segundos... (intento ${retryCount + 1}/5)`)
            setTimeout(() => {
              setRetryCount((prev) => prev + 1)
            }, 3000)
            return
          } else {
            console.error("💥 Se agotaron los intentos de inicialización")
            setIsLoaded(false) // Marcar explícitamente como NO cargado
            return
          }
        }

        // Verificar que las traducciones se cargaron
        const availableLanguages = TranslationService.getAvailableLanguages()
        const stats = TranslationService.getInitStats()

        console.log("📊 Estadísticas de inicialización:", {
          languages: availableLanguages,
          totalTranslations: stats.count,
          isInitialized: TranslationService.isInitialized,
        })

        if (availableLanguages.length === 0 || stats.count === 0) {
          const errorMsg = "No se cargaron traducciones desde la base de datos"
          console.error("❌", errorMsg)
          setError(errorMsg)
          setIsLoaded(false)
          return
        }

        // Solo ahora marcar como exitoso
        setError(null)

        let selectedLanguage = "es" // Idioma por defecto

        // 1. Intentar obtener el idioma directamente de la base de datos
        if (user) {
          const dbLanguage = await fetchUserLanguagePreference(user.id)
          if (dbLanguage) {
            console.log("🌍 Idioma obtenido de la base de datos:", dbLanguage)
            selectedLanguage = dbLanguage
            localStorage.setItem("userLanguage", dbLanguage)
          }
        }

        // 2. Si no se pudo obtener de la base de datos, intentar con localStorage
        if (!user) {
          const storedLanguage = localStorage.getItem("userLanguage")
          if (storedLanguage) {
            console.log("💾 Idioma obtenido de localStorage:", storedLanguage)
            selectedLanguage = storedLanguage
          }
        }

        console.log("🎯 Idioma seleccionado final:", selectedLanguage)
        setLanguage(selectedLanguage)

        // Verificar que existen traducciones para el idioma seleccionado
        const testKeys = ["dashboard.kpis.pipelineValue", "dashboard.kpis.totalOpportunities"]

        console.log("🧪 Probando traducciones clave:")
        testKeys.forEach((key) => {
          const translation = TranslationService.getTranslation(key, selectedLanguage)
          const exists = TranslationService.hasTranslation(key, selectedLanguage)
          console.log(`  ${key} (${selectedLanguage}): ${translation} [existe: ${exists}]`)
        })

        // SOLO AHORA marcar como cargado
        setIsLoaded(true)
        console.log("✅ Traducciones inicializadas correctamente")
      } catch (err) {
        console.error("💥 Error inesperado al inicializar traducciones:", err)
        setError(err instanceof Error ? err.message : String(err))
        setIsLoaded(false)
      }
    }

    initTranslations()
  }, [user, fetchUserLanguagePreference, retryCount])

  const t = useCallback(
    (key: string, defaultValue = ""): string => {
      // 1. Si hay diccionario local, buscar primero ahí
      if (localDictionary && localDictionary[key]) {
        const translation = localDictionary[key][language]
        if (translation) {
          console.log(`[v0] T() - Found "${key}" in localDict:`, translation)
          return translation
        }
      }

      // 2. Si no está en diccionario local, buscar en la base de datos
      if (!isLoaded || !TranslationService.isInitialized) {
        console.log(`[v0] T() - Key "${key}" not found in localDict, isLoaded=${isLoaded}, returning key`)
        return defaultValue || key
      }

      // Obtener la traducción del servicio
      const translation = TranslationService.getTranslation(key, language, defaultValue || key)
      return translation
    },
    [language, isLoaded, localDictionary],
  )

  const changeLanguage = useCallback((newLanguage: string) => {
    console.log(`🌍 Cambiando idioma a: ${newLanguage}`)
    localStorage.setItem("userLanguage", newLanguage)
    setLanguage(newLanguage)
  }, [])

  const reloadTranslations = useCallback(async () => {
    console.log("🔄 Recargando traducciones...")
    setIsLoaded(false)
    setError(null)
    setRetryCount(0)

    try {
      await TranslationService.forceReload()

      // Verificar que la recarga fue exitosa
      if (TranslationService.isInitialized) {
        setError(null)
        setIsLoaded(true)
        console.log("✅ Traducciones recargadas correctamente")
      } else {
        const lastError = TranslationService.getLastError()
        const errorMsg = lastError ? lastError.message : "Error al recargar traducciones"
        setError(errorMsg)
        setIsLoaded(false)
        console.error("❌ Error al recargar traducciones:", errorMsg)
      }
    } catch (err) {
      console.error("💥 Error al recargar traducciones:", err)
      setError(err instanceof Error ? err.message : String(err))
      setIsLoaded(false)
    }
  }, [])

  return {
    t,
    language,
    changeLanguage,
    reloadTranslations,
    isLoaded,
    error,
  }
}

// Alias para compatibilidad con react-i18next
export const useTranslation = useTranslations
