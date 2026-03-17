"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TranslationService } from "@/lib/services/translation-service"
import { RefreshCw, AlertCircle } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"
import { supabase } from "@/lib/supabase/client"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"

export function TranslationTest() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [userLanguage, setUserLanguage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [translations, setTranslations] = useState<Record<string, Record<string, string>>>({})
  const [isInitialized, setIsInitialized] = useState(false)

  // Claves de traducción que queremos probar
  const translationKeys = [
    "tech_companies.title",
    "tech_companies.new_company",
    "partners.title",
    "partners.new_partner",
    "common.loading",
    "test.hello",
    "test.welcome",
  ]

  // Cargar el idioma del usuario
  useEffect(() => {
    const loadUserLanguage = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase.from("users").select("preferred_language").eq("id", user.id).single()

        if (error) {
          console.error("Error al cargar idioma:", error)
          setError(`Error al cargar idioma: ${error.message}`)
          return
        }

        setUserLanguage(data.preferred_language)
      } catch (error) {
        console.error("Error inesperado:", error)
        setError("Error inesperado al cargar el idioma del usuario")
      }
    }

    loadUserLanguage()
  }, [user])

  // Cargar traducciones al iniciar
  useEffect(() => {
    const loadInitialTranslations = async () => {
      setIsLoading(true)
      try {
        await TranslationService.initialize()
        setIsInitialized(TranslationService.isInitialized)

        // Verificar si hubo algún error durante la inicialización
        const lastError = TranslationService.getLastError()
        if (lastError) {
          setError(lastError.message)
        } else {
          setError(null)
        }

        // Cargar traducciones para mostrar
        updateTranslationsDisplay()
      } catch (error) {
        console.error("Error al inicializar traducciones:", error)
        setError(error instanceof Error ? error.message : "Error al inicializar traducciones")
      } finally {
        setIsLoading(false)
      }
    }

    loadInitialTranslations()
  }, [])

  // Función para actualizar las traducciones mostradas
  const updateTranslationsDisplay = () => {
    const translationsDisplay: Record<string, Record<string, string>> = {}

    translationKeys.forEach((key) => {
      translationsDisplay[key] = {
        es: TranslationService.getTranslation(key, "es", "No disponible"),
        en: TranslationService.getTranslation(key, "en", "Not available"),
      }
    })

    setTranslations(translationsDisplay)
  }

  // Función para recargar las traducciones
  const reloadTranslations = async () => {
    setIsLoading(true)
    setError(null)

    try {
      await TranslationService.forceReload()

      // Verificar si hubo algún error durante la recarga
      const lastError = TranslationService.getLastError()
      if (lastError) {
        throw lastError
      }

      setIsInitialized(TranslationService.isInitialized)
      TranslationService.debugTranslations()
      updateTranslationsDisplay()
    } catch (error) {
      console.error("Error al recargar traducciones:", error)
      setError(error instanceof Error ? error.message : "Error al recargar traducciones")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Prueba de Traducciones</CardTitle>
        <CardDescription>
          Verifica que el sistema de traducciones esté funcionando correctamente. Tu idioma actual es:{" "}
          <strong>{userLanguage || "No definido"}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={reloadTranslations} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Recargar traducciones
          </Button>
          <div className="text-sm">Estado: {isInitialized ? "Inicializado" : "No inicializado"}</div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4 border rounded-md p-4">
            <div className="font-medium">Clave</div>
            <div className="font-medium">Español</div>
            <div className="font-medium">English</div>

            {isLoading
              ? // Mostrar esqueletos durante la carga
                Array(translationKeys.length)
                  .fill(0)
                  .map((_, index) => (
                    <div key={index} className="contents">
                      <Skeleton className="h-6 w-full" />
                      <Skeleton className="h-6 w-full" />
                      <Skeleton className="h-6 w-full" />
                    </div>
                  ))
              : // Mostrar traducciones
                translationKeys.map((key) => (
                  <div key={key} className="contents">
                    <div className="text-sm text-muted-foreground">{key}</div>
                    <div>{translations[key]?.es || "No disponible"}</div>
                    <div>{translations[key]?.en || "Not available"}</div>
                  </div>
                ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
