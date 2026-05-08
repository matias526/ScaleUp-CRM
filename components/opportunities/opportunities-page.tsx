// Corregir la carga de información del usuario y restaurar la vista kanban por defecto
"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { OpportunitiesTable } from "@/components/opportunities/opportunities-table"
import { OpportunitiesKanban } from "@/components/opportunities/opportunities-kanban"
import { PartnerOpportunitiesView } from "@/components/opportunities/partner-opportunities-view"
import { getOpportunities, getOpportunityStages } from "@/lib/services/opportunity-service"
import { useTranslations } from "@/hooks/use-translations"
import type { Tables } from "@/types/supabase"
// Importar el hook useAuth
import { useAuth } from "@/components/auth/auth-provider"
import { useToast } from "@/components/ui/use-toast"

// Añadir estas constantes después de las importaciones y antes del componente
// Traducciones de respaldo
const fallbackTranslations = {
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

// Función para obtener una traducción con respaldo garantizado
function getTranslation(key: string, language: string, t: (key: string, defaultValue?: string) => string): string {
  // Intentar obtener la traducción usando el hook
  const translation = t(key)

  // Si la traducción es igual a la clave, significa que no se encontró
  if (translation === key) {
    // Intentar obtener la traducción del respaldo
    return (
      fallbackTranslations[language as keyof typeof fallbackTranslations]?.[
        key as keyof (typeof fallbackTranslations)[keyof typeof fallbackTranslations]
      ] || key
    )
  }

  return translation
}

// Modificar la función OpportunitiesPage para usar la información del usuario
export function OpportunitiesPage() {
  const { t, language } = useTranslations()
  const [view, setView] = useState<"table" | "kanban">("kanban")
  const [opportunities, setOpportunities] = useState([])
  const [stages, setStages] = useState<Tables<"pipeline_stages">[]>([])
  const [loading, setLoading] = useState(true)
  const { userInfo } = useAuth() // Obtener la información del usuario
  const { toast } = useToast()
  const router = useRouter()

  const searchParams = useSearchParams()
  const selectedOpportunityId = searchParams.get("selected")

  // Determinar si el usuario es un Partner
  const isPartnerUser = userInfo?.roleCode?.toLowerCase() === "partneruser"

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        console.log("Cargando oportunidades con userInfo:", userInfo)

        // Pasar la información del usuario al servicio
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

    if (userInfo) {
      loadData()
    }
  }, [userInfo, toast]) // Añadir userInfo como dependencia

  const handleCreateOpportunity = () => {
    router.push("/dashboard/opportunities/create")
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Cargando oportunidades...</div>
  }

  // Si el usuario es un Partner, mostrar la vista especial para Partners
  if (isPartnerUser) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">{getTranslation("opportunities.title", language, t)}</h1>
          <Button onClick={handleCreateOpportunity}>
            <Plus className="mr-2 h-4 w-4" />
            {getTranslation("opportunities.create", language, t)}
          </Button>
        </div>

        <PartnerOpportunitiesView opportunities={opportunities} autoOpenOpportunityId={selectedOpportunityId} />
      </div>
    )
  }

  // Para otros tipos de usuarios, mostrar la vista normal
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{getTranslation("opportunities.title", language, t)}</h1>
        <Button onClick={handleCreateOpportunity}>
          <Plus className="mr-2 h-4 w-4" />
          {getTranslation("opportunities.create", language, t)}
        </Button>
      </div>

      <Tabs defaultValue="kanban" value={view} onValueChange={(value) => setView(value as "table" | "kanban")}>
        <TabsList>
          <TabsTrigger value="table">{getTranslation("opportunities.table_view", language, t)}</TabsTrigger>
          <TabsTrigger value="kanban">{getTranslation("opportunities.kanban_view", language, t)}</TabsTrigger>
        </TabsList>
        <TabsContent value="table">
          <OpportunitiesTable opportunities={opportunities} userRole={userInfo?.roleCode} />
        </TabsContent>
        <TabsContent value="kanban">
          <OpportunitiesKanban opportunities={opportunities} stages={stages} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
