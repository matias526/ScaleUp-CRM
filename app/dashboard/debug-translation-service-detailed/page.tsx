"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TranslationService } from "@/lib/services/translation-service"
import { useTranslations } from "@/hooks/use-translations"

export default function TranslationServiceDetailedDebugPage() {
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [testResults, setTestResults] = useState<any>(null)
  const { t, language, isLoaded } = useTranslations()

  const runDebug = async () => {
    // Activar modo debug
    TranslationService.setDebugMode(true)

    // Obtener información del servicio
    const info = {
      isInitialized: TranslationService.isInitialized,
      availableLanguages: TranslationService.getAvailableLanguages(),
      initStats: TranslationService.getInitStats(),
      lastError: TranslationService.getLastError()?.message || null,
    }

    // Probar traducciones específicas
    const testKeys = [
      "dashboard.kpis.pipelineValue",
      "dashboard.kpis.totalOpportunities",
      "dashboard.kpis.conversionRate",
      "dashboard.pipeline.title",
    ]

    const tests = {}
    testKeys.forEach((key) => {
      tests[key] = {
        pt: TranslationService.getTranslation(key, "pt"),
        es: TranslationService.getTranslation(key, "es"),
        en: TranslationService.getTranslation(key, "en"),
        hasInPt: TranslationService.hasTranslation(key, "pt"),
        hasInEs: TranslationService.hasTranslation(key, "es"),
      }
    })

    // Obtener todas las traducciones para portugués
    const allPtTranslations = TranslationService.getAllTranslationsForLanguage("pt")
    const ptDashboardKeys = Object.keys(allPtTranslations).filter((key) => key.startsWith("dashboard."))

    setDebugInfo(info)
    setTestResults({
      tests,
      allPtTranslations: Object.keys(allPtTranslations).length,
      ptDashboardKeys: ptDashboardKeys.length,
      samplePtDashboard: ptDashboardKeys.slice(0, 10).map((key) => ({
        key,
        value: allPtTranslations[key],
      })),
    })

    // Debug completo
    TranslationService.debugTranslations()
  }

  const forceReload = async () => {
    await TranslationService.forceReload()
    runDebug()
  }

  useEffect(() => {
    if (isLoaded) {
      runDebug()
    }
  }, [isLoaded])

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Debug TranslationService Detallado</h1>
        <div className="space-x-2">
          <Button onClick={runDebug}>Actualizar Debug</Button>
          <Button onClick={forceReload} variant="outline">
            Forzar Recarga
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Información del Hook */}
        <Card>
          <CardHeader>
            <CardTitle>Estado del Hook useTranslations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p>
                <strong>Idioma actual:</strong> {language}
              </p>
              <p>
                <strong>Está cargado:</strong> {isLoaded ? "Sí" : "No"}
              </p>
              <p>
                <strong>Prueba t():</strong> {t("dashboard.kpis.pipelineValue")}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Información del Servicio */}
        {debugInfo && (
          <Card>
            <CardHeader>
              <CardTitle>Estado del TranslationService</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p>
                  <strong>Inicializado:</strong> {debugInfo.isInitialized ? "Sí" : "No"}
                </p>
                <p>
                  <strong>Idiomas disponibles:</strong> {debugInfo.availableLanguages.join(", ")}
                </p>
                <p>
                  <strong>Total traducciones:</strong> {debugInfo.initStats.count}
                </p>
                <p>
                  <strong>Intentos de inicialización:</strong> {debugInfo.initStats.attempts}
                </p>
                <p>
                  <strong>Último error:</strong> {debugInfo.lastError || "Ninguno"}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resultados de Pruebas */}
        {testResults && (
          <Card>
            <CardHeader>
              <CardTitle>Pruebas de Traducciones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p>
                    <strong>Total traducciones en PT:</strong> {testResults.allPtTranslations}
                  </p>
                  <p>
                    <strong>Claves de dashboard en PT:</strong> {testResults.ptDashboardKeys}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold">Muestra de traducciones PT dashboard:</h4>
                  <div className="bg-gray-100 p-3 rounded text-sm">
                    {testResults.samplePtDashboard.map((item, i) => (
                      <div key={i}>
                        {item.key}: {item.value}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold">Pruebas específicas:</h4>
                  <div className="space-y-2">
                    {Object.entries(testResults.tests).map(([key, results]: [string, any]) => (
                      <div key={key} className="border p-3 rounded">
                        <p className="font-medium">{key}</p>
                        <p>
                          PT: {results.pt} (existe: {results.hasInPt ? "Sí" : "No"})
                        </p>
                        <p>
                          ES: {results.es} (existe: {results.hasInEs ? "Sí" : "No"})
                        </p>
                        <p>EN: {results.en}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
