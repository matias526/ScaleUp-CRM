"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TranslationService } from "@/lib/services/translation-service"
import { supabase } from "@/lib/supabase/client"
import { useTranslations } from "@/hooks/use-translations"

// Traducciones que queremos asegurarnos que existan
const requiredTranslations = [
  {
    key: "opportunities.table_view",
    en: "Table View",
    es: "Vista de Tabla",
    pt: "Visualização em Tabela",
  },
  {
    key: "opportunities.kanban_view",
    en: "Kanban View",
    es: "Vista Kanban",
    pt: "Visualização Kanban",
  },
  {
    key: "opportunities.title",
    en: "Opportunities",
    es: "Oportunidades",
    pt: "Oportunidades",
  },
  {
    key: "opportunities.create",
    en: "Create Opportunity",
    es: "Crear Oportunidad",
    pt: "Criar Oportunidade",
  },
]

export function ForceTranslationUpdate() {
  const [status, setStatus] = useState<string>("idle")
  const [dbResults, setDbResults] = useState<any[]>([])
  const [memoryResults, setMemoryResults] = useState<any[]>([])
  const { reloadTranslations } = useTranslations()

  // Verificar traducciones en la base de datos
  const checkDbTranslations = async () => {
    setStatus("checking-db")
    try {
      const results = []

      for (const translation of requiredTranslations) {
        const { data: enData, error: enError } = await supabase
          .from("translations")
          .select("*")
          .eq("key", translation.key)
          .eq("language", "en")
          .single()

        const { data: esData, error: esError } = await supabase
          .from("translations")
          .select("*")
          .eq("key", translation.key)
          .eq("language", "es")
          .single()

        const { data: ptData, error: ptError } = await supabase
          .from("translations")
          .select("*")
          .eq("key", translation.key)
          .eq("language", "pt")
          .single()

        results.push({
          key: translation.key,
          en: enData ? enData.value : null,
          es: esData ? esData.value : null,
          pt: ptData ? ptData.value : null,
          enExists: !!enData,
          esExists: !!esData,
          ptExists: !!ptData,
        })
      }

      setDbResults(results)
      setStatus("db-checked")
    } catch (error) {
      console.error("Error checking DB translations:", error)
      setStatus("error")
    }
  }

  // Verificar traducciones en memoria
  const checkMemoryTranslations = () => {
    setStatus("checking-memory")
    try {
      const results = []

      for (const translation of requiredTranslations) {
        results.push({
          key: translation.key,
          en: TranslationService.getTranslation(translation.key, "en", ""),
          es: TranslationService.getTranslation(translation.key, "es", ""),
          pt: TranslationService.getTranslation(translation.key, "pt", ""),
          enExists: TranslationService.hasTranslation(translation.key, "en"),
          esExists: TranslationService.hasTranslation(translation.key, "es"),
          ptExists: TranslationService.hasTranslation(translation.key, "pt"),
        })
      }

      setMemoryResults(results)
      setStatus("memory-checked")
    } catch (error) {
      console.error("Error checking memory translations:", error)
      setStatus("error")
    }
  }

  // Añadir traducciones a la base de datos
  const addTranslationsToDb = async () => {
    setStatus("adding-to-db")
    try {
      const promises = []

      for (const translation of requiredTranslations) {
        // Añadir traducción en inglés
        promises.push(
          supabase.from("translations").upsert({ key: translation.key, language: "en", value: translation.en }),
        )

        // Añadir traducción en español
        promises.push(
          supabase.from("translations").upsert({ key: translation.key, language: "es", value: translation.es }),
        )

        // Añadir traducción en portugués
        promises.push(
          supabase.from("translations").upsert({ key: translation.key, language: "pt", value: translation.pt }),
        )
      }

      await Promise.all(promises)
      setStatus("added-to-db")
      checkDbTranslations()
    } catch (error) {
      console.error("Error adding translations to DB:", error)
      setStatus("error")
    }
  }

  // Añadir traducciones directamente a la memoria
  const addTranslationsToMemory = async () => {
    setStatus("adding-to-memory")
    try {
      for (const translation of requiredTranslations) {
        // Añadir traducción en inglés
        await TranslationService.addTranslation(translation.key, "en", translation.en)

        // Añadir traducción en español
        await TranslationService.addTranslation(translation.key, "es", translation.es)

        // Añadir traducción en portugués
        await TranslationService.addTranslation(translation.key, "pt", translation.pt)
      }

      setStatus("added-to-memory")
      checkMemoryTranslations()
    } catch (error) {
      console.error("Error adding translations to memory:", error)
      setStatus("error")
    }
  }

  // Forzar una recarga completa del servicio de traducciones
  const forceReload = async () => {
    setStatus("reloading")
    try {
      await TranslationService.forceReload()
      await reloadTranslations()
      setStatus("reloaded")
      checkMemoryTranslations()
    } catch (error) {
      console.error("Error reloading translations:", error)
      setStatus("error")
    }
  }

  // Solución completa: añadir a DB, añadir a memoria y recargar
  const fixEverything = async () => {
    setStatus("fixing")
    try {
      // 1. Añadir a la base de datos
      await addTranslationsToDb()

      // 2. Forzar recarga
      await forceReload()

      // 3. Añadir directamente a la memoria por si acaso
      await addTranslationsToMemory()

      // 4. Verificar resultados
      checkDbTranslations()
      checkMemoryTranslations()

      setStatus("fixed")
    } catch (error) {
      console.error("Error fixing translations:", error)
      setStatus("error")
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Forzar Actualización de Traducciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button onClick={checkDbTranslations} variant="outline">
                Verificar en DB
              </Button>
              <Button onClick={checkMemoryTranslations} variant="outline">
                Verificar en Memoria
              </Button>
              <Button onClick={addTranslationsToDb} variant="outline">
                Añadir a DB
              </Button>
              <Button onClick={addTranslationsToMemory} variant="outline">
                Añadir a Memoria
              </Button>
              <Button onClick={forceReload} variant="outline">
                Forzar Recarga
              </Button>
              <Button onClick={fixEverything} variant="default">
                Solución Completa
              </Button>
            </div>

            <div className="bg-gray-100 p-2 rounded">
              <p>Estado: {status}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {dbResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Traducciones en Base de Datos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="p-2 text-left">Clave</th>
                    <th className="p-2 text-left">EN</th>
                    <th className="p-2 text-left">ES</th>
                    <th className="p-2 text-left">PT</th>
                  </tr>
                </thead>
                <tbody>
                  {dbResults.map((result) => (
                    <tr key={result.key} className="border-b">
                      <td className="p-2">{result.key}</td>
                      <td className="p-2">
                        {result.enExists ? (
                          <span className="text-green-500">{result.en}</span>
                        ) : (
                          <span className="text-red-500">No existe</span>
                        )}
                      </td>
                      <td className="p-2">
                        {result.esExists ? (
                          <span className="text-green-500">{result.es}</span>
                        ) : (
                          <span className="text-red-500">No existe</span>
                        )}
                      </td>
                      <td className="p-2">
                        {result.ptExists ? (
                          <span className="text-green-500">{result.pt}</span>
                        ) : (
                          <span className="text-red-500">No existe</span>
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

      {memoryResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Traducciones en Memoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="p-2 text-left">Clave</th>
                    <th className="p-2 text-left">EN</th>
                    <th className="p-2 text-left">ES</th>
                    <th className="p-2 text-left">PT</th>
                  </tr>
                </thead>
                <tbody>
                  {memoryResults.map((result) => (
                    <tr key={result.key} className="border-b">
                      <td className="p-2">{result.key}</td>
                      <td className="p-2">
                        {result.enExists ? (
                          <span className="text-green-500">"{result.en}"</span>
                        ) : (
                          <span className="text-red-500">No existe</span>
                        )}
                      </td>
                      <td className="p-2">
                        {result.esExists ? (
                          <span className="text-green-500">"{result.es}"</span>
                        ) : (
                          <span className="text-red-500">No existe</span>
                        )}
                      </td>
                      <td className="p-2">
                        {result.ptExists ? (
                          <span className="text-green-500">"{result.pt}"</span>
                        ) : (
                          <span className="text-red-500">No existe</span>
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
