"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Globe, Loader2 } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"
import { supabase } from "@/lib/supabase/client"
import { useTranslations } from "@/hooks/use-translations"
import { useToast } from "@/components/ui/use-toast"

interface Language {
  code: string
  name: string
  flag: string
}

const languages: Language[] = [
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "pt", name: "Português", flag: "🇧🇷" },
]

export function LanguageSelector() {
  const { user } = useAuth()
  const { changeLanguage, language: currentLanguage, reloadTranslations } = useTranslations()
  const [isChanging, setIsChanging] = useState(false)
  const { toast } = useToast()

  // Encontrar el idioma actual en la lista
  const currentLang = languages.find((lang) => lang.code === currentLanguage) || languages[0]

  // Cambiar el idioma - enfoque mejorado
  const changeLanguageHandler = async (langCode: string) => {
    if (isChanging || currentLanguage === langCode) return

    setIsChanging(true)
    console.log(`Cambiando idioma a: ${langCode}`)

    try {
      // Primero actualizar el estado local para cambio inmediato
      changeLanguage(langCode)

      // Si hay un usuario autenticado, actualizar también en la base de datos
      if (user) {
        // Actualizar en Auth (metadatos)
        const { error: authError } = await supabase.auth.updateUser({
          data: {
            preferred_language: langCode,
          },
        })

        if (authError) {
          console.error("Error al actualizar idioma en Auth:", authError)
          toast({
            title: "Error",
            description: "No se pudo actualizar el idioma en el perfil",
            variant: "destructive",
          })
          return
        }

        // Actualizar en la base de datos
        const { error: dbError } = await supabase
          .from("users")
          .update({ preferred_language: langCode })
          .eq("id", user.id)

        if (dbError) {
          console.error("Error al actualizar idioma en la base de datos:", dbError)
          toast({
            title: "Advertencia",
            description: "El idioma se cambió pero no se pudo guardar en el perfil",
            variant: "default",
          })
        }
      }

      // Recargar traducciones para asegurar que tenemos las más recientes
      await reloadTranslations()

      toast({
        title: "Idioma cambiado",
        description: `El idioma se ha cambiado a ${languages.find((l) => l.code === langCode)?.name}`,
      })

      console.log("Idioma actualizado correctamente")
    } catch (error) {
      console.error("Error al cambiar el idioma:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al cambiar el idioma",
        variant: "destructive",
      })
    } finally {
      setIsChanging(false)
    }
  }

  // Efecto para sincronizar el idioma del usuario al cargar
  useEffect(() => {
    if (user?.user_metadata?.preferred_language && user.user_metadata.preferred_language !== currentLanguage) {
      changeLanguage(user.user_metadata.preferred_language)
    }
  }, [user, changeLanguage, currentLanguage])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" disabled={isChanging}>
          {isChanging ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Globe className="h-5 w-5" />
              <span className="absolute -bottom-1 -right-1 text-xs">{currentLang.flag}</span>
            </>
          )}
          <span className="sr-only">Cambiar idioma</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => changeLanguageHandler(lang.code)}
            className={currentLanguage === lang.code ? "bg-muted" : ""}
            disabled={isChanging}
          >
            <span className="mr-2">{lang.flag}</span>
            {lang.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
