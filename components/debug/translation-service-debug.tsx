"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "@/hooks/use-translations"
import { TranslationService } from "@/lib/services/translation-service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function TranslationServiceDebug() {
  const { t, language, isLoaded } = useTranslations()
  const [customKey, setCustomKey] = useState("opportunities.table_view")
  const [customDefault, setCustomDefault] = useState("Vista de tabla")
  const [result, setResult] = useState("")
  const [debugInfo, setDebugInfo] = useState<any>(null)

  // Verificar el estado del servicio de traducciones
  useEffect(() => {
    console.log("TranslationServiceDebug - Estado:", {
      isLoaded,
      language,
      serviceInitialized: TranslationService.isInitialized,
    })
  }, [isLoaded, language])

  // Función para probar una traducción específica
  const handleTestTranslation = () => {
    try {
      // Probar con el hook
      const hookResult = t(customKey, customDefault)

      // Probar directamente con el servicio
      const serviceResult = TranslationService.getTranslation(customKey, language, customDefault)

      setResult(`
Hook result: "${hookResult}"
Service result: "${serviceResult}"
      `)
    } catch (error) {
      setResult(`Error: ${error.message}`)
    }
  }

  // Función para obtener información de depuración
  const handleGetDebugInfo = () => {
    try {
      const info = {
        isInitialized: TranslationService.isInitialized,
        currentLanguage: language,
        isLoaded,
        availableLanguages: TranslationService.getAvailableLanguages(),
        serviceInfo: TranslationService.getDebugInfo(),
      }
      setDebugInfo(info)
    } catch (error) {
      console.error("Error al obtener información de depuración:", error)
      setDebugInfo({ error: error.message })
    }
  }

  // Función para recargar traducciones
  const handleReloadTranslations = async () => {
    try {
      await TranslationService.loadTranslations(language)
      alert(`Traducciones recargadas para idioma: ${language}`)
      handleGetDebugInfo()
    } catch (error) {
      console.error("Error al recargar traducciones:", error)
      alert(`Error al recargar traducciones: ${error.message}`)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Depuración del Servicio de Traducciones</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium mb-2">Estado del servicio:</h3>
            <ul className="text-sm space-y-1">
              <li>
                <strong>Idioma actual:</strong> {language}
              </li>
              <li>
                <strong>Traducciones cargadas:</strong> {isLoaded ? "Sí" : "No"}
              </li>
              <li>
                <strong>Servicio inicializado:</strong> {TranslationService.isInitialized ? "Sí" : "No"}
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium mb-2">Traducciones clave:</h3>
            <ul className="text-sm space-y-1">
              <li>
                <strong>opportunities.table_view:</strong> "{t("opportunities.table_view", "[No traducción]")}"
              </li>
              <li>
                <strong>opportunities.kanban_view:</strong> "{t("opportunities.kanban_view", "[No traducción]")}"
              </li>
              <li>
                <strong>common.save:</strong> "{t("common.save", "[No traducción]")}"
              </li>
              <li>
                <strong>common.cancel:</strong> "{t("common.cancel", "[No traducción]")}"
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="font-medium mb-2">Probar traducción específica:</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="custom-key">Clave de traducción:</Label>
              <Input
                id="custom-key"
                value={customKey}
                onChange={(e) => setCustomKey(e.target.value)}
                className="mb-2"
              />
            </div>
            <div>
              <Label htmlFor="custom-default">Valor por defecto:</Label>
              <Input id="custom-default" value={customDefault} onChange={(e) => setCustomDefault(e.target.value)} />
            </div>
          </div>
          <Button onClick={handleTestTranslation} className="mt-2">
            Probar traducción
          </Button>

          {result && <pre className="mt-2 p-2 bg-gray-100 rounded text-xs whitespace-pre-wrap">{result}</pre>}
        </div>

        <div className="border-t pt-4 flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleGetDebugInfo}>
            Obtener información de depuración
          </Button>
          <Button variant="outline" onClick={handleReloadTranslations}>
            Recargar traducciones
          </Button>
        </div>

        {debugInfo && (
          <div className="border-t pt-4">
            <h3 className="font-medium mb-2">Información de depuración:</h3>
            <div className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-60">
              <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
