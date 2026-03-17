"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { OpportunitiesTable } from "@/components/opportunities/opportunities-table"
import { OpportunitiesKanban } from "@/components/opportunities/opportunities-kanban"
import { getOpportunities, getOpportunityStages } from "@/lib/services/opportunity-service"
import { useTranslations } from "@/hooks/use-translations"
import type { Tables } from "@/types/supabase"
import { useAuth } from "@/components/auth/auth-provider"
import { useToast } from "@/components/ui/use-toast"

// Traducciones fijas para usar como fallback
const TRANSLATIONS = {
  "opportunities.title": {
    en: "Opportunities",
    es: "Oportunidades",
    pt: "Oportunidades",
  },
  "opportunities.create": {
    en: "Create Opportunity",
    es: "Crear Oportunidad",
    pt: "Criar Oportunidade",
  },
  "opportunities.table_view": {
    en: "Table View",
    es: "Vista de Tabla",
    pt: "Visualização em Tabela",
  },
  "opportunities.kanban_view": {
    en: "Kanban View",
    es: "Vista Kanban",
    pt: "Visualização Kanban",
  },
}

export function OpportunitiesPageFixed() {
  const { t, language, isLoaded } = useTranslations()
  const [view, setView] = useState<"table" | "kanban">("kanban")
  const [opportunities, setOpportunities] = useState([])
  const [stages, setStages] = useState<Tables<"pipeline_stages">[]>([])
  const [loading, setLoading] = useState(true)
  const { userInfo } = useAuth()
  const { toast } = useToast()

  // Función para obtener una traducción con fallback garantizado
  const getTranslation = (key: string, defaultValue: string): string => {
    if (!isLoaded) return defaultValue

    // Intentar obtener la traducción normal
    const translation = t(key, "")

    // Si la traducción es igual a la clave, usar el fallback fijo
    if (translation === key && TRANSLATIONS[key as keyof typeof TRANSLATIONS]) {
      return (
        TRANSLATIONS[key as keyof typeof TRANSLATIONS][
          language as keyof (typeof TRANSLATIONS)[keyof typeof TRANSLATIONS]
        ] || defaultValue
      )
    }

    return translation || defaultValue
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const opportunitiesData = await getOpportunities(userInfo)
        setOpportunities(opportunitiesData)

        const stagesData = await getOpportunityStages()
        setStages(stagesData)
      } catch (error) {
        console.error("Error al cargar datos:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar las oportunidades",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [userInfo, toast])

  const router = useRouter()
  const handleCreateOpportunity = () => {
    router.push("/dashboard/opportunities/create")
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Cargando oportunidades...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{getTranslation("opportunities.title", "Oportunidades")}</h1>
        <Button onClick={handleCreateOpportunity}>
          <Plus className="mr-2 h-4 w-4" />
          {getTranslation("opportunities.create", "Crear oportunidad")}
        </Button>
      </div>

      <Tabs defaultValue="kanban" value={view} onValueChange={setView}>
        <TabsList>
          <TabsTrigger value="table">{getTranslation("opportunities.table_view", "Vista de tabla")}</TabsTrigger>
          <TabsTrigger value="kanban">{getTranslation("opportunities.kanban_view", "Vista Kanban")}</TabsTrigger>
        </TabsList>
        <TabsContent value="table">
          <OpportunitiesTable opportunities={opportunities} />
        </TabsContent>
        <TabsContent value="kanban">
          <OpportunitiesKanban opportunities={opportunities} stages={stages} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
