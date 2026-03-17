"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TranslationService } from "@/lib/services/translation-service"
import { useTranslations } from "@/hooks/use-translations"

// Traducciones críticas que queremos asegurar
const criticalTranslations = {
  en: {
    "opportunities.table_view": "Table View",
    "opportunities.kanban_view": "Kanban View",
    "opportunities.title": "Opportunities",
    "opportunities.create": "Create Opportunity",
  },
  es: {
    "opportunities.table_view": "Vista de Tabla",
    "opportunities.kanban_view": "Vista Kanban",
    "opportunities.title": "Oportunidades",
    "opportunities.create": "Crear Oportunidad",
  },
  pt: {
    "opportunities.table_view": "Visualização em Tabela",
    "opportunities.kanban_view": "Visualização Kanban",
    "opportunities.title": "Oportunidades",
    "opportunities.create": "Criar Oportunidade",
  },
}

export function ApplyTranslationServiceFix() {
  const [status, setStatus] = useState<string>("idle")
  const [results, setResults] = useState<any[]>([])
  const { reloadTranslations } = useTranslations()

  // Aplicar la solución manual
  const applyManualFix = async () => {
    setStatus("applying")
    try {
      // 1. Añadir traducciones directamente a la memoria del servicio
      Object.entries(criticalTranslations).forEach(([lang, translations]) => {
        // Asegurarse de que el idioma exista
        if (!TranslationService["translations"][lang]) {
          TranslationService["translations"][lang] = {}
        }

        // Añadir cada traducción
        Object.entries(translations).forEach(([key, value]) => {
          TranslationService["translations"][lang][key] = value
        })
      })

      // 2. Verificar que las traducciones se hayan añadido correctamente
      const verificationResults = []
      for (const [lang, translations] of Object.entries(criticalTranslations)) {
        for (const [key, expectedValue] of Object.entries(translations)) {
          const actualValue = TranslationService.getTranslation(key, lang)
          verificationResults.push({
            key,
            language: lang,
            expected: expectedValue,
            actual: actualValue,
            success: actualValue === expectedValue,
          })
        }
      }

      setResults(verificationResults)
      setStatus("applied")

      // 3. Recargar traducciones en el hook
      await reloadTranslations()
    } catch (error) {
      console.error("Error applying manual fix:", error)
      setStatus("error")
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Aplicar Solución Manual</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p>
              Esta herramienta añade directamente las traducciones críticas a la memoria del servicio de traducciones,
              sin depender de la carga desde la base de datos.
            </p>
            <Button onClick={applyManualFix} disabled={status === "applying"}>
              {status === "applying" ? "Aplicando..." : "Aplicar Solución Manual"}
            </Button>
            <div className="bg-gray-100 p-2 rounded">
              <p>Estado: {status}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados de la Verificación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="p-2 text-left">Clave</th>
                    <th className="p-2 text-left">Idioma</th>
                    <th className="p-2 text-left">Valor Esperado</th>
                    <th className="p-2 text-left">Valor Actual</th>
                    <th className="p-2 text-left">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2">{result.key}</td>
                      <td className="p-2">{result.language}</td>
                      <td className="p-2">"{result.expected}"</td>
                      <td className="p-2">"{result.actual}"</td>
                      <td className="p-2">
                        {result.success ? (
                          <span className="text-green-500">✓ Correcto</span>
                        ) : (
                          <span className="text-red-500">✗ Incorrecto</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
