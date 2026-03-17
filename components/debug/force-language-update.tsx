"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/components/auth/auth-provider"
import { useTranslations } from "@/hooks/use-translations"
import { useToast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function ForceLanguageUpdate() {
  const { user } = useAuth()
  const { changeLanguage, reloadTranslations } = useTranslations()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState("pt")

  const languages = [
    { code: "es", name: "Español" },
    { code: "en", name: "English" },
    { code: "pt", name: "Português" },
  ]

  const checkUserLanguage = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "No hay usuario autenticado",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      // Verificar en la tabla de usuarios
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("preferred_language")
        .eq("id", user.id)
        .single()

      if (userError) {
        throw new Error(`Error al consultar la base de datos: ${userError.message}`)
      }

      // Verificar en la metadata del usuario
      const { data: authData, error: authError } = await supabase.auth.getUser()

      if (authError) {
        throw new Error(`Error al obtener datos de autenticación: ${authError.message}`)
      }

      toast({
        title: "Información de idioma",
        description: (
          <div className="space-y-2">
            <p>
              <strong>En base de datos:</strong> {userData?.preferred_language || "No definido"}
            </p>
            <p>
              <strong>En metadata de Auth:</strong> {authData?.user?.user_metadata?.preferred_language || "No definido"}
            </p>
            <p>
              <strong>En localStorage:</strong> {localStorage.getItem("userLanguage") || "No definido"}
            </p>
          </div>
        ),
      })
    } catch (error) {
      console.error("Error al verificar idioma:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const forceUpdateLanguage = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "No hay usuario autenticado",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      // 1. Actualizar en Auth (metadatos)
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          preferred_language: selectedLanguage,
        },
      })

      if (authError) {
        throw new Error(`Error al actualizar Auth: ${authError.message}`)
      }

      // 2. Actualizar en la base de datos
      const { error: dbError } = await supabase
        .from("users")
        .update({ preferred_language: selectedLanguage })
        .eq("id", user.id)

      if (dbError) {
        throw new Error(`Error al actualizar base de datos: ${dbError.message}`)
      }

      // 3. Actualizar localStorage
      localStorage.setItem("userLanguage", selectedLanguage)

      // 4. Actualizar estado de la aplicación
      changeLanguage(selectedLanguage)
      await reloadTranslations()

      toast({
        title: "Idioma actualizado",
        description: `Se ha forzado el cambio de idioma a ${languages.find((l) => l.code === selectedLanguage)?.name}`,
      })

      // 5. Recargar la página para asegurar que todos los componentes se actualicen
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (error) {
      console.error("Error al forzar actualización de idioma:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const clearLocalStorage = () => {
    localStorage.removeItem("userLanguage")
    toast({
      title: "LocalStorage limpiado",
      description: "Se ha eliminado la preferencia de idioma del almacenamiento local",
    })
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Forzar Actualización de Idioma</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium mb-1 block">Seleccionar idioma</label>
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={forceUpdateLanguage} disabled={isLoading || !user}>
            {isLoading ? "Actualizando..." : "Forzar Cambio"}
          </Button>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={checkUserLanguage} disabled={isLoading || !user}>
            Verificar Configuración
          </Button>
          <Button variant="destructive" onClick={clearLocalStorage} disabled={isLoading}>
            Limpiar LocalStorage
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
