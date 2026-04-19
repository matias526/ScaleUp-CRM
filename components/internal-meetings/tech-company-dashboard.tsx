"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Users, Target, TrendingUp, TrendingDown, AlertTriangle, Plus } from "lucide-react"
import FunnelVisual from "./funnel-visual"
import type { AIAnalysis } from "@/types/ai-analysis"
import { AddCommitmentDialog } from "./add-commitment-dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface Partner {
  id: string
  name: string
  contact_email: string
  country: string
  opportunityCount: number
  taskCount: number
  lastActivity: string | null
}

interface TechCompanyData {
  company: {
    id: string
    name: string
    code: string
    logo_url?: string
  }
  funnel: Record<string, { count: number; value: number }>
  totalOpportunities: number
  totalValue: number
  involvedUsers: Array<{
    id: string
    first_name: string
    last_name: string
    opportunityCount: number
    taskCount: number
    partnerCount: number
    roles?: { code: string }
  }>
  partners: Partner[]
  partnerCount: number
  taskCount: number
  goodMetrics: {
    newOpportunities: number
    wonOpportunities: number
    movedOpportunities: number
  }
  badMetrics: {
    stagnantOpportunities: number
    oldOpportunities: number
    opportunitiesWithoutValue: number
    opportunitiesWithoutCloseDate: number
    lostOpportunities: number
  }
  potentialPartnersMetrics?: {
    lead: number
    initialCommunication: number
    engagement: number
    quotation: number
  }
}

interface OpportunityDetail {
  id: string
  title: string
  daysSinceCreation: number
  daysSinceLastUpdate: number
  stageCode: string
  stageName?: string
  country?: string
}

interface DebugInfo {
  techCompanyId: string
  stagesRequested: string[]
  stagesUsed: string[]
  sqlQuery: string
  rawOpportunitiesCount: number
  filteredOpportunitiesCount: number
  allStages: string[]
}

interface TechCompanyDashboardProps {
  meetingId?: string
}

export default function TechCompanyDashboard({ meetingId }: TechCompanyDashboardProps) {
  const [companies, setCompanies] = useState<TechCompanyData[]>([])
  const [currentCompanyIndex, setCurrentCompanyIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [aiAnalysis, setAiAnalysis] = useState<Record<string, AIAnalysis>>({})
  const [isCommitmentDialogOpen, setIsCommitmentDialogOpen] = useState(false)
  const [newPartnerFilter, setNewPartnerFilter] = useState<"all" | "true" | "false">("all")
  const [isPartnersModalOpen, setIsPartnersModalOpen] = useState(false)
  const [selectedStageName, setSelectedStageName] = useState<string>("")
  const [selectedStages, setSelectedStages] = useState<string[]>([])
  const [modalOpportunities, setModalOpportunities] = useState<OpportunityDetail[]>([])
  const [loadingModal, setLoadingModal] = useState(false)
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null)

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true)

        // 1. Obtenemos el ID de la reunión de la URL (fundamental)
        const pathParts = window.location.pathname.split('/')
        const meetingId = pathParts[pathParts.length - 1]

        console.log("Llamando a la API para la reunión:", meetingId)

        // 2. Le pasamos el meetingId a la API para que sepa qué buscar
        // Agregamos el meetingId como parámetro
        const response = await fetch(`/api/tech-companies/dashboard?meetingId=${meetingId}`)
        const result = await response.json()

        if (result.success) {
          setCompanies(result.companies)
        } else {
          // Si entra acá, es que la API devolvió el error que viste
          console.error("La API devolvió un error:", result.error)
        }
      } catch (error) {
        console.error("Error de red o de código:", error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  const generateAIAnalysis = async (companiesData: TechCompanyData[]) => {
    console.log("[v0] Generating AI analysis for", companiesData.length, "companies")
    const analyses: Record<string, AIAnalysis> = {}

    for (const companyData of companiesData) {
      try {
        if (!companyData || !companyData.company || !companyData.company.id || !companyData.company.name) {
          console.error("[v0] Invalid company data:", companyData)
          continue
        }

        console.log("[v0] Generating analysis for:", companyData.company.name)

        const prompt = `
        Analiza el estado de esta TechCompany y proporciona un semáforo (verde/amarillo/rojo) y sugerencias:

        Empresa: ${companyData.company.name}
        
        Métricas Positivas:
        - Nuevas oportunidades (última semana): ${companyData.goodMetrics?.newOpportunities || 0}
        - Oportunidades ganadas (última semana): ${companyData.goodMetrics?.wonOpportunities || 0}
        - Oportunidades con movimiento (última semana): ${companyData.goodMetrics?.movedOpportunities || 0}
        
        Métricas Negativas:
        - Oportunidades estancadas (>30 días sin movimiento): ${companyData.badMetrics?.stagnantOpportunities || 0}
        - Oportunidades antiguas (>30 días): ${companyData.badMetrics?.oldOpportunities || 0}
        - Oportunidades sin valor estimado: ${companyData.badMetrics?.opportunitiesWithoutValue || 0}
        - Oportunidades sin fecha de cierre: ${companyData.badMetrics?.opportunitiesWithoutCloseDate || 0}
        - Oportunidades perdidas (última semana): ${companyData.badMetrics?.lostOpportunities || 0}
        
        Total de oportunidades: ${companyData.totalOpportunities || 0}
        Valor total del pipeline: $${(companyData.totalValue || 0).toLocaleString()}
        Número de partners: ${companyData.partnerCount || 0}
        Equipo involucrado: ${companyData.involvedUsers?.length || 0} personas

        Responde SOLO con un JSON en este formato:
        {
          "status": "green|yellow|red",
          "suggestions": ["sugerencia 1", "sugerencia 2"]
        }
        `

        // const { text } = await generateText({
        //   model: "openai/gpt-4o-mini",
        //   prompt,
        // })
        // const analysis = JSON.parse(text.trim())

        // Fallback analysis until AI Gateway is configured
        const analysis = {
          status: "yellow" as const,
          suggestions: ["Revisar métricas manualmente", "Contactar al equipo para más información"],
        }

        analyses[companyData.company.id] = analysis
      } catch (error) {
        console.error(`[v0] Error generating AI analysis for ${companyData.company?.name || "unknown"}:`, error)
        // Fallback analysis
        if (companyData.company?.id) {
          analyses[companyData.company.id] = {
            status: "yellow",
            suggestions: ["Revisar métricas manualmente", "Contactar al equipo para más información"],
          }
        }
      }
    }

    console.log("[v0] AI analyses generated:", Object.keys(analyses).length)
    setAiAnalysis(analyses)
  }

  const handleNextCompany = () => {
    if (currentCompanyIndex < companies.length - 1) {
      setCurrentCompanyIndex(currentCompanyIndex + 1)
    }
  }

  const handlePrevCompany = () => {
    if (currentCompanyIndex > 0) {
      setCurrentCompanyIndex(currentCompanyIndex - 1)
    }
  }

  const calculateFunnelHealth = (funnelData: any[]) => {
    const generacion = funnelData.find((stage) => stage.name === "Generación")?.count || 0
    const desarrollo = funnelData.find((stage) => stage.name === "Desarrollo")?.count || 0
    const propuesta = funnelData.find((stage) => stage.name === "Propuesta")?.count || 0
    const cierre = funnelData.find((stage) => stage.name === "Cierre")?.count || 0

    // Healthy funnel: more opportunities in earlier stages
    return generacion >= desarrollo && desarrollo >= propuesta && propuesta >= cierre && generacion > 0
  }

  const getNonAdminUsers = (users: any[]) => {
    return users.filter((user) => !user.roles || user.roles.code !== "Admin")
  }

  const countBDDUsers = (involvedUsers: any[]) => {
    if (!Array.isArray(involvedUsers)) return 0

    // First filter for active users (same logic as activeInvolvedUsers)
    const activeUsers = involvedUsers.filter(
      (user) => user.opportunityCount > 0 || user.taskCount > 0 || user.partnerCount > 0,
    )

    // Then filter for BDD role
    const bddUsers = activeUsers.filter((user) => user && user.roles && user.roles.code === "BDD")

    return bddUsers.length
  }

  const kpiExplanations = {
    newOpportunities: "Oportunidades creadas en los últimos 7 días",
    wonOpportunities: "Oportunidades ganadas en los últimos 7 días",
    movedOpportunities: "Oportunidades con actividad en los últimos 7 días (cambios de etapa, actualizaciones)",
    stagnantOpportunities: "Oportunidades sin movimiento por más de 30 días",
    oldOpportunities: "Oportunidades creadas hace más de 30 días que aún no se han cerrado",
    opportunitiesWithoutValue: "Oportunidades activas sin valor estimado definido",
    opportunitiesWithoutCloseDate: "Oportunidades activas sin fecha de cierre estimada",
    lostOpportunities: "Oportunidades perdidas en los últimos 7 días",
    manyOpportunities: "Hay más de 18 oportunidades activas en el pipeline",
    healthyPipeline:
      "El funnel tiene más oportunidades en etapas tempranas que en tardías (Generación ≥ Desarrollo ≥ Propuesta ≥ Cierre)",
    diversifiedTeam: "Hay más de 2 BDDs trabajando activamente en esta TechCompany",
    unhealthyPipeline:
      "El funnel tiene más oportunidades en etapas tardías que en tempranas, lo que indica falta de prospección",
    noPartners: "No hay partners activos trabajando con esta TechCompany",
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium">Cargando dashboard de TechCompanies...</div>
        </div>
      </div>
    )
  }

  if (!Array.isArray(companies) || companies.length === 0) {
    console.log("--- LLEGO ACA ---")
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium">No hay TechCompanies activas</div>
        </div>
      </div>
    )
  }

  const currentCompany = companies[currentCompanyIndex]

  if (!currentCompany || !currentCompany.company || !currentCompany.company.id || !currentCompany.company.name) {
    console.error("[v0] Invalid current company data:", currentCompany)
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium">Error: Datos de empresa incompletos</div>
          <div className="text-sm text-gray-500 mt-2">
            Empresa {currentCompanyIndex + 1} de {companies.length}
          </div>
        </div>
      </div>
    )
  }

  const currentAI = currentCompany.company.id ? aiAnalysis[currentCompany.company.id] : null

  const funnelStages = [
    {
      name: "Generación",
      stages: ["Pre-Lead", "Lead"],
      color: "bg-gradient-to-r from-red-400 to-red-500",
    },
    {
      name: "Desarrollo",
      stages: ["Initial Communication", "Engagement"],
      color: "bg-gradient-to-r from-orange-400 to-orange-500",
    },
    {
      name: "Propuesta",
      stages: ["Quotation"],
      color: "bg-gradient-to-r from-green-400 to-green-500",
    },
    {
      name: "Cierre",
      stages: ["Won"],
      color: "bg-gradient-to-r from-teal-400 to-teal-500",
    },
  ]

  const funnelData = funnelStages.map((group) => {
    const count = group.stages.reduce((sum, stage) => sum + (currentCompany.funnel[stage]?.count || 0), 0)
    const value = group.stages.reduce((sum, stage) => sum + (currentCompany.funnel[stage]?.value || 0), 0)

    return {
      name: group.name,
      count,
      value,
      color: group.color,
    }
  })

  const activeInvolvedUsers = currentCompany.involvedUsers.filter(
    (user) => user.opportunityCount > 0 || user.taskCount > 0 || user.partnerCount > 0,
  )

  const visibleGoodMetrics = [
    { label: "Nuevas oportunidades (7d)", value: currentCompany.goodMetrics.newOpportunities },
    { label: "Oportunidades ganadas (7d)", value: currentCompany.goodMetrics.wonOpportunities },
    { label: "Con actividad (7d)", value: currentCompany.goodMetrics.movedOpportunities },
  ].filter((metric) => metric.value > 0)

  const visibleBadMetrics = [
    { label: "Sin movimiento (+30d)", value: currentCompany.badMetrics.stagnantOpportunities },
    { label: "Oportunidades antiguas", value: currentCompany.badMetrics.oldOpportunities },
    { label: "Sin valor estimado", value: currentCompany.badMetrics.opportunitiesWithoutValue },
    { label: "Sin fecha de cierre", value: currentCompany.badMetrics.opportunitiesWithoutCloseDate },
    { label: "Perdidas (7d)", value: currentCompany.badMetrics.lostOpportunities },
  ].filter((metric) => metric.value > 0)

  const handlePotentialPartnerClick = async (stageName: string, stages: string[]) => {
    console.log("[v0] Potential partner clicked:", stageName, stages)
    setSelectedStageName(stageName)
    setSelectedStages(stages)
    setIsPartnersModalOpen(true)
    setLoadingModal(true)
    setModalOpportunities([])
    setDebugInfo(null)

    try {
      const stagesQuery = stages.join(",")
      const url = `/api/tech-companies/${currentCompany.company.id}/potential-partners?stages=${stagesQuery}`
      console.log("[v0] Fetching from URL:", url)

      const response = await fetch(url)
      const result = await response.json()

      console.log("[v0] API response:", result)

      if (result.success) {
        setModalOpportunities(result.data || [])
        setDebugInfo(result.debug || null)
      } else {
        console.error("[v0] API error:", result.error)
        setDebugInfo(result.debug || null)
      }
    } catch (error) {
      console.error("[v0] Fetch error:", error)
    } finally {
      setLoadingModal(false)
    }
  }

  return (
    <div className="h-full p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-6">
          {currentCompany.company?.logo_url && (
            <img
              src={currentCompany.company.logo_url || "/placeholder.svg"}
              alt={currentCompany.company?.name || "Company logo"}
              className="h-20 w-20 object-contain"
            />
          )}
          <div>
            <h2 className="text-3xl font-bold">{currentCompany.company?.name || "Sin nombre"}</h2>
            <Badge variant="outline" className="mt-2">
              {currentCompanyIndex + 1} de {companies.length} empresas
            </Badge>
          </div>
        </div>

        <Button onClick={() => setIsCommitmentDialogOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Agregar Compromiso
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left Column - Funnel and Involucrados */}
        <div className="col-span-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Funnel de Oportunidades
              </CardTitle>
              <Tabs
                value={newPartnerFilter}
                onValueChange={(value) => setNewPartnerFilter(value as any)}
                className="mt-3"
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all">Todos</TabsTrigger>
                  <TabsTrigger value="true">Partner Potenciales</TabsTrigger>
                  <TabsTrigger value="false">Oportunidades</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent>
              <div className="pl-8">
                <FunnelVisual stages={funnelData} />
              </div>
              <div className="mt-6 pt-4 border-t">
                <div className="flex justify-between text-sm font-medium">
                  <span>Total:</span>
                  <span>{currentCompany.totalOpportunities || 0} oportunidades</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Valor:</span>
                  <span>${(currentCompany.totalValue || 0).toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Involucrados ({activeInvolvedUsers?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="grid grid-cols-4 gap-2 pb-2 border-b border-gray-200 text-xs font-medium text-gray-600">
                  <span>Nombre</span>
                  <span className="text-center">Oportunidades</span>
                  <span className="text-center">Tareas</span>
                  <span className="text-center">Partners</span>
                </div>
                {activeInvolvedUsers && activeInvolvedUsers.length > 0 ? (
                  activeInvolvedUsers.map((user) => (
                    <div key={user.id} className="grid grid-cols-4 gap-2 py-2 border-b border-gray-100 last:border-0">
                      <div className="font-medium text-sm">
                        {user.first_name} {user.last_name}
                      </div>
                      <div className="text-center">
                        <Badge variant="outline" className="px-2 py-1 text-xs">
                          {user.opportunityCount || 0}
                        </Badge>
                      </div>
                      <div className="text-center">
                        <Badge variant="outline" className="px-2 py-1 text-xs">
                          {user.taskCount || 0}
                        </Badge>
                      </div>
                      <div className="text-center">
                        <Badge variant="outline" className="px-2 py-1 text-xs">
                          {user.partnerCount || 0}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500 text-center py-4">No hay usuarios activos</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Center Column - Potenciales Partners and Partners */}
        <div className="col-span-4 space-y-6">
          <Card className="border-blue-200">
            <CardHeader className="bg-blue-50">
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <Users className="h-5 w-5" />
                Potenciales Partners
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {currentCompany.potentialPartnersMetrics &&
                (currentCompany.potentialPartnersMetrics.lead > 0 ||
                  currentCompany.potentialPartnersMetrics.initialCommunication > 0 ||
                  currentCompany.potentialPartnersMetrics.engagement > 0 ||
                  currentCompany.potentialPartnersMetrics.quotation > 0) ? (
                <div className="space-y-3">
                  {currentCompany.potentialPartnersMetrics.lead > 0 && (
                    <button
                      onClick={() => handlePotentialPartnerClick("Lead", ["Pre-Lead", "Lead"])}
                      className="w-full flex justify-between items-center p-2 hover:bg-blue-50 rounded transition-colors"
                    >
                      <span className="text-sm font-medium">Lead</span>
                      <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                        {currentCompany.potentialPartnersMetrics.lead}
                      </Badge>
                    </button>
                  )}
                  {currentCompany.potentialPartnersMetrics.initialCommunication > 0 && (
                    <button
                      onClick={() => handlePotentialPartnerClick("Initial Communication", ["Initial Communication"])}
                      className="w-full flex justify-between items-center p-2 hover:bg-blue-50 rounded transition-colors"
                    >
                      <span className="text-sm font-medium">Initial Communication</span>
                      <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                        {currentCompany.potentialPartnersMetrics.initialCommunication}
                      </Badge>
                    </button>
                  )}
                  {currentCompany.potentialPartnersMetrics.engagement > 0 && (
                    <button
                      onClick={() => handlePotentialPartnerClick("Engagement", ["Engagement"])}
                      className="w-full flex justify-between items-center p-2 hover:bg-blue-50 rounded transition-colors"
                    >
                      <span className="text-sm font-medium">Engagement</span>
                      <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                        {currentCompany.potentialPartnersMetrics.engagement}
                      </Badge>
                    </button>
                  )}
                  {currentCompany.potentialPartnersMetrics.quotation > 0 && (
                    <button
                      onClick={() => handlePotentialPartnerClick("Quotation", ["Quotation"])}
                      className="w-full flex justify-between items-center p-2 hover:bg-blue-50 rounded transition-colors"
                    >
                      <span className="text-sm font-medium">Quotation</span>
                      <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                        {currentCompany.potentialPartnersMetrics.quotation}
                      </Badge>
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-sm text-gray-500 text-center py-4">No hay ningún partner potencial</div>
              )}
            </CardContent>
          </Card>

          <Card className="flex-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Partners ({currentCompany.partners?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="grid grid-cols-4 gap-2 pb-2 border-b border-gray-200 text-xs font-medium text-gray-600">
                  <span>Nombre</span>
                  <span className="text-center">País</span>
                  <span className="text-center">Oportunidades</span>
                  <span className="text-center">Tareas</span>
                </div>
                {currentCompany.partners && currentCompany.partners.length > 0 ? (
                  currentCompany.partners
                    .sort((a, b) => (b.opportunityCount || 0) - (a.opportunityCount || 0))
                    .map((partner) => (
                      <div
                        key={partner.id}
                        className="grid grid-cols-4 gap-2 py-2 border-b border-gray-100 last:border-0"
                      >
                        <div>
                          <div className="font-medium text-sm">{partner.name || "Sin nombre"}</div>
                          <div className="text-xs text-gray-500 truncate">{partner.contact_email || ""}</div>
                        </div>
                        <div className="text-center">
                          <span className="text-xs text-gray-600">{partner.country || "Sin país"}</span>
                        </div>
                        <div className="text-center">
                          <Badge variant="outline" className="px-2 py-1 text-xs">
                            {partner.opportunityCount || 0}
                          </Badge>
                        </div>
                        <div className="text-center">
                          <Badge variant="outline" className="px-2 py-1 text-xs">
                            {partner.taskCount || 0}
                          </Badge>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-sm text-gray-500 text-center py-4">No hay partners activos</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - AI Analysis, Lo Bueno and Lo Malo */}
        <div className="col-span-4 space-y-6">
          <Card className="border-gray-200 h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertTriangle className="h-5 w-5" />
                Análisis AI
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-center text-gray-500">
                <div className="text-sm">Análisis temporalmente deshabilitado</div>
                <div className="text-xs mt-1">Configurando AI Gateway...</div>
                <div className="text-xs mt-2 text-gray-400">Error: Falta configuración de autenticación AI Gateway</div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200">
            <CardHeader className="bg-green-50">
              <CardTitle className="flex items-center gap-2 text-green-700">
                <TrendingUp className="h-5 w-5" />
                Lo Bueno
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <TooltipProvider>
                <div className="space-y-4">
                  {visibleGoodMetrics.map((metric, index) => {
                    const explanationKey = metric.label.includes("Nuevas")
                      ? "newOpportunities"
                      : metric.label.includes("ganadas")
                        ? "wonOpportunities"
                        : "movedOpportunities"

                    return (
                      <Tooltip key={index}>
                        <TooltipTrigger asChild>
                          <div className="flex justify-between items-center cursor-help">
                            <span className="text-sm">{metric.label}</span>
                            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                              {metric.value}
                            </Badge>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">{kpiExplanations[explanationKey]}</p>
                        </TooltipContent>
                      </Tooltip>
                    )
                  })}
                  {(currentCompany.totalOpportunities || 0) > 18 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex justify-between items-center cursor-help">
                          <span className="text-sm">Hay oportunidades en cantidad</span>
                          <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                            ✓
                          </Badge>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">{kpiExplanations.manyOpportunities}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {calculateFunnelHealth(funnelData) && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex justify-between items-center cursor-help">
                          <span className="text-sm">Pipeline saludable</span>
                          <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                            ✓
                          </Badge>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">{kpiExplanations.healthyPipeline}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {countBDDUsers(currentCompany.involvedUsers) > 2 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex justify-between items-center cursor-help">
                          <span className="text-sm">Equipo diversificado</span>
                          <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                            ✓
                          </Badge>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">{kpiExplanations.diversifiedTeam}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {visibleGoodMetrics.length === 0 &&
                    (currentCompany.totalOpportunities || 0) <= 18 &&
                    !calculateFunnelHealth(funnelData) &&
                    countBDDUsers(currentCompany.involvedUsers) <= 2 && (
                      <div className="text-sm text-gray-500 text-center py-4">
                        No hay métricas positivas esta semana
                      </div>
                    )}
                </div>
              </TooltipProvider>
            </CardContent>
          </Card>

          <Card className="border-red-200">
            <CardHeader className="bg-red-50">
              <CardTitle className="flex items-center gap-2 text-red-700">
                <TrendingDown className="h-5 w-5" />
                Lo Malo
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <TooltipProvider>
                <div className="space-y-4">
                  {visibleBadMetrics.map((metric, index) => {
                    const explanationKey = metric.label.includes("Sin movimiento")
                      ? "stagnantOpportunities"
                      : metric.label.includes("antiguas")
                        ? "oldOpportunities"
                        : metric.label.includes("Sin valor")
                          ? "opportunitiesWithoutValue"
                          : metric.label.includes("Sin fecha")
                            ? "opportunitiesWithoutCloseDate"
                            : "lostOpportunities"

                    return (
                      <Tooltip key={index}>
                        <TooltipTrigger asChild>
                          <div className="flex justify-between items-center cursor-help">
                            <span className="text-sm">{metric.label}</span>
                            <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
                              {metric.value}
                            </Badge>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">{kpiExplanations[explanationKey]}</p>
                        </TooltipContent>
                      </Tooltip>
                    )
                  })}
                  {!calculateFunnelHealth(funnelData) && (currentCompany.totalOpportunities || 0) > 0 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex justify-between items-center cursor-help">
                          <span className="text-sm">Pipeline no saludable</span>
                          <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
                            ⚠
                          </Badge>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">{kpiExplanations.unhealthyPipeline}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {(currentCompany.partners?.length || 0) === 0 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex justify-between items-center cursor-help">
                          <span className="text-sm">Sin partners activos</span>
                          <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
                            ⚠
                          </Badge>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">{kpiExplanations.noPartners}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {visibleBadMetrics.length === 0 &&
                    calculateFunnelHealth(funnelData) &&
                    (currentCompany.partners?.length || 0) > 0 && (
                      <div className="text-sm text-green-500 text-center py-4">¡No hay problemas detectados!</div>
                    )}
                </div>
              </TooltipProvider>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex items-center justify-between mt-6 pt-4 border-t">
        <Button
          variant="outline"
          onClick={handlePrevCompany}
          disabled={currentCompanyIndex === 0}
          className="flex items-center gap-2 bg-transparent"
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </Button>

        <div className="flex gap-2">
          {companies.map((_, index) => (
            <div
              key={index}
              className={`w-3 h-3 rounded-full transition-all ${index === currentCompanyIndex ? "bg-blue-600 scale-125" : "bg-gray-300"
                }`}
            />
          ))}
        </div>

        <Button
          variant="outline"
          onClick={handleNextCompany}
          disabled={currentCompanyIndex === companies.length - 1}
          className="flex items-center gap-2 bg-transparent"
        >
          Siguiente
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <AddCommitmentDialog
        isOpen={isCommitmentDialogOpen}
        onClose={() => setIsCommitmentDialogOpen(false)}
        techCompanyId={currentCompany.company.id}
        techCompanyName={currentCompany.company.name}
        meetingId={meetingId}
        onSuccess={() => {
          console.log("Compromiso creado exitosamente")
        }}
      />

      <Dialog open={isPartnersModalOpen} onOpenChange={setIsPartnersModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Oportunidades en {selectedStageName}</DialogTitle>
            <p className="text-sm text-gray-500">{currentCompany.company.name} - Partners Potenciales</p>
          </DialogHeader>

          {/* Opportunities List */}
          <div className="mt-4">
            {loadingModal ? (
              <div className="text-center py-8 text-gray-500">Cargando oportunidades...</div>
            ) : modalOpportunities.length > 0 ? (
              <div className="space-y-3">
                {modalOpportunities.map((opp) => (
                  <div key={opp.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-base">{opp.title}</h3>
                        <div className="flex gap-4 mt-2 text-sm text-gray-600">
                          <span>Stage: {opp.stageCode}</span>
                          {opp.country && <span>País: {opp.country}</span>}
                        </div>
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        <div>Creada hace {opp.daysSinceCreation} días</div>
                        <div className="text-xs mt-1">Actualizada hace {opp.daysSinceLastUpdate} días</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">No hay oportunidades en esta etapa</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
