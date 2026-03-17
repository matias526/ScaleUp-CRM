"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TranslationService } from "@/lib/services/translation-service"
import { useTranslations } from "@/hooks/use-translations"

export default function TranslationReload() {
  const [isReloading, setIsReloading] = useState(false)
  const [message, setMessage] = useState("")
  const { reloadTranslations, language } = useTranslations()

  const handleReload = async () => {
    setIsReloading(true)
    setMessage("Recargando traducciones...")

    try {
      await TranslationService.forceReload()
      setMessage("Traducciones recargadas correctamente. Refresca la página.")
    } catch (error) {
      setMessage(`Error al recargar traducciones: ${error}`)
    } finally {
      setIsReloading(false)
    }
  }

  const handleDebug = () => {
    TranslationService.debugTranslations()
    setMessage("Información de depuración enviada a la consola")
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Depuración de Traducciones</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm">
          <p>
            Idioma actual: <strong>{language}</strong>
          </p>
          <p>
            Estado de inicialización:{" "}
            <strong>{TranslationService.isInitialized ? "Inicializado" : "No inicializado"}</strong>
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Button onClick={handleReload} disabled={isReloading}>
            {isReloading ? "Recargando..." : "Recargar Traducciones"}
          </Button>

          <Button variant="outline" onClick={handleDebug}>
            Depurar en Consola
          </Button>
        </div>

        {message && <div className="mt-4 p-2 bg-gray-100 rounded text-sm">{message}</div>}
      </CardContent>
    </Card>
  )
}
