"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "@/hooks/use-translations"
import { useAuth } from "@/components/auth/auth-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TranslationService } from "@/lib/services/translation-service"

export function LanguageDebug() {
  const { language, changeLanguage, isLoaded, error } = useTranslations()
  const { user } = useAuth()
  const [localStorageLanguage, setLocalStorageLanguage] = useState<string | null>(null)
  const [userMetadataLanguage, setUserMetadataLanguage] = useState<string | null>(null)
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([])
  const [translationCount, setTranslationCount] = useState<Record<string, number>>({})

  useEffect(() => {
    // Obtener idioma de localStorage
    const storedLang = localStorage.getItem("userLanguage")
    setLocalStorageLanguage(storedLang)

    // Obtener idioma de metadata del usuario
    const userLang = user?.user_metadata?.preferred_language || null
    setUserMetadataLanguage(userLang)

    // Obtener idiomas disponibles
    if (TranslationService.isInitialized) {
      const langs = TranslationService.getAvailableLanguages()
      setAvailableLanguages(langs)

      // Contar traducciones por idioma
      const counts: Record<string, number> = {}
      langs.forEach((lang) => {
        const translations = TranslationService.getAllTranslationsForLanguage(lang)
        counts[lang] = Object.keys(translations).length
      })
      setTranslationCount(counts)
    }
  }, [user, language])

  const syncLanguages = () => {
    if (user && userMetadataLanguage) {
      localStorage.setItem("userLanguage", userMetadataLanguage)
      changeLanguage(userMetadataLanguage)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Depuración de Idioma</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium mb-2">Estado Actual</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <span className="font-semibold">Idioma activo:</span> {language}
              </li>
              <li>
                <span className="font-semibold">Traducciones cargadas:</span> {isLoaded ? "Sí" : "No"}
              </li>
              <li>
                <span className="font-semibold">Error:</span> {error || "Ninguno"}
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium mb-2">Fuentes de Idioma</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <span className="font-semibold">localStorage:</span> {localStorageLanguage || "No definido"}
              </li>
              <li>
                <span className="font-semibold">Metadata de usuario:</span> {userMetadataLanguage || "No definido"}
              </li>
              <li>
                <span className="font-semibold">Por defecto:</span> es
              </li>
            </ul>
          </div>
        </div>

        <div>
          <h3 className="font-medium mb-2">Idiomas Disponibles</h3>
          <div className="grid grid-cols-3 gap-2">
            {availableLanguages.map((lang) => (
              <div key={lang} className="text-sm p-2 border rounded">
                <div className="font-semibold">{lang}</div>
                <div>{translationCount[lang] || 0} traducciones</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={syncLanguages} disabled={!user || !userMetadataLanguage}>
            Sincronizar con Perfil
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
