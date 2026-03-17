"use client"

import { useTranslations } from "@/hooks/use-translations"
import { TranslationService } from "@/lib/services/translation-service"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"

export function UseTranslationsDebug() {
  const { t, language, isLoaded, error, reloadTranslations } = useTranslations()
  const [debugInfo, setDebugInfo] = useState<any>({})

  useEffect(() => {
    const updateDebugInfo = () => {
      setDebugInfo({
        hookIsLoaded: isLoaded,
        hookLanguage: language,
        hookError: error,
        serviceIsInitialized: TranslationService.isInitialized,
        serviceLanguages: TranslationService.getAvailableLanguages(),
        serviceStats: TranslationService.getInitStats(),
        serviceLastError: TranslationService.getLastError()?.message || null,
      })
    }

    updateDebugInfo()
    const interval = setInterval(updateDebugInfo, 1000)
    return () => clearInterval(interval)
  }, [isLoaded, language, error])

  const testKeys = [
    "dashboard.kpis.pipelineValue",
    "dashboard.kpis.totalOpportunities",
    "dashboard.kpis.conversionRate",
    "dashboard.pipeline.title",
    "dashboard.title",
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Debug del Hook useTranslations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Estado del Hook</h3>
              <div className="space-y-1 text-sm">
                <div>
                  isLoaded: <span className={isLoaded ? "text-green-600" : "text-red-600"}>{String(isLoaded)}</span>
                </div>
                <div>
                  language: <span className="font-mono">{language}</span>
                </div>
                <div>
                  error: <span className={error ? "text-red-600" : "text-green-600"}>{error || "null"}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Estado del TranslationService</h3>
              <div className="space-y-1 text-sm">
                <div>
                  isInitialized:{" "}
                  <span className={debugInfo.serviceIsInitialized ? "text-green-600" : "text-red-600"}>
                    {String(debugInfo.serviceIsInitialized)}
                  </span>
                </div>
                <div>
                  languages: <span className="font-mono">{debugInfo.serviceLanguages?.join(", ") || "none"}</span>
                </div>
                <div>
                  totalTranslations: <span className="font-mono">{debugInfo.serviceStats?.count || 0}</span>
                </div>
                <div>
                  lastError:{" "}
                  <span className={debugInfo.serviceLastError ? "text-red-600" : "text-green-600"}>
                    {debugInfo.serviceLastError || "null"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={reloadTranslations} variant="outline">
              Recargar Traducciones
            </Button>
            <Button onClick={() => TranslationService.debugTranslations()} variant="outline">
              Debug TranslationService
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Prueba de Traducciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {testKeys.map((key) => {
              const translation = t(key)
              const directTranslation = TranslationService.getTranslation(key, language)
              const hasTranslation = TranslationService.hasTranslation(key, language)

              return (
                <div key={key} className="border rounded p-3">
                  <div className="font-mono text-sm mb-2">{key}</div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <span className="font-semibold">Hook t(): </span>
                      <span className={translation === key ? "text-red-600" : "text-green-600"}>{translation}</span>
                    </div>
                    <div>
                      <span className="font-semibold">Service directo: </span>
                      <span className={directTranslation === key ? "text-red-600" : "text-green-600"}>
                        {directTranslation}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold">Existe: </span>
                      <span className={hasTranslation ? "text-green-600" : "text-red-600"}>
                        {String(hasTranslation)}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Información Detallada</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto">{JSON.stringify(debugInfo, null, 2)}</pre>
        </CardContent>
      </Card>
    </div>
  )
}
