"use client"

import { useTranslations } from "@/hooks/use-translations"
import { TranslationService } from "@/lib/services/translation-service"

export function TranslationContextDebug() {
  const { t, language, isLoaded, error } = useTranslations()

  // Test translations
  const testKeys = [
    "dashboard.kpis.pipelineValue",
    "opportunities.create.title",
    "opportunities.create.partner",
    "opportunities.create.techCompany",
  ]

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Translation Context Debug</h2>

      <div className="space-y-4">
        <div>
          <h3 className="font-semibold">Language:</h3>
          <p>{language}</p>
        </div>

        <div>
          <h3 className="font-semibold">IsLoaded:</h3>
          <p>{isLoaded ? "true" : "false"}</p>
        </div>

        <div>
          <h3 className="font-semibold">Error:</h3>
          <p>{error || "null"}</p>
        </div>

        <div>
          <h3 className="font-semibold">TranslationService Status:</h3>
          <pre className="bg-gray-100 p-2 rounded text-sm">
            {JSON.stringify(
              {
                isInitialized: TranslationService.isInitialized,
                availableLanguages: TranslationService.getAvailableLanguages(),
                stats: TranslationService.getInitStats(),
                lastError: TranslationService.getLastError(),
              },
              null,
              2,
            )}
          </pre>
        </div>

        <div>
          <h3 className="font-semibold">Test Translations:</h3>
          <div className="space-y-2">
            {testKeys.map((key) => (
              <div key={key} className="bg-gray-50 p-2 rounded">
                <strong>{key}:</strong> {t(key, "fallback")}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
