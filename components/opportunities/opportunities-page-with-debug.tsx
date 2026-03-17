"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "@/hooks/use-translations"
import { TranslationService } from "@/lib/services/translation-service"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { OpportunitiesTable } from "@/components/opportunities/opportunities-table"
import { OpportunitiesKanban } from "@/components/opportunities/opportunities-kanban"
//import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { supabase } from "@/lib/supabase/client"

export function OpportunitiesPageWithDebug() {
  const { t, language, isLoaded } = useTranslations()
  const [view, setView] = useState("table")
  const [opportunities, setOpportunities] = useState([])
  const [stages, setStages] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [debugInfo, setDebugInfo] = useState({
    showDetails: false,
    translationsInMemory: null,
    hookResults: {},
  })

  //const supabase = createClientComponentClient()

  // Cargar datos
  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        // Cargar oportunidades
        const { data: opportunitiesData, error: opportunitiesError } = await supabase
          .from("opportunities")
          .select("*, pipeline_stages(*), partners(*), tech_companies(*), end_customers(*), users(*)")
          .order("created_at", { ascending: false })

        if (opportunitiesError) {
          console.error("Error al cargar oportunidades:", opportunitiesError)
        } else {
          setOpportunities(opportunitiesData || [])
        }

        // Cargar etapas
        const { data: stagesData, error: stagesError } = await supabase
          .from("pipeline_stages")
          .select("*")
          .order("order", { ascending: true })

        if (stagesError) {
          console.error("Error al cargar etapas:", stagesError)
        } else {
          setStages(stagesData || [])
        }
      } catch (error) {
        console.error("Error al cargar datos:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [supabase])

  // Registrar el estado de las traducciones cuando cambia
  useEffect(() => {
    console.log("Estado de traducciones:", {
      isLoaded,
      language,
      serviceInitialized: TranslationService.isInitialized,
    })

    // Registrar algunas traducciones clave
    if (isLoaded) {
      const keysToCheck = [
        "opportunities.table_view",
        "opportunities.kanban_view",
        "opportunities.title",
        "opportunities.create",
      ]

      console.log("Traducciones cargadas:")
      keysToCheck.forEach((key) => {
        const translation = t(key, `[Default: ${key}]`)
        console.log(`${key}: "${translation}"`)
      })
    }
  }, [isLoaded, language, t])

  // Función para recargar traducciones
  const handleReloadTranslations = async () => {
    try {
      await TranslationService.loadTranslations(language)
      alert(`Traducciones recargadas para idioma: ${language}`)
    } catch (error) {
      console.error("Error al recargar traducciones:", error)
      alert(`Error al recargar traducciones: ${error.message}`)
    }
  }

  // Función para verificar traducciones en memoria
  const handleCheckTranslationsInMemory = () => {
    const translationsInMemory = TranslationService.getDebugInfo()
    setDebugInfo((prev) => ({
      ...prev,
      translationsInMemory,
      showDetails: true,
    }))
  }

  // Función para depurar el hook
  const handleDebugHook = () => {
    const keysToCheck = [
      "opportunities.table_view",
      "opportunities.kanban_view",
      "opportunities.title",
      "opportunities.create",
    ]

    const results = {}
    keysToCheck.forEach((key) => {
      // Probar con diferentes combinaciones
      results[key] = {
        "t(key)": t(key),
        "t(key, 'Default')": t(key, "Default"),
        "TranslationService.getTranslation(key, language)": TranslationService.getTranslation(key, language),
        "TranslationService.getTranslation(key, language, 'Default')": TranslationService.getTranslation(
          key,
          language,
          "Default",
        ),
      }
    })

    setDebugInfo((prev) => ({
      ...prev,
      hookResults: results,
      showDetails: true,
    }))
  }

  if (isLoading) {
    return <div className="p-8 text-center">Cargando datos...</div>
  }

  return (
    <div className="space-y-6">
      {/* Panel de depuración */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Depuración de Traducciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium mb-1">Estado del servicio:</h3>
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
                <h3 className="font-medium mb-1">Traducciones clave:</h3>
                <ul className="text-sm space-y-1">
                  <li>
                    <strong>opportunities.table_view:</strong> "{t("opportunities.table_view", "[No traducción]")}"
                  </li>
                  <li>
                    <strong>opportunities.kanban_view:</strong> "{t("opportunities.kanban_view", "[No traducción]")}"
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setDebugInfo((prev) => ({ ...prev, showDetails: !prev.showDetails }))}
              >
                {debugInfo.showDetails ? "Ocultar detalles" : "Mostrar detalles"}
              </Button>
              <Button size="sm" variant="outline" onClick={handleReloadTranslations}>
                Recargar traducciones
              </Button>
              <Button size="sm" variant="outline" onClick={handleCheckTranslationsInMemory}>
                Verificar Traducciones en Memoria
              </Button>
              <Button size="sm" variant="outline" onClick={handleDebugHook}>
                Depurar Hook
              </Button>
            </div>

            {debugInfo.showDetails && (
              <div className="mt-4 p-3 bg-white rounded-md border text-xs overflow-auto max-h-60">
                {debugInfo.translationsInMemory && (
                  <div className="mb-4">
                    <h4 className="font-bold mb-1">Traducciones en memoria:</h4>
                    <pre>{JSON.stringify(debugInfo.translationsInMemory, null, 2)}</pre>
                  </div>
                )}

                {Object.keys(debugInfo.hookResults).length > 0 && (
                  <div>
                    <h4 className="font-bold mb-1">Resultados del hook:</h4>
                    <pre>{JSON.stringify(debugInfo.hookResults, null, 2)}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Contenido principal */}
      <div>
        <h2 className="text-2xl font-bold mb-4">
          {isLoaded ? t("opportunities.title", "Oportunidades") : "Oportunidades"}
        </h2>

        <Tabs defaultValue="table" value={view} onValueChange={setView} className="mb-6">
          <TabsList>
            <TabsTrigger value="table">
              {isLoaded ? t("opportunities.table_view", "Vista de tabla") : "Vista de tabla"}
            </TabsTrigger>
            <TabsTrigger value="kanban">
              {isLoaded ? t("opportunities.kanban_view", "Vista Kanban") : "Vista Kanban"}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="table">
            <OpportunitiesTable opportunities={opportunities} />
          </TabsContent>
          <TabsContent value="kanban">
            <OpportunitiesKanban opportunities={opportunities} stages={stages} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
