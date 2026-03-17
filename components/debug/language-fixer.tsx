"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslations } from "@/hooks/use-translations"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/components/auth/auth-provider"
import { useState } from "react"
import { TranslationService } from "@/lib/services/translation-service"

export function LanguageFixer() {
  const { language, changeLanguage, reloadTranslations } = useTranslations()
  const { user } = useAuth()
  const [status, setStatus] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const fixLanguage = async () => {
    setIsLoading(true)
    setStatus("Verificando idioma...")

    try {
      if (!user) {
        setStatus("No hay usuario autenticado")
        return
      }

      // Verificar si el usuario tiene un idioma configurado
      const { data, error } = await supabase.from("users").select("preferred_language").eq("id", user.id).single()

      if (error) {
        setStatus(`Error al obtener preferencia de idioma: ${error.message}`)
        return
      }

      // Si el idioma es inglés, cambiarlo a español
      if (data?.preferred_language === "en") {
        const { error: updateError } = await supabase
          .from("users")
          .update({ preferred_language: "es" })
          .eq("id", user.id)

        if (updateError) {
          setStatus(`Error al actualizar idioma: ${updateError.message}`)
          return
        }

        // Cambiar el idioma en el cliente
        changeLanguage("es")
        localStorage.setItem("userLanguage", "es")
        setStatus("Idioma cambiado de inglés a español")
      } else {
        setStatus(`El idioma actual es: ${data?.preferred_language || "no configurado"}`)
      }
    } catch (error) {
      setStatus(`Error inesperado: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsLoading(false)
    }
  }

  const reloadAllTranslations = async () => {
    setIsLoading(true)
    setStatus("Recargando traducciones...")

    try {
      await TranslationService.forceReload()
      await reloadTranslations()
      setStatus("Traducciones recargadas correctamente")
    } catch (error) {
      setStatus(`Error al recargar traducciones: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Corrector de Idioma</CardTitle>
        <CardDescription>Verifica y corrige el idioma del usuario actual</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p>
              Idioma actual: <strong>{language}</strong>
            </p>
            <p>
              Usuario: <strong>{user?.email || "No autenticado"}</strong>
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Button onClick={fixLanguage} disabled={isLoading}>
              {isLoading ? "Procesando..." : "Verificar y Corregir Idioma"}
            </Button>
            <Button onClick={reloadAllTranslations} disabled={isLoading} variant="outline">
              {isLoading ? "Procesando..." : "Recargar Traducciones"}
            </Button>
          </div>

          {status && (
            <div className="mt-4 p-3 bg-gray-100 rounded-md">
              <p className="text-sm">{status}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
