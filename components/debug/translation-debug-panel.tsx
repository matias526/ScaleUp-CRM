"use client"

import { useTranslations } from "@/hooks/use-translations"
import { TranslationService } from "@/lib/services/translation-service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function TranslationDebugPanel() {
  const { isLoaded, language, error, reloadTranslations } = useTranslations()

  const footerKeys = ["footer.rights", "footer.privacy", "footer.terms", "footer.help"]

  const handleReloadTranslations = () => {
    reloadTranslations()
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Estado de Traducciones</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="font-medium">Cargado:</div>
            <div>{isLoaded ? "Sí" : "No"}</div>

            <div className="font-medium">Idioma:</div>
            <div>{language}</div>

            <div className="font-medium">Error:</div>
            <div>{error || "Ninguno"}</div>

            <div className="font-medium">Inicializado:</div>
            <div>{TranslationService.isInitialized ? "Sí" : "No"}</div>

            <div className="font-medium">Idiomas disponibles:</div>
            <div>{TranslationService.getAvailableLanguages().join(", ") || "Ninguno"}</div>
          </div>

          <div>
            <h3 className="font-medium mb-2">Traducciones del footer:</h3>
            <ul className="space-y-1 pl-4">
              {footerKeys.map((key) => (
                <li key={key}>
                  <span className="font-mono text-sm">{key}:</span>{" "}
                  <span className="text-primary">
                    {TranslationService.getTranslation(key, language) || "No encontrada"}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <Button onClick={handleReloadTranslations}>Recargar Traducciones</Button>
        </div>
      </CardContent>
    </Card>
  )
}
