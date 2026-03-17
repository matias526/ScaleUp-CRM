"use client"

import { useAuth } from "@/components/auth/auth-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { TranslationService } from "@/lib/services/translation-service"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

export function DebugLanguage() {
  const { user } = useAuth()
  const [dbLanguage, setDbLanguage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    const loadUserLanguage = async () => {
      if (!user) {
        setIsLoading(false)
        return
      }

      try {
        const { data, error } = await supabase.from("users").select("preferred_language").eq("id", user.id).single()

        if (error) {
          console.error("Error al cargar idioma de la base de datos:", error)
          setError(`Error al cargar idioma: ${error.message}`)
        } else {
          setDbLanguage(data.preferred_language)
        }
      } catch (error) {
        console.error("Error inesperado:", error)
        setError("Error inesperado al cargar el idioma del usuario")
      } finally {
        setIsLoading(false)
      }
    }

    loadUserLanguage()
  }, [user])

  const forceReloadTranslations = async () => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      await TranslationService.forceReload()

      // Verificar si hubo algún error durante la recarga
      const lastError = TranslationService.getLastError()
      if (lastError) {
        throw lastError
      }

      TranslationService.debugTranslations()
      setSuccess("Traducciones recargadas correctamente")
    } catch (error) {
      console.error("Error al recargar traducciones:", error)
      setError(error instanceof Error ? error.message : "Error al recargar traducciones")
    } finally {
      setIsLoading(false)
    }
  }

  const syncLanguageSettings = async () => {
    if (!user || !dbLanguage) return

    setIsSyncing(true)
    setError(null)
    setSuccess(null)

    try {
      // Actualizar metadatos con el valor de la base de datos
      const { error } = await supabase.auth.updateUser({
        data: {
          preferred_language: dbLanguage,
        },
      })

      if (error) {
        throw new Error(`Error al sincronizar: ${error.message}`)
      }

      setSuccess("Metadatos sincronizados correctamente con la base de datos")
    } catch (err: any) {
      setError(err.message || "Error al sincronizar metadatos")
    } finally {
      setIsSyncing(false)
    }
  }

  if (!user) {
    return <div>No hay usuario autenticado</div>
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Cargando información del usuario...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Información de idioma del usuario</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <p>
              <strong>ID de usuario:</strong> {user.id}
            </p>
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <p>
              <strong>Idioma en metadatos:</strong> {user.user_metadata?.preferred_language || "No definido"}
            </p>
            <p>
              <strong>Idioma en base de datos:</strong> {dbLanguage || "No definido"}
            </p>
          </div>

          <div className="pt-4 border-t flex flex-col sm:flex-row gap-4">
            <Button onClick={forceReloadTranslations} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Recargando...
                </>
              ) : (
                "Forzar recarga de traducciones"
              )}
            </Button>

            {user.user_metadata?.preferred_language !== dbLanguage && (
              <Button onClick={syncLanguageSettings} disabled={isSyncing} variant="secondary">
                {isSyncing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sincronizando...
                  </>
                ) : (
                  "Sincronizar metadatos con base de datos"
                )}
              </Button>
            )}

            <Button onClick={() => window.location.reload()} variant="outline">
              Refrescar página
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
