"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "@/hooks/use-translations"

export function UseTranslationsDebug() {
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const { t, language, isLoaded } = useTranslations(["opportunities.create_title", "opportunities.form.title"])

  useEffect(() => {
    console.log("useTranslations hook state:", {
      language,
      isLoaded,
      sampleTranslation: t("opportunities.create_title"),
    })

    setDebugInfo({
      language,
      isLoaded,
      sampleTranslation: t("opportunities.create_title"),
      timestamp: new Date().toISOString(),
    })
  }, [language, isLoaded, t])

  return (
    <div className="p-4 border rounded">
      <h3 className="font-bold mb-2">useTranslations Debug</h3>
      <pre className="text-xs bg-gray-100 p-2 rounded">{JSON.stringify(debugInfo, null, 2)}</pre>
    </div>
  )
}
