"use client"

import { useState, useEffect, useMemo } from "react"
import type React from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Plus,
  Filter,
  Search,
  ArrowUpDown,
  Calendar,
  BarChart3,
  X,
  Snowflake,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import type { Tables } from "@/types/supabase"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"
import { ImageWithFallback } from "@/components/ui/image-with-fallback"
import { formatDate } from "@/lib/utils"
import { useTranslations } from "@/hooks/use-translations"
import { toast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase/client"
import { createStageChangeNote } from "@/lib/services/notes-service"
import type { OpportunityWithRelations } from "@/lib/services/opportunity-service"

interface Opportunity {
  id: string
  title: string
  estimated_value?: number
  estimated_close_date?: string
  country?: string
  pipeline_stages?: {
    id: string
    name: string
    code: string
    color?: string
  }
  partners?: {
    id: string
    name: string
  }
  end_customers?: {
    id: string
    name: string
  }
}

interface KanbanColumn {
  id: string
  title: string
  code: string
  color: string
  opportunities: Opportunity[]
}

// Definir los códigos de etapas especiales
const SPECIAL_STAGES = ["freeze", "won", "lost"]

interface OpportunitiesKanbanProps {
  opportunities: OpportunityWithRelations[]
  stages?: Tables<"pipeline_stages">[]
}

export const OpportunitiesKanban = ({
  opportunities: initialOpportunities,
  stages: propStages,
}: OpportunitiesKanbanProps) => {
  const router = useRouter()
  const { t } = useTranslations()
  const [stages, setStages] = useState<Tables<"pipeline_stages">[]>([])
  const [specialStages, setSpecialStages] = useState<Tables<"pipeline_stages">[]>([])
  const [regularStages, setRegularStages] = useState<Tables<"pipeline_stages">[]>([])
  const [opportunities, setOpportunities] = useState<OpportunityWithRelations[]>(initialOpportunities)
  const [filteredOpportunities, setFilteredOpportunities] = useState<OpportunityWithRelations[]>(initialOpportunities)
  const [groupedOpportunities, setGroupedOpportunities] = useState<Record<string, OpportunityWithRelations[]>>({})
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterTechCompany, setFilterTechCompany] = useState<string | null>(null)
  const [filterPartner, setFilterPartner] = useState<string | null>(null)
  const [filterResponsible, setFilterResponsible] = useState<string | null>(null)
  const [filterValidation, setFilterValidation] = useState<string | null>(null)
  const [scaleupUsers, setScaleupUsers] = useState<any[]>([])
  const [sortBy, setSortBy] = useState<string>("title")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [stageStats, setStageStats] = useState<Record<string, { count: number; value: number }>>({})
  const [activeStage, setActiveStage] = useState<string | null>(null)
  const [userRoleDebug, setUserRoleDebug] = useState<string>("No detectado")
  const [opportunitiesWithoutTasks, setOpportunitiesWithoutTasks] = useState<Set<string>>(new Set())
  const [selectedStages, setSelectedStages] = useState<string[]>([])
  const [allStages, setAllStages] = useState<Tables<"pipeline_stages">[]>([])
  const [visibleStages, setVisibleStages] = useState<Tables<"pipeline_stages">[]>([])
  const [showSpecialStagesInDragArea, setShowSpecialStagesInDragArea] = useState(true)
  const [filterStagnant, setFilterStagnant] = useState<boolean>(false)
  const [filterOldOpportunities, setFilterOldOpportunities] = useState<boolean>(false)
  const [filterNoValue, setFilterNoValue] = useState<boolean>(false)
  const [filterNoCloseDate, setFilterNoCloseDate] = useState<boolean>(false)
  const [stagnantDays, setStagnantDays] = useState<number>(20)

  // Extraer listas únicas de tech companies y partners para los filtros
  const techCompanies = useMemo(() => {
    const uniqueCompanies = Array.from(
      new Set(
        opportunities
          .filter((opp) => opp.tech_company)
          .map((opp) => JSON.stringify({ id: opp.tech_company_id, name: opp.tech_company?.name })),
      ),
    ).map((company) => JSON.parse(company))

    // Ordenar alfabéticamente
    return uniqueCompanies.sort((a, b) => a.name.localeCompare(b.name))
  }, [opportunities])

  const partners = useMemo(() => {
    const uniquePartners = Array.from(
      new Set(
        opportunities
          .filter((opp) => opp.partner)
          .map((opp) => JSON.stringify({ id: opp.partner_id, name: opp.partner?.name })),
      ),
    ).map((partner) => JSON.parse(partner))

    // Ordenar alfabéticamente
    return uniquePartners.sort((a, b) => a.name.localeCompare(b.name))
  }, [opportunities])

  // Cargar el usuario actual y los usuarios de ScaleUp
  useEffect(() => {
    const loadCurrentUser = async () => {
      setIsLoading(true)
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          // Obtener el usuario con su rol
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("id, first_name, last_name, email, role_id, role:roles(code)")
            .eq("id", user.id)
            .single()

          if (userError) {
            console.error("Error al obtener usuario:", userError)
            return
          }

          setCurrentUser(userData)

          // Verificar si el usuario es administrador usando el código del rol
          const userRoleCode = userData?.role?.code
          setUserRoleDebug(userRoleCode || "No encontrado")

          const isUserAdmin = userRoleCode === "Admin"
          console.log("Kanban - ID del usuario:", user.id)
          console.log("Kanban - Rol del usuario:", userRoleCode)
          console.log("Kanban - ¿Es admin?:", isUserAdmin)

          setIsAdmin(isUserAdmin)

          // Cargar usuarios de ScaleUp (BDD y Admin)
          if (isUserAdmin) {
            try {
              // Primero obtenemos los IDs de los roles BDD y Admin
              const { data: rolesData, error: rolesError } = await supabase
                .from("roles")
                .select("id, code")
                .in("code", ["BDD", "Admin"])

              if (rolesError) {
                console.error("Error al obtener roles:", rolesError)
                return
              }

              if (rolesData && rolesData.length > 0) {
                const roleIds = rolesData.map((role) => role.id)

                // Luego obtenemos los usuarios con esos roles
                const { data: scaleupUsersData, error: usersError } = await supabase
                  .from("users")
                  .select("id, first_name, last_name, email, role_id")
                  .in("role_id", roleIds)
                  .order("first_name", { ascending: true })

                if (usersError) {
                  console.error("Error al cargar usuarios de ScaleUp:", usersError)
                } else if (scaleupUsersData) {
                  console.log("Kanban - Usuarios de ScaleUp cargados:", scaleupUsersData.length)
                  setScaleupUsers(scaleupUsersData)
                }
              }
            } catch (error) {
              console.error("Error en la carga de usuarios:", error)
            }
          }
        }
      } catch (error) {
        console.error("Error al cargar el usuario:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadCurrentUser()
  }, [])

  // Verificar oportunidades sin tareas futuras
  useEffect(() => {
    const checkOpportunitiesWithoutTasks = async () => {
      try {
        // Obtener la fecha actual
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const todayISOString = today.toISOString()

        // Obtener todas las tareas futuras
        const { data: futureTasks, error } = await supabase
          .from("tasks")
          .select("opportunity_id")
          .gte("due_date", todayISOString)
          .not("status", "eq", "completed")

        if (error) {
          console.error("Error al cargar tareas:", error)
          return
        }

        // Crear un conjunto con los IDs de oportunidades que tienen tareas futuras
        const opportunitiesWithTasks = new Set(futureTasks.map((task) => task.opportunity_id))

        // Identificar oportunidades sin tareas futuras
        const withoutTasks = new Set(
          opportunities.filter((opp) => !opportunitiesWithTasks.has(opp.id)).map((opp) => opp.id),
        )

        setOpportunitiesWithoutTasks(withoutTasks)
      } catch (error) {
        console.error("Error al verificar tareas de oportunidades:", error)
      }
    }

    if (opportunities.length > 0) {
      checkOpportunitiesWithoutTasks()
    }
  }, [opportunities])

  // Cargar todas las etapas disponibles al inicio
  useEffect(() => {
    const loadAllStages = async () => {
      try {
        const { data: allStagesData, error } = await supabase
          .from("pipeline_stages")
          .select("*")
          .order("display_order", { ascending: true })

        if (error) {
          console.error("Error al cargar etapas:", error)
          return
        }

        if (allStagesData) {
          setAllStages(allStagesData)

          // Por defecto, seleccionar todas las etapas EXCEPTO Lost, Won y Freeze
          const defaultSelectedStages = allStagesData
            .filter((stage) => !["lost", "won", "freeze"].includes(stage.code.toLowerCase()))
            .map((stage) => stage.id)

          setSelectedStages(defaultSelectedStages)
        }
      } catch (error) {
        console.error("Error al cargar etapas:", error)
      }
    }

    loadAllStages()
  }, [])

  // Agrupar oportunidades por etapa y separar etapas especiales
  useEffect(() => {
    if (!propStages || propStages.length === 0) {
      // Si no se proporcionan etapas, extraerlas de las oportunidades
      const uniqueStages = Array.from(
        new Set(
          opportunities
            .filter((opp) => opp.stage)
            .map((opp) =>
              JSON.stringify({
                id: opp.pipeline_stage_id,
                code: opp.stage?.code || "unknown",
                display_order: opp.stage?.display_order || 0,
              }),
            ),
        ),
      ).map((stage) => JSON.parse(stage))

      // Ordenar las etapas por display_order
      uniqueStages.sort((a, b) => a.display_order - b.display_order)

      setStages(uniqueStages)
    } else {
      // Ordenar las etapas proporcionadas por display_order
      const sortedStages = [...propStages].sort((a, b) => a.display_order - b.display_order)
      setStages(sortedStages)
    }
  }, [opportunities, propStages])

  // Actualizar las etapas visibles basado en la selección del usuario
  useEffect(() => {
    if (allStages.length === 0) return

    // Filtrar las etapas seleccionadas
    const filteredStages = allStages.filter((stage) => selectedStages.includes(stage.id))

    // Ordenar por display_order
    filteredStages.sort((a, b) => a.display_order - b.display_order)

    // Actualizar las etapas visibles
    setVisibleStages(filteredStages)

    // Separar etapas regulares y especiales
    const special: Tables<"pipeline_stages">[] = []
    const regular: Tables<"pipeline_stages">[] = []

    filteredStages.forEach((stage) => {
      const isSpecial = SPECIAL_STAGES.includes(stage.code.toLowerCase())

      // Si es una etapa especial y queremos mostrarla como columna regular
      if (isSpecial) {
        regular.push(stage)
      } else {
        regular.push(stage)
      }

      // También mantener las etapas especiales para el área de arrastre
      if (isSpecial && showSpecialStagesInDragArea) {
        special.push(stage)
      }
    })

    setRegularStages(regular)
    setSpecialStages(special)

    console.log("Etapas visibles actualizadas:", filteredStages.length)
    console.log("Etapas regulares:", regular.length)
    console.log("Etapas especiales:", special.length)
  }, [allStages, selectedStages, showSpecialStagesInDragArea])

  // Aplicar filtros y ordenación
  useEffect(() => {
    let result = [...opportunities]

    // Aplicar búsqueda
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      result = result.filter(
        (opp) =>
          opp.title?.toLowerCase().includes(searchLower) ||
          opp.tech_company?.name?.toLowerCase().includes(searchLower) ||
          opp.partner?.name?.toLowerCase().includes(searchLower) ||
          opp.end_customer?.name?.toLowerCase().includes(searchLower),
      )
    }

    // Aplicar filtro de empresa tecnológica
    if (filterTechCompany && filterTechCompany !== "all") {
      result = result.filter((opp) => opp.tech_company_id === filterTechCompany)
    }

    // Aplicar filtro de partner
    if (filterPartner && filterPartner !== "all") {
      if (filterPartner === "no-partner") {
        result = result.filter((opp) => !opp.partner_id)
      } else {
        result = result.filter((opp) => opp.partner_id === filterPartner)
      }
    }

    // Aplicar filtro de responsable
    if (filterResponsible && filterResponsible !== "none") {
      result = result.filter((opp) => opp.assigned_to === filterResponsible)
    }

    // Aplicar filtro de validación
    if (filterValidation && filterValidation !== "all") {
      if (filterValidation === "unvalidated") {
        result = result.filter((opp) => opp.validation_status === "pending" || !opp.validation_status)
      } else if (filterValidation === "validated") {
        result = result.filter((opp) => opp.validation_status === "validated")
      }
    }

    // Aplicar filtro de oportunidades sin movimiento (estancadas)
    if (filterStagnant) {
      const stagnantDaysMs = stagnantDays * 24 * 60 * 60 * 1000
      const limitTime = Date.now() - stagnantDaysMs

      console.log("--- INICIO DE FILTRADO ---")
      console.log("Fecha límite (hace 20 días):", new Date(limitTime).toLocaleString())

      result = result.filter((opp: any) => {
        // 1. Recolectamos la fecha base
        const oppDate = new Date(opp.updated_at || opp.created_at || 0).getTime()

        // 2. Extraemos fechas de notas y tareas
        const noteDates = (opp.notes || []).map((n: any) => new Date(n.created_at || 0).getTime())
        const taskDates = (opp.tasks || []).map((t: any) => new Date(t.created_at || 0).getTime())

        // 3. Buscamos la más reciente de TODAS
        const lastActivityTime = Math.max(oppDate, ...noteDates, ...taskDates)

        const isStagnant = lastActivityTime < limitTime
        const isNotClosed = opp.stage?.code !== "Won" && opp.stage?.code !== "Lost"

        // --- LOGS DE CONTROL ---
        console.group(`Analizando Opp: ${opp.name}`)
        console.log("¿Tiene notas?:", opp.notes?.length || 0)
        if (noteDates.length > 0) {
          console.log("Fecha nota más nueva:", new Date(Math.max(...noteDates)).toLocaleString())
        }
        console.log("Actividad más reciente detectada (final):", new Date(lastActivityTime).toLocaleString())
        console.log("¿Es anterior al límite? (isStagnant):", isStagnant)
        console.log("¿Estado es abierto? (isNotClosed):", isNotClosed)
        console.log("RESULTADO FINAL: ", isStagnant && isNotClosed ? "SE QUEDA (Estancada)" : "SE ELIMINA (Activa o Cerrada)")
        console.groupEnd()
        // -----------------------

        return isStagnant && isNotClosed
      })
    }
    // Aplicar filtro de oportunidades antiguas
    if (filterOldOpportunities) {
      const oneEightyDaysAgo = new Date()
      oneEightyDaysAgo.setDate(oneEightyDaysAgo.getDate() - 180)

      // Usamos || 0 para que si created_at es null, TypeScript no se queje
      result = result.filter((opp) => new Date(opp.created_at || 0) < oneEightyDaysAgo)
    }

    // Aplicar filtro de sin valor estimado
    if (filterNoValue) {
      result = result.filter((opp) => !opp.estimated_value || opp.estimated_value === 0)
    }

    // Aplicar filtro de sin fecha de cierre
    if (filterNoCloseDate) {
      result = result.filter((opp) => !opp.estimated_close_date)
    }

    // Aplicar ordenación
    result.sort((a, b) => {
      let valueA, valueB

      switch (sortBy) {
        case "title":
          valueA = a.title || ""
          valueB = b.title || ""
          break
        case "value":
          valueA = a.estimated_value || 0
          valueB = b.estimated_value || 0
          break
        case "date":
          valueA = a.estimated_close_date ? new Date(a.estimated_close_date).getTime() : 0
          valueB = b.estimated_close_date ? new Date(b.estimated_close_date).getTime() : 0
          break
        default:
          valueA = a.title || ""
          valueB = b.title || ""
      }

      if (sortDirection === "asc") {
        return valueA > valueB ? 1 : -1
      } else {
        return valueA < valueB ? 1 : -1
      }
    })

    setFilteredOpportunities(result)
  }, [
    opportunities,
    searchTerm,
    filterTechCompany,
    filterPartner,
    filterResponsible,
    filterValidation,
    filterStagnant,
    filterOldOpportunities,
    filterNoValue,
    filterNoCloseDate,
    stagnantDays,
    sortBy,
    sortDirection,
  ])

  // Agrupar oportunidades cuando cambian las etapas o los filtros
  useEffect(() => {
    if (stages.length === 0) return

    const grouped: Record<string, OpportunityWithRelations[]> = {}
    const stats: Record<string, { count: number; value: number }> = {}

    // Inicializar todas las etapas con arrays vacíos
    stages.forEach((stage) => {
      grouped[stage.id] = []
      stats[stage.id] = { count: 0, value: 0 }
    })

    // Agrupar oportunidades por etapa
    filteredOpportunities.forEach((opportunity) => {
      const stageId = opportunity.pipeline_stage_id
      if (grouped[stageId]) {
        grouped[stageId].push(opportunity)

        // Actualizar estadísticas
        stats[stageId].count += 1
        stats[stageId].value += opportunity.estimated_value || 0
      }
    })

    setGroupedOpportunities(grouped)
    setStageStats(stats)
  }, [filteredOpportunities, stages])

  const formatStageCode = (code: string) => {
    if (!code) return "Sin etapa"
    return code.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  }

  // Función para manejar el inicio del arrastre
  const handleDragStart = (e: React.DragEvent, opportunityId: string) => {
    e.dataTransfer.setData("opportunityId", opportunityId)
    setDraggingId(opportunityId)
    // Añadir un efecto visual para indicar que el elemento es arrastrable
    e.dataTransfer.effectAllowed = "move"
  }

  // Función para manejar el evento de arrastrar sobre una columna
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  // Función para manejar el evento de soltar en una columna
  const handleDrop = async (e: React.DragEvent, targetStageId: string) => {
    e.preventDefault()
    const opportunityId = e.dataTransfer.getData("opportunityId")
    setDraggingId(null)

    // Verificar si la oportunidad ya está en esta etapa
    const opportunity = opportunities.find((opp) => opp.id === opportunityId)
    if (!opportunity || opportunity.pipeline_stage_id === targetStageId) {
      return
    }

    // Guardar el código de la etapa anterior para la nota
    const oldStage = stages.find((stage) => stage.id === opportunity.pipeline_stage_id)
    const newStage = stages.find((stage) => stage.id === targetStageId)

    if (!oldStage || !newStage) {
      toast({
        title: "Error",
        description: "No se pudo determinar las etapas para el cambio",
        variant: "destructive",
      })
      return
    }

    setIsUpdating(true)
    try {
      // Actualizar la etapa en la base de datos
      const { error } = await supabase
        .from("opportunities")
        .update({
          pipeline_stage_id: targetStageId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", opportunityId)

      if (error) throw error

      // Si hay un usuario actual, registrar el cambio en la reseña histórica
      if (currentUser) {
        // Usar el servicio de notas para crear la nota de cambio de etapa
        const noteResult = await createStageChangeNote(opportunityId, currentUser.id, oldStage.code, newStage.code)

        if (!noteResult) {
          console.error("No se pudo crear la nota de cambio de etapa")
        }
      }

      // Actualizar el estado local
      setOpportunities((prevOpportunities) =>
        prevOpportunities.map((opp) =>
          opp.id === opportunityId
            ? {
              ...opp,
              pipeline_stage_id: targetStageId,
              stage: newStage,
            }
            : opp,
        ),
      )

      toast({
        title: "Etapa actualizada",
        description: `La oportunidad ha sido movida a "${formatStageCode(newStage.code)}"`,
      })
    } catch (error) {
      console.error("Error al actualizar la etapa:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar la etapa de la oportunidad",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  // Función para manejar el evento de terminar el arrastre
  const handleDragEnd = () => {
    setDraggingId(null)
  }

  // Función para alternar la dirección de ordenación
  const toggleSortDirection = () => {
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
  }

  // Función para limpiar todos los filtros
  const clearFilters = () => {
    setSearchTerm("")
    setFilterTechCompany(null)
    setFilterPartner(null)
    setFilterResponsible(null)
    setFilterValidation(null)
    setSortBy("title")
    setSortDirection("asc")

    // Restablecer filtro de etapas al valor por defecto
    const defaultSelectedStages = allStages
      .filter((stage) => !["lost", "won", "freeze"].includes(stage.code.toLowerCase()))
      .map((stage) => stage.id)
    setSelectedStages(defaultSelectedStages)
  }

  // Función para crear una nueva oportunidad con una etapa preseleccionada
  const handleCreateOpportunity = (stageId: string) => {
    router.push(`/dashboard/opportunities/create?stage=${stageId}`)
  }

  // Obtener el icono para una etapa especial
  const getSpecialStageIcon = (code: string) => {
    const lowerCode = code.toLowerCase()
    if (lowerCode === "freeze") return <Snowflake className="h-5 w-5" />
    if (lowerCode === "won") return <ThumbsUp className="h-5 w-5" />
    if (lowerCode === "lost") return <ThumbsDown className="h-5 w-5" />
    return null
  }

  // Obtener el color para una etapa especial
  const getSpecialStageColor = (code: string) => {
    const lowerCode = code.toLowerCase()
    if (lowerCode === "freeze") return "bg-blue-100 border-blue-300 text-blue-700"
    if (lowerCode === "won") return "bg-green-100 border-green-300 text-green-700"
    if (lowerCode === "lost") return "bg-red-100 border-red-300 text-red-700"
    return ""
  }

  // Función para formatear el valor en dólares
  const formatDollarValue = (value: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  // Función para verificar si una oportunidad necesita atención
  const needsAttention = (opportunity: OpportunityWithRelations) => {
    const hasNoFutureTasks = opportunitiesWithoutTasks.has(opportunity.id)
    const hasNoEstimatedValue = !opportunity.estimated_value || opportunity.estimated_value <= 0
    return hasNoFutureTasks || hasNoEstimatedValue
  }

  // Función para obtener el mensaje del tooltip de atención
  const getAttentionTooltipMessage = (opportunity: OpportunityWithRelations) => {
    const hasNoFutureTasks = opportunitiesWithoutTasks.has(opportunity.id)
    const hasNoEstimatedValue = !opportunity.estimated_value || opportunity.estimated_value <= 0

    const messages = []
    if (hasNoFutureTasks) {
      messages.push(t("Sin tareas programadas") || "Sin tareas programadas")
    }
    if (hasNoEstimatedValue) {
      messages.push(t("Sin valor estimado") || "Sin valor estimado")
    }

    return messages.join(" • ")
  }

  // Renderizar tarjeta de oportunidad
  const renderOpportunityCard = (opportunity: OpportunityWithRelations) => {
    const validationStatus = opportunity.validation_status || "pending"
    const requiresAttention = needsAttention(opportunity)

    // Texto para el estado de validación
    let validationText = ""
    let validationClass = ""

    if (validationStatus === "pending") {
      validationText = t("Por validar") || "Por validar"
      validationClass = "text-yellow-600 text-xs font-medium"
    }

    const handleCardClick = (e: React.MouseEvent) => {
      if (e.ctrlKey || e.metaKey) {
        // Ctrl+Click (Windows/Linux) o Cmd+Click (Mac) = Nueva pestaña
        e.preventDefault()
        const url = `/dashboard/opportunities/${opportunity.id}`
        window.open(url, "_blank", "noopener,noreferrer")
      } else {
        // Click normal = Misma pestaña
        router.push(`/dashboard/opportunities/${opportunity.id}`)
      }
    }

    return (
      <div
        key={opportunity.id}
        className={`rounded-md border bg-card p-2 sm:p-3 shadow-sm cursor-pointer hover:shadow-md transition-all h-[140px] sm:h-[160px] flex flex-col ${draggingId === opportunity.id ? "opacity-50 border-dashed border-primary" : ""
          } ${requiresAttention ? "border-l-4 border-l-red-500" : ""}`}
        draggable
        onDragStart={(e) => handleDragStart(e, opportunity.id)}
        onDragEnd={handleDragEnd}
        onClick={handleCardClick}
        title="Click para abrir | Ctrl+Click para nueva pestaña"
      >
        <div className="flex flex-col h-full justify-between">
          {/* Cabecera con logos y estado de validación */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {opportunity.tech_company?.logo_url && (
                <div className="flex-shrink-0">
                  <ImageWithFallback
                    src={opportunity.tech_company.logo_url || "/placeholder.svg"}
                    alt={opportunity.tech_company.name || "Tech Company"}
                    width={20}
                    height={20}
                    className="rounded-sm object-contain"
                  />
                </div>
              )}
              {opportunity.partner?.logo_url && (
                <div className="flex-shrink-0">
                  <ImageWithFallback
                    src={opportunity.partner.logo_url || "/placeholder.svg"}
                    alt={opportunity.partner.name || "Partner"}
                    width={20}
                    height={20}
                    className="rounded-sm object-contain"
                  />
                </div>
              )}
            </div>

            {/* Mostrar texto "Por validar" solo para oportunidades pendientes */}
            {validationStatus === "pending" && <span className={validationClass}>{validationText}</span>}
          </div>

          {/* Título y descripción */}
          <div className="flex-grow">
            <h3 className="font-medium text-xs sm:text-sm line-clamp-2">
              {opportunity.title}
              {opportunity.end_customer && ` - ${opportunity.end_customer.name}`}
            </h3>
            {opportunity.end_customer && (
              <p className="text-xs text-muted-foreground mt-0.5 sm:mt-1 line-clamp-1">
                Cliente: {opportunity.end_customer.name}
              </p>
            )}

            {/* Añadir el país de la oportunidad */}
            {opportunity.country && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">País: {opportunity.country}</p>
            )}

            {/* Información de valor y fecha movida aquí, debajo del cliente final */}
            <div className="grid grid-cols-2 gap-2 text-xs mt-1">
              {opportunity.estimated_value ? (
                <div className="flex items-center">
                  <span className="font-medium">{formatDollarValue(opportunity.estimated_value)}</span>
                </div>
              ) : (
                <div></div>
              )}

              {opportunity.estimated_close_date ? (
                <div className="flex items-center justify-end">
                  <Calendar className="h-3 w-3 mr-1 text-muted-foreground" />
                  <span>{formatDate(opportunity.estimated_close_date)}</span>
                </div>
              ) : (
                <div></div>
              )}
            </div>
          </div>

          {/* Espacio para el icono de alerta, siempre a la derecha */}
          <div className="flex justify-end">
            {/* Icono de alerta para oportunidades que requieren atención */}
            {requiresAttention && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="bg-red-100 rounded-full p-1 animate-pulse">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{getAttentionTooltipMessage(opportunity)}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Función para renderizar una columna de etapa
  const renderStageColumn = (stage: Tables<"pipeline_stages">) => {
    const isSpecialStage = SPECIAL_STAGES.includes(stage.code.toLowerCase())

    return (
      <div key={stage.id} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, stage.id)}>
        <Card
          className={`h-full ${draggingId ? "border-dashed border-2 border-primary/30" : ""} transition-all ${isSpecialStage ? getSpecialStageColor(stage.code) : ""
            }`}
        >
          <CardHeader className="py-3 px-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isSpecialStage && getSpecialStageIcon(stage.code)}
                <CardTitle className="text-sm font-medium">{formatStageCode(stage.code)}</CardTitle>
                <Badge variant="outline" className="ml-1">
                  {groupedOpportunities[stage.id]?.length || 0}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                {stageStats[stage.id]?.value > 0 && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center text-xs font-medium text-muted-foreground">
                          <BarChart3 className="h-3.5 w-3.5 mr-1" />
                          {formatDollarValue(stageStats[stage.id].value)}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Valor total en esta etapa</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleCreateOpportunity(stage.id)}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Crear oportunidad en esta etapa</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="space-y-3 min-h-[200px]">
              {groupedOpportunities[stage.id]?.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 border border-dashed rounded-md text-center p-4">
                  <p className="text-sm text-muted-foreground">No hay oportunidades en esta etapa</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-xs"
                    onClick={() => handleCreateOpportunity(stage.id)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Añadir oportunidad
                  </Button>
                </div>
              ) : (
                groupedOpportunities[stage.id]?.map((opportunity) => renderOpportunityCard(opportunity))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="flex space-x-4 overflow-x-auto pb-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-80 flex-shrink-0">
              <Card>
                <CardHeader className="py-3">
                  <Skeleton className="h-6 w-40" />
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  <div className="space-y-3 min-h-[200px]">
                    {[1, 2, 3].map((j) => (
                      <Skeleton key={j} className="h-[160px] w-full" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (stages.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="h-12 w-12 mx-auto mb-4 text-muted-foreground">⚠️</div>
        <p className="text-lg font-medium">No hay etapas definidas</p>
        <p className="text-muted-foreground">
          No se pueden mostrar las oportunidades en el tablero Kanban sin etapas definidas.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Barra de herramientas */}
      <div className="flex flex-col gap-3 bg-muted/40 p-3 rounded-lg">
        {/* Barra única: search, filtros principales y contador */}
        <div className="flex gap-2 items-center flex-wrap">
          {/* Search */}
          <div className="relative w-56">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar oportunidades..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-9"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
                onClick={() => setSearchTerm("")}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          {/* Filtro de Tech Company */}
          <Select
            value={filterTechCompany || "all"}
            onValueChange={(value) => setFilterTechCompany(value === "all" ? null : value)}
          >
            <SelectTrigger className="w-40 h-9">
              <SelectValue placeholder="Tech Companies" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">TechCompanies</SelectItem>
              {techCompanies.map((company: any) => (
                <SelectItem key={company.id} value={company.id}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filtro de Partner */}
          <Select
            value={filterPartner || "all"}
            onValueChange={(value) => setFilterPartner(value === "all" ? null : value)}
          >
            <SelectTrigger className="w-40 h-9">
              <SelectValue placeholder="Partners" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Partners</SelectItem>
              <SelectItem value="no-partner">Sin Partner asociado</SelectItem>
              {partners.map((partner: any) => (
                <SelectItem key={partner.id} value={partner.id}>
                  {partner.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filtro de Responsable - solo si es Admin */}
          {userRoleDebug === "Admin" && (
            <Select
              value={filterResponsible || "none"}
              onValueChange={(value) => setFilterResponsible(value === "none" ? null : value)}
            >
              <SelectTrigger className="w-40 h-9">
                <SelectValue placeholder="Responsable" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Responsables</SelectItem>
                {scaleupUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.first_name} {user.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Botón de más filtros */}
          <Popover open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 bg-transparent">
                <Plus className="h-4 w-4 mr-1" />
                Filtros
                {(filterValidation ||
                  filterStagnant ||
                  filterOldOpportunities ||
                  filterNoValue ||
                  filterNoCloseDate ||
                  selectedStages.length < allStages.length ||
                  sortBy !== "title" ||
                  sortDirection !== "asc") && (
                    <Badge variant="secondary" className="ml-2 h-5 px-1">
                      {[
                        filterValidation ? 1 : 0,
                        filterStagnant ? 1 : 0,
                        filterOldOpportunities ? 1 : 0,
                        filterNoValue ? 1 : 0,
                        filterNoCloseDate ? 1 : 0,
                        selectedStages.length < allStages.length ? 1 : 0,
                        sortBy !== "title" || sortDirection !== "asc" ? 1 : 0,
                      ].reduce((a, b) => a + b, 0)}
                    </Badge>
                  )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <h4 className="font-medium">Filtros avanzados</h4>

                {/* Filtro de validación */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Estado de validación</label>
                  <Select
                    value={filterValidation || "all"}
                    onValueChange={(value) => setFilterValidation(value === "all" ? null : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas las oportunidades" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las oportunidades</SelectItem>
                      <SelectItem value="unvalidated">Sin validar</SelectItem>
                      <SelectItem value="validated">Validadas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Nuevos filtros de oportunidades problemáticas */}
                <div className="border-t pt-4 space-y-3">
                  <label className="text-sm font-semibold text-red-600">Filtros de Advertencia</label>

                  {/* Sin movimiento */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="filter-stagnant"
                        checked={filterStagnant}
                        onChange={(e) => setFilterStagnant(e.target.checked)}
                        className="cursor-pointer"
                      />
                      <label htmlFor="filter-stagnant" className="text-sm font-medium cursor-pointer">
                        Sin movimiento
                      </label>
                    </div>
                    {filterStagnant && (
                      <div className="space-y-1 ml-6">
                        <label className="text-xs text-gray-600">Días sin movimiento:</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            value={stagnantDays}
                            onChange={(e) => setStagnantDays(Math.max(1, parseInt(e.target.value) || 20))}
                            className="border rounded px-2 py-1 text-sm w-20"
                          />
                          <span className="text-xs text-gray-500">días</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Oportunidades antiguas */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filterOldOpportunities}
                        onChange={(e) => setFilterOldOpportunities(e.target.checked)}
                        className="cursor-pointer"
                      />
                      Oportunidades antiguas
                    </label>
                    <p className="text-xs text-gray-500 ml-6">Más de 180 días desde creación</p>
                  </div>

                  {/* Sin valor estimado */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filterNoValue}
                        onChange={(e) => setFilterNoValue(e.target.checked)}
                        className="cursor-pointer"
                      />
                      Sin valor estimado
                    </label>
                  </div>

                  {/* Sin fecha de cierre */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filterNoCloseDate}
                        onChange={(e) => setFilterNoCloseDate(e.target.checked)}
                        className="cursor-pointer"
                      />
                      Sin fecha de cierre
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Estados de oportunidades</label>
                  <div className="border rounded-md p-2 max-h-48 overflow-y-auto">
                    {allStages.map((stage) => (
                      <div key={stage.id} className="flex items-center space-x-2 mb-2">
                        <input
                          type="checkbox"
                          id={`stage-${stage.id}`}
                          checked={selectedStages.includes(stage.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStages([...selectedStages, stage.id])
                            } else {
                              setSelectedStages(selectedStages.filter((id) => id !== stage.id))
                            }
                          }}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <label htmlFor={`stage-${stage.id}`} className="text-sm">
                          {formatStageCode(stage.code)}
                          {SPECIAL_STAGES.includes(stage.code.toLowerCase()) && (
                            <span className="ml-1 text-xs text-muted-foreground">(Especial)</span>
                          )}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Ordenar por</label>
                  <div className="flex gap-2">
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="title">Título</SelectItem>
                        <SelectItem value="value">Valor</SelectItem>
                        <SelectItem value="date">Fecha de cierre</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" onClick={toggleSortDirection}>
                      <ArrowUpDown
                        className={`h-4 w-4 ${sortDirection === "desc" ? "rotate-180" : ""} transition-transform`}
                      />
                    </Button>
                  </div>
                </div>

                <div className="flex justify-between pt-2">
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Limpiar filtros
                  </Button>
                  <Button size="sm" onClick={() => setIsFiltersOpen(false)}>
                    Aplicar
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Contador de oportunidades */}
          <div className="text-sm text-muted-foreground ml-auto">
            {filteredOpportunities.length} de {opportunities.length} oportunidades
          </div>
        </div>
      </div>

      {/* Indicador de actualización */}
      {isUpdating && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 backdrop-blur-sm">
          <Card className="w-64 p-4 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-sm font-medium">Actualizando etapa...</p>
            </div>
          </Card>
        </div>
      )}

      {/* Tablero Kanban - Columnas regulares */}
      <div className="w-full">
        {/* Vista móvil - Selector de etapa */}
        <div className="block md:hidden mb-4">
          <Select value={activeStage || regularStages[0]?.id || ""} onValueChange={(value) => setActiveStage(value)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleccionar etapa" />
            </SelectTrigger>
            <SelectContent>
              {regularStages.map((stage) => (
                <SelectItem key={stage.id} value={stage.id}>
                  {formatStageCode(stage.code)} ({groupedOpportunities[stage.id]?.length || 0})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Mostrar solo la etapa activa en móvil */}
          {regularStages.filter((stage) => stage.id === activeStage).map((stage) => renderStageColumn(stage))}
        </div>

        {/* Vista desktop - Todas las columnas */}
        <div
          className="hidden md:grid"
          style={{
            gridTemplateColumns: `repeat(${regularStages.length}, minmax(300px, 1fr))`,
            gap: "1rem",
            overflowX: "auto",
          }}
        >
          {regularStages.map((stage) => renderStageColumn(stage))}
        </div>
      </div>

      {/* Área de etapas especiales (Freeze, Won, Lost) */}
      {specialStages.length > 0 && draggingId && (
        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t shadow-lg p-4 z-40">
          <div className="container mx-auto">
            <div className="flex justify-center gap-4">
              {specialStages.map((stage) => (
                <div
                  key={stage.id}
                  className={`flex-1 max-w-xs p-4 rounded-lg border-2 ${getSpecialStageColor(
                    stage.code,
                  )} flex flex-col items-center justify-center cursor-pointer transition-all hover:shadow-md ${draggingId ? "border-dashed" : ""
                    }`}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, stage.id)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {getSpecialStageIcon(stage.code)}
                    <span className="font-medium">{formatStageCode(stage.code)}</span>
                  </div>
                  <p className="text-xs text-center">Arrastra aquí para cambiar a {formatStageCode(stage.code)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OpportunitiesKanban
