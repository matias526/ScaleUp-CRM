"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TranslationService } from "@/lib/services/translation-service"
import { supabase } from "@/lib/supabase/client"

export function AddMissingTranslations() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    details?: any
  } | null>(null)

  const missingTranslations = [
    { key: "opportunities.table_view", language: "en", value: "Table View" },
    { key: "opportunities.kanban_view", language: "en", value: "Kanban View" },
    { key: "opportunities.table_view", language: "pt", value: "Visualização em Tabela" },
    { key: "opportunities.kanban_view", language: "pt", value: "Visualização Kanban" },
    { key: "opportunities.title", language: "pt", value: "Oportunidades" },
    { key: "opportunities.create", language: "pt", value: "Criar Oportunidade" },
  ]

  const handleAddTranslations = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      // Añadir cada traducción a la base de datos
      const results = []
      for (const translation of missingTranslations) {
        const { error } = await supabase.from("translations").upsert({
          key: translation.key,
          language: translation.language,
          value: translation.value,
          created_at: new Date(),
          updated_at: new Date(),
        })

        results.push({
          translation,
          success: !error,
          error: error ? error.message : null,
        })

        if (error) {
          console.error(`Error al añadir traducción ${translation.key} (${translation.language}):`, error)
        }
      }

      // Recargar las traducciones en el servicio
      await TranslationService.forceReload()

      setResult({
        success: results.every((r) => r.success),
        message: results.every((r) => r.success)
          ? "Todas las traducciones se añadieron correctamente"
          : "Algunas traducciones no se pudieron añadir",
        details: results,
      })
    } catch (error) {
      console.error("Error al añadir traducciones:", error)
      setResult({
        success: false,
        message: `Error al añadir traducciones: ${error instanceof Error ? error.message : String(error)}`,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Añadir Traducciones Faltantes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p>Se añadirán las siguientes traducciones faltantes:</p>
          <ul className="list-disc pl-5 space-y-1">
            {missingTranslations.map((t) => (
              <li key={`${t.key}-${t.language}`}>
                <code>{t.key}</code> ({t.language}): "{t.value}"
              </li>
            ))}
          </ul>

          <Button onClick={handleAddTranslations} disabled={isLoading}>
            {isLoading ? "Añadiendo..." : "Añadir Traducciones Faltantes"}
          </Button>

          {result && (
            <div className={`mt-4 p-4 rounded-md ${result.success ? "bg-green-50" : "bg-red-50"}`}>
              <p className={result.success ? "text-green-700" : "text-red-700"}>{result.message}</p>
              {result.details && (
                <details className="mt-2">
                  <summary className="cursor-pointer">Ver detalles</summary>
                  <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
