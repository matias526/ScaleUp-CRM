"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle2, XCircle, AlertCircle, ChevronRight, User } from "lucide-react"
import { useTranslations } from "@/hooks/use-translations"
import type { OpportunityWithRelations } from "@/lib/services/opportunity-service"
import { supabase } from "@/lib/supabase/client"
import PartnerOpportunityDetail from "@/components/opportunities/partner-opportunity-detail"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface PartnerOpportunitiesViewProps {
  opportunities: OpportunityWithRelations[]
  autoOpenOpportunityId?: string | null
}

export function PartnerOpportunitiesView({ opportunities, autoOpenOpportunityId }: PartnerOpportunitiesViewProps) {
  const { t } = useTranslations()
  const [activeTab, setActiveTab] = useState("pending")
  const [selectedOpportunity, setSelectedOpportunity] = useState<OpportunityWithRelations | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [partnerResponsibles, setPartnerResponsibles] = useState<Record<string, any>>({})
  const [selectedResponsible, setSelectedResponsible] = useState<string>("all")

  // Función para obtener lista única de responsables
  const getUniqueResponsibles = () => {
    const responsibles = opportunities
      .filter((opp) => opp.partner_responsible_id && partnerResponsibles[opp.partner_responsible_id])
      .map((opp) => ({
        id: opp.partner_responsible_id,
        name: `${partnerResponsibles[opp.partner_responsible_id].first_name} ${partnerResponsibles[opp.partner_responsible_id].last_name}`,
      }))

    // Eliminar duplicados
    const uniqueResponsibles = responsibles.filter(
      (responsible, index, self) => index === self.findIndex((r) => r.id === responsible.id),
    )

    return uniqueResponsibles.sort((a, b) => a.name.localeCompare(b.name))
  }

  // Agrupar oportunidades por estado (con filtro de responsable aplicado)
  const filteredOpportunities =
    selectedResponsible === "all"
      ? opportunities
      : opportunities.filter((opp) => opp.partner_responsible_id === selectedResponsible)

  const pendingValidation = filteredOpportunities.filter((opp) => opp.validation_status === "pending")
  const validated = filteredOpportunities.filter(
    (opp) =>
      opp.validation_status === "validated" &&
      opp.stage?.code?.toLowerCase() !== "won" &&
      opp.stage?.code?.toLowerCase() !== "lost",
  )
  const won = filteredOpportunities.filter((opp) => opp.stage?.code?.toLowerCase() === "won")
  const lost = filteredOpportunities.filter((opp) => opp.stage?.code?.toLowerCase() === "lost")

  // Auto-open opportunity if autoOpenOpportunityId is provided
  useEffect(() => {
    if (autoOpenOpportunityId && opportunities.length > 0) {
      const opportunity = opportunities.find((opp) => opp.id === autoOpenOpportunityId)
      if (opportunity) {
        openOpportunityDetail(opportunity)
      }
    }
  }, [autoOpenOpportunityId, opportunities])

  // Cargar los responsables del partner para todas las oportunidades
  useEffect(() => {
    const loadPartnerResponsibles = async () => {
      const responsibleIds = opportunities
        .filter((opp) => opp.partner_responsible_id)
        .map((opp) => opp.partner_responsible_id)
        .filter((id, index, self) => self.indexOf(id) === index) // Eliminar duplicados

      if (responsibleIds.length === 0) return

      try {
        const { data, error } = await supabase
          .from("users")
          .select("id, first_name, last_name, email")
          .in("id", responsibleIds)

        if (error) {
          console.error("Error al cargar responsables:", error)
          return
        }

        const responsiblesMap = {}
        data.forEach((user) => {
          responsiblesMap[user.id] = user
        })

        setPartnerResponsibles(responsiblesMap)
      } catch (error) {
        console.error("Error inesperado al cargar responsables:", error)
      }
    }

    loadPartnerResponsibles()
  }, [opportunities])

  // Función para obtener el nombre del responsable
  const getResponsibleName = (opportunityId: string, responsibleId: string | null) => {
    if (!responsibleId) return "No asignado"

    const responsible = partnerResponsibles[responsibleId]
    if (!responsible) return "Cargando..."

    return `${responsible.first_name} ${responsible.last_name}`
  }

  // Función para cargar los detalles completos de una oportunidad
  const loadOpportunityDetails = async (opportunityId: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from("opportunities")
        .select(`
          *,
          stage:pipeline_stages(*),
          tech_company:tech_companies(*),
          partner:partners(*),
          end_customer:end_customers(*),
          notes!inner(*, user:users(*)),
          tasks(*, assigned_to_user:users!assigned_to(*), assigned_by_user:users!assigned_by(*))
        `)
        .eq("id", opportunityId)
        .eq("notes.is_private", false)
        .single()

      if (error) {
        console.error("Error al cargar los detalles de la oportunidad:", error)
        setError("No se pudieron cargar los detalles. Por favor, inténtalo de nuevo.")
        return null
      }

      // Ordenar las notas con la más reciente arriba
      if (data && data.notes) {
        data.notes.sort((a, b) => {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })
      }

      return data
    } catch (error) {
      console.error("Error inesperado al cargar los detalles de la oportunidad:", error)
      setError("Ocurrió un error inesperado. Por favor, inténtalo de nuevo.")
      return null
    } finally {
      setIsLoading(false)
    }
  }

  // Función para abrir los detalles de una oportunidad
  const openOpportunityDetail = async (opportunity: OpportunityWithRelations) => {
    // Primero cargamos los detalles completos de la oportunidad
    const detailedOpportunity = await loadOpportunityDetails(opportunity.id)

    if (detailedOpportunity) {
      setSelectedOpportunity(detailedOpportunity)
      setShowDetail(true)
    }
  }

  // Función para cerrar los detalles
  const closeOpportunityDetail = () => {
    setShowDetail(false)
    setSelectedOpportunity(null)
  }

  // Función para recargar los datos después de una modificación
  const handleDataChange = async () => {
    if (selectedOpportunity) {
      const refreshedOpportunity = await loadOpportunityDetails(selectedOpportunity.id)
      if (refreshedOpportunity) {
        setSelectedOpportunity(refreshedOpportunity)
      }
    }
  }

  // Función para renderizar una tarjeta de oportunidad resumida
  const renderOpportunityCard = (opportunity: OpportunityWithRelations) => {
    return (
      <Card
        key={opportunity.id}
        className="mb-4 hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => openOpportunityDetail(opportunity)}
      >
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-medium text-lg line-clamp-1">{opportunity.name || opportunity.title}</h3>
            <div className="flex space-x-2">
              {opportunity.validation_status === "validated" ? (
                <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Validada
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-amber-50 text-amber-800 hover:bg-amber-100">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Pendiente
                </Badge>
              )}
            </div>
          </div>

          <div className="text-sm text-gray-600 mb-2">
            <span className="block">Cliente: {opportunity.end_customer?.name || "No especificado"}</span>
            <span className="block flex items-center">
              <User className="h-3 w-3 mr-1 inline" />
              Responsable: {getResponsibleName(opportunity.id, opportunity.partner_responsible_id)}
            </span>
          </div>

          {opportunity.description && (
            <p className="text-sm text-gray-700 line-clamp-2 mt-2">{opportunity.description}</p>
          )}

          <div className="flex justify-end mt-2">
            <span className="text-primary text-sm flex items-center">
              Ver detalles
              <ChevronRight className="ml-1 h-4 w-4" />
            </span>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Renderizar el componente de carga
  const renderLoading = () => (
    <div className="space-y-4 p-4">
      <Skeleton className="h-8 w-64 mb-4" />
      <Skeleton className="h-32 w-full mb-4" />
      <Skeleton className="h-32 w-full mb-4" />
      <Skeleton className="h-32 w-full" />
    </div>
  )

  // Renderizar mensaje de error
  const renderError = () => (
    <div className="p-8 text-center">
      <div className="text-red-500 mb-4">{error}</div>
      <button
        className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
        onClick={closeOpportunityDetail}
      >
        Volver a la lista
      </button>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Filtro por Responsable del Partner */}
      {!showDetail && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Filtrar por responsable:</label>
            <Select value={selectedResponsible} onValueChange={setSelectedResponsible}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Seleccionar responsable" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los responsables</SelectItem>
                {getUniqueResponsibles().map((responsible) => (
                  <SelectItem key={responsible.id} value={responsible.id}>
                    {responsible.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedResponsible !== "all" && (
              <span className="text-xs text-gray-500">
                Mostrando {filteredOpportunities.length} de {opportunities.length} oportunidades
              </span>
            )}
          </div>
        </div>
      )}
      {!showDetail ? (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger
              value="pending"
              className="relative data-[state=active]:bg-white data-[state=active]:text-primary bg-primary text-white"
            >
              Pendientes ({pendingValidation.length})
            </TabsTrigger>
            <TabsTrigger
              value="validated"
              className="relative data-[state=active]:bg-white data-[state=active]:text-primary bg-primary text-white"
            >
              Validadas ({validated.length})
            </TabsTrigger>
            <TabsTrigger
              value="won"
              className="relative data-[state=active]:bg-white data-[state=active]:text-green-600 bg-green-600 text-white"
            >
              Ganadas ({won.length})
            </TabsTrigger>
            <TabsTrigger
              value="lost"
              className="relative data-[state=active]:bg-white data-[state=active]:text-red-600 bg-red-600 text-white"
            >
              Perdidas ({lost.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-0">
            <div className="bg-primary/10 p-4 rounded-md mb-4 border-l-4 border-primary">
              <h3 className="text-lg font-medium mb-2 flex items-center text-primary">
                <AlertCircle className="h-5 w-5 mr-2 text-amber-500" />
                Oportunidades pendientes de validación
              </h3>
              <p className="text-sm text-gray-600">
                Estas oportunidades están esperando ser validadas por el equipo de ScaleUp.
              </p>
            </div>

            {pendingValidation.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No hay oportunidades pendientes de validación</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingValidation.map(renderOpportunityCard)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="validated" className="mt-0">
            <div className="bg-primary/10 p-4 rounded-md mb-4 border-l-4 border-primary">
              <h3 className="text-lg font-medium mb-2 flex items-center text-primary">
                <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />
                Oportunidades validadas
              </h3>
              <p className="text-sm text-gray-600">Estas oportunidades han sido validadas y están en proceso.</p>
            </div>

            {validated.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No hay oportunidades validadas</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {validated.map(renderOpportunityCard)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="won" className="mt-0">
            <div className="bg-green-100 p-4 rounded-md mb-4 border-l-4 border-green-600">
              <h3 className="text-lg font-medium mb-2 flex items-center text-green-700">
                <CheckCircle2 className="h-5 w-5 mr-2 text-green-600" />
                Oportunidades ganadas
              </h3>
              <p className="text-sm text-green-600">¡Felicitaciones! Estas oportunidades han sido ganadas.</p>
            </div>

            {won.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No hay oportunidades ganadas</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {won.map(renderOpportunityCard)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="lost" className="mt-0">
            <div className="bg-red-100 p-4 rounded-md mb-4 border-l-4 border-red-600">
              <h3 className="text-lg font-medium mb-2 flex items-center text-red-700">
                <XCircle className="h-5 w-5 mr-2 text-red-600" />
                Oportunidades perdidas
              </h3>
              <p className="text-sm text-red-600">Estas oportunidades han sido perdidas.</p>
            </div>

            {lost.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No hay oportunidades perdidas</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {lost.map(renderOpportunityCard)}
              </div>
            )}
          </TabsContent>
        </Tabs>
      ) : (
        <div>
          {isLoading ? (
            renderLoading()
          ) : error ? (
            renderError()
          ) : selectedOpportunity ? (
            <PartnerOpportunityDetail
              opportunity={selectedOpportunity}
              onClose={closeOpportunityDetail}
              onDataChange={handleDataChange}
            />
          ) : (
            <div className="text-center py-8 text-gray-500">No se encontró la oportunidad</div>
          )}
        </div>
      )}
    </div>
  )
}

export default PartnerOpportunitiesView
