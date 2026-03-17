"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  ChevronLeft,
  ChevronRight,
  Target,
  TrendingUp,
  TrendingDown,
  Users,
  Star,
  Plus,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
} from "lucide-react"
import FunnelVisual from "./funnel-visual"
import { AddCommitmentDialog } from "./add-commitment-dialog"
import { AddNoteDialog } from "./add-note-dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useTaskService } from "@/lib/services/task-service-client"
import { toast } from "sonner"

interface UserData {
  user: {
    id: string
    first_name: string
    last_name: string
    email: string
    profile_image?: string | null // Added profile_image field
  }
  funnel: Record<string, { count: number; value: number }>
  totalOpportunities: number
  totalValue: number
  partners: Array<{
    id: string
    name: string
    country: string
    techCompanyId: string
    techCompanyName: string
    opportunityCount: number
    lastActivity: string | null
    hasRecentActivity: boolean
  }>
  previousWeekCommitments: Array<{
    id: string
    title: string
    description: string | null
    due_date: string
    commitment_status: string | null
    comments: string | null
    tech_company_name: string | null
  }>
  currentWeekCommitments: Array<{
    id: string
    title: string
    description: string | null
    due_date: string
    tech_company_name: string | null
  }>
  conversionRate: number
  recentActivity: Array<{
    type: string
    description: string
    date: string
  }>
  kpis: {
    opportunitiesWithRecentActivity: number
    opportunitiesWithoutCloseDate: number
    opportunitiesWithoutValue: number
    opportunitiesStagnant: number
    opportunitiesOld: number
    opportunitiesWithCompleteData: number
    activePartners: number
    inactivePartners: number
    completedCommitments: number
    notCompletedCommitments: number
    totalPreviousCommitments: number
  }
}

interface UserStatusDashboardProps {
  meetingId?: string
}

export default function UserStatusDashboard({ meetingId }: UserStatusDashboardProps) {
  const [users, setUsers] = useState<UserData[]>([])
  const [currentUserIndex, setCurrentUserIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isCommitmentDialogOpen, setIsCommitmentDialogOpen] = useState(false)
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false)
  const [newPartnerFilter, setNewPartnerFilter] = useState<"all" | "true" | "false">("all")
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [commentText, setCommentText] = useState<string>("")
  const [individualTimer, setIndividualTimer] = useState(240)
  const [isIndividualTimerRunning, setIsIndividualTimerRunning] = useState(false)
  const taskService = useTaskService()

  useEffect(() => {
    const loadUserData = async () => {
      try {
        console.log("[v0] Loading user status data...")
        const response = await fetch(
          `/api/internal-meetings/user-status?meetingId=${meetingId || ""}&newPartnerFilter=${newPartnerFilter}`,
        )
        console.log("[v0] API response status:", response.status)

        if (response.ok) {
          const result = await response.json()
          console.log("[v0] API result:", result)

          if (result.success && Array.isArray(result.data) && result.data.length > 0) {
            console.log("[v0] Setting users data:", result.data.length, "users")
            setUsers(result.data)
          } else {
            console.error("[v0] Invalid API response structure:", result)
          }
        } else {
          console.error("[v0] API response not ok:", response.status)
        }
      } catch (error) {
        console.error("[v0] Error loading user status data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
  }, [meetingId, newPartnerFilter])

  useEffect(() => {
    setIsIndividualTimerRunning(true)
    setIndividualTimer(240) // Reset to 4 minutes when user changes
  }, [currentUserIndex])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isIndividualTimerRunning && individualTimer > 0) {
      interval = setInterval(() => {
        setIndividualTimer((time) => {
          if (time <= 1) {
            setIsIndividualTimerRunning(false)
            return 0
          }
          return time - 1
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isIndividualTimerRunning, individualTimer])

  const formatIndividualTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleNextUser = () => {
    if (currentUserIndex < users.length - 1) {
      setCurrentUserIndex(currentUserIndex + 1)
    }
  }

  const handlePrevUser = () => {
    if (currentUserIndex > 0) {
      setCurrentUserIndex(currentUserIndex - 1)
    }
  }

  const handleCommitmentStatusUpdate = async (taskId: string, status: string, comments?: string) => {
    try {
      console.log(`[v0] Updating commitment ${taskId} to status: ${status}`)

      const updateData: any = {
        commitment_status: status,
        comments: comments || null,
      }

      // Add meeting reference if available
      if (meetingId) {
        updateData.reviewed_in_meeting_id = meetingId
      }

      const updatedTask = await taskService.updateTask(taskId, updateData)

      if (updatedTask) {
        console.log("[v0] Commitment updated successfully:", updatedTask)
        toast.success("Estado del compromiso actualizado")

        // Clear editing state
        setEditingCommentId(null)
        setCommentText("")

        // Reload user data to reflect changes
        const reloadResponse = await fetch(
          `/api/internal-meetings/user-status?meetingId=${meetingId || ""}&newPartnerFilter=${newPartnerFilter}`,
        )
        if (reloadResponse.ok) {
          const result = await reloadResponse.json()
          if (result.success && Array.isArray(result.data)) {
            setUsers(result.data)
          }
        }
      } else {
        console.error("[v0] updateTask returned null")
        toast.error("Error al actualizar el estado del compromiso")
      }
    } catch (error) {
      console.error("[v0] Error updating commitment status:", error)
      toast.error("Error al actualizar el estado del compromiso")
    }
  }

  const handleStatusButtonClick = (taskId: string, status: string) => {
    if (editingCommentId === taskId) {
      handleCommitmentStatusUpdate(taskId, status, commentText)
    } else {
      setEditingCommentId(taskId)
      setCommentText("")
    }
  }

  const calculateFunnelHealth = (funnelData: any[]) => {
    const generacion = funnelData.find((stage) => stage.name === "Generación")?.count || 0
    const desarrollo = funnelData.find((stage) => stage.name === "Desarrollo")?.count || 0
    const propuesta = funnelData.find((stage) => stage.name === "Propuesta")?.count || 0
    const cierre = funnelData.find((stage) => stage.name === "Cierre")?.count || 0

    return generacion >= desarrollo && desarrollo >= propuesta && propuesta >= cierre && generacion > 0
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium">Cargando status individual...</div>
        </div>
      </div>
    )
  }

  if (!Array.isArray(users) || users.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium">No hay usuarios BDD activos</div>
        </div>
      </div>
    )
  }

  const currentUser = users[currentUserIndex]

  if (!currentUser || !currentUser.user) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium">Error: Datos de usuario incompletos</div>
        </div>
      </div>
    )
  }

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
    const count = group.stages.reduce((sum, stage) => sum + (currentUser.funnel[stage]?.count || 0), 0)
    const value = group.stages.reduce((sum, stage) => sum + (currentUser.funnel[stage]?.value || 0), 0)

    return {
      name: group.name,
      count,
      value,
      color: group.color,
    }
  })

  const getCommitmentStatusBadge = (status: string | null) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-700 border-green-300">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Cumplido
          </Badge>
        )
      case "not_completed":
        return (
          <Badge className="bg-red-100 text-red-700 border-red-300">
            <XCircle className="h-3 w-3 mr-1" />
            No cumplido
          </Badge>
        )
      case "partial":
        return (
          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">
            <AlertCircle className="h-3 w-3 mr-1" />
            Parcial
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-gray-100">
            Pendiente
          </Badge>
        )
    }
  }

  const partnersByTechCompany =
    currentUser.partners?.reduce(
      (acc, partner) => {
        if (!acc[partner.techCompanyName]) {
          acc[partner.techCompanyName] = []
        }
        acc[partner.techCompanyName].push(partner)
        return acc
      },
      {} as Record<string, typeof currentUser.partners>,
    ) || {}

  const kpiExplanations = {
    healthyPipeline:
      "El funnel tiene más oportunidades en etapas tempranas que en tardías (Generación ≥ Desarrollo ≥ Propuesta ≥ Cierre)",
    manyOpportunities: "Hay más de 10 oportunidades activas en el pipeline",
    goodConversion: "La tasa de conversión es superior al 20%",
    recentActivity: "Oportunidades actualizadas en los últimos 7 días, indicando gestión activa del pipeline",
    completeData: "Oportunidades con valor estimado Y fecha de cierre definidos, facilitando el forecast",
    activePartners: "Partners con actividad reciente (oportunidades o tareas en los últimos 30 días)",
    completedCommitments: "Porcentaje de compromisos de la semana anterior marcados como cumplidos",
    unhealthyPipeline:
      "El funnel tiene más oportunidades en etapas tardías que en tempranas, lo que indica falta de prospección",
    noPartners: "No hay partners asignados a este usuario",
    lowConversion: "La tasa de conversión es inferior al 10%, lo que indica problemas en el cierre de oportunidades",
    noCloseDate: "Oportunidades sin fecha estimada de cierre, dificultando el forecast y seguimiento",
    noValue: "Oportunidades sin valor estimado, impidiendo calcular el pipeline value correctamente",
    stagnant: "Oportunidades sin movimiento por más de 30 días, requieren atención urgente",
    old: "Oportunidades creadas hace más de 30 días sin cerrar, posible señal de estancamiento",
    notCompletedCommitments: "Porcentaje de compromisos de la semana anterior no cumplidos",
    inactivePartners: "Partners asignados sin actividad en los últimos 30 días, requieren reactivación",
  }

  return (
    <div className="h-full p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            {currentUser.user.profile_image ? (
              <AvatarImage
                src={currentUser.user.profile_image || "/placeholder.svg"}
                alt={`${currentUser.user.first_name} ${currentUser.user.last_name}`}
              />
            ) : null}
            <AvatarFallback>
              {currentUser.user.first_name[0]}
              {currentUser.user.last_name[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-4">
              <h2 className="text-3xl font-bold">
                {currentUser.user.first_name} {currentUser.user.last_name}
              </h2>
              <div className="text-2xl font-bold text-blue-600">{formatIndividualTime(individualTimer)}</div>
            </div>
            <Badge variant="outline" className="mt-2">
              {currentUserIndex + 1} de {users.length} usuarios
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => setIsNoteDialogOpen(true)} variant="outline" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Agregar Nota
          </Button>
          <Button onClick={() => setIsCommitmentDialogOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Agregar Compromiso
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left Column - Funnel and Partners */}
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
                  <span>{currentUser.totalOpportunities || 0} oportunidades</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Valor:</span>
                  <span>${(currentUser.totalValue || 0).toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Partners Asignados ({currentUser.partners?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentUser.partners && currentUser.partners.length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(partnersByTechCompany).map(([techCompanyName, partners]) => (
                    <div key={techCompanyName} className="space-y-2">
                      <div className="bg-blue-50 border-l-4 border-blue-500 px-3 py-2 rounded">
                        <div className="font-semibold text-sm text-blue-900">{techCompanyName}</div>
                        <div className="text-xs text-blue-700 mt-0.5">{partners.length} partner(s)</div>
                      </div>

                      <div className="space-y-1 pl-2">
                        <div className="grid grid-cols-3 gap-2 pb-2 border-b border-gray-200 text-xs font-medium text-gray-600">
                          <span>Nombre</span>
                          <span className="text-center">País</span>
                          <span className="text-center">Oportunidades</span>
                        </div>
                        {partners.map((partner) => (
                          <div
                            key={partner.id}
                            className="grid grid-cols-3 gap-2 py-2 border-b border-gray-100 last:border-0"
                          >
                            <div className="font-medium text-sm truncate">{partner.name}</div>
                            <div className="text-center text-xs text-gray-600">{partner.country || "-"}</div>
                            <div className="text-center">
                              <Badge variant="outline" className="px-2 py-1 text-xs">
                                {partner.opportunityCount || 0}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500 text-center py-4">No hay partners asignados</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Tasa de Conversión
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600">{currentUser.conversionRate.toFixed(1)}%</div>
                <p className="text-sm text-gray-600 mt-2">Oportunidades cerradas vs manejadas</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Center Column - Commitments */}
        <div className="col-span-4 space-y-6">
          {/* Previous week commitments card */}
          <Card className="border-yellow-200">
            <CardHeader className="bg-yellow-50">
              <CardTitle className="flex items-center gap-2 text-yellow-700">
                <CheckCircle2 className="h-5 w-5" />
                Compromisos Semana Anterior
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {currentUser.previousWeekCommitments && currentUser.previousWeekCommitments.length > 0 ? (
                <div className="space-y-4">
                  {currentUser.previousWeekCommitments.map((commitment) => (
                    <div key={commitment.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{commitment.title}</div>
                          {commitment.tech_company_name && (
                            <div className="text-xs text-gray-500 mt-1">{commitment.tech_company_name}</div>
                          )}
                        </div>
                        {getCommitmentStatusBadge(commitment.commitment_status)}
                      </div>
                      {commitment.description && <p className="text-xs text-gray-600">{commitment.description}</p>}
                      {commitment.comments && (
                        <div className="bg-gray-50 rounded p-2 text-xs text-gray-700">
                          <span className="font-medium">Comentarios:</span> {commitment.comments}
                        </div>
                      )}
                      {editingCommentId === commitment.id && (
                        <div className="space-y-2">
                          <Textarea
                            placeholder="Agregar comentario sobre el estado del compromiso..."
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            className="min-h-[60px] text-xs"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-7 bg-transparent"
                              onClick={() => {
                                setEditingCommentId(null)
                                setCommentText("")
                              }}
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      )}
                      <div className="flex gap-2 mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7 bg-transparent"
                          onClick={() => handleStatusButtonClick(commitment.id, "completed")}
                        >
                          {editingCommentId === commitment.id ? "Guardar como Cumplido" : "Cumplido"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7 bg-transparent"
                          onClick={() => handleStatusButtonClick(commitment.id, "partial")}
                        >
                          {editingCommentId === commitment.id ? "Guardar como Parcial" : "Parcial"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7 bg-transparent"
                          onClick={() => handleStatusButtonClick(commitment.id, "not_completed")}
                        >
                          {editingCommentId === commitment.id ? "Guardar como No cumplido" : "No cumplido"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500 text-center py-4">No hay compromisos de la semana anterior</div>
              )}
            </CardContent>
          </Card>

          {/* Current week commitments card */}
          <Card className="border-blue-200">
            <CardHeader className="bg-blue-50">
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <CheckCircle2 className="h-5 w-5" />
                Compromisos de Esta Semana
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {currentUser.currentWeekCommitments && currentUser.currentWeekCommitments.length > 0 ? (
                <div className="space-y-4">
                  {currentUser.currentWeekCommitments.map((commitment) => (
                    <div key={commitment.id} className="border rounded-lg p-3 space-y-2 bg-blue-50/50">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{commitment.title}</div>
                          {commitment.tech_company_name && (
                            <div className="text-xs text-gray-500 mt-1">{commitment.tech_company_name}</div>
                          )}
                        </div>
                        <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                          Nuevo
                        </Badge>
                      </div>
                      {commitment.description && <p className="text-xs text-gray-600">{commitment.description}</p>}
                      <div className="text-xs text-gray-500">
                        Vencimiento: {new Date(commitment.due_date).toLocaleDateString("es-ES")}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500 text-center py-4">No hay compromisos asumidos esta semana</div>
              )}
            </CardContent>
          </Card>

          <Card className="border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <Star className="h-5 w-5" />
                Oportunidades a Revisar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm text-gray-600">
                <div className="border-l-4 border-blue-500 pl-3 py-2 bg-blue-50 rounded">
                  <p className="font-medium text-blue-900 mb-2">Funcionalidad en desarrollo</p>
                  <p className="text-xs">
                    Esta sección permitirá marcar oportunidades específicas para revisar en la próxima reunión.
                  </p>
                </div>
                <div className="space-y-2 text-xs">
                  <p className="font-medium">Características planificadas:</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    <li>Oportunidades más calientes (etapa avanzada, valor alto, actividad reciente)</li>
                    <li>Oportunidades más frías (sin actividad +30 días, estancadas)</li>
                    <li>Marcar oportunidades manualmente para revisión</li>
                    <li>Historial de oportunidades revisadas por reunión</li>
                  </ul>
                </div>
                <div className="bg-gray-50 rounded p-3 text-xs">
                  <p className="font-medium mb-1">Implementación técnica:</p>
                  <p className="text-gray-600">
                    Se creará una tabla <code className="bg-white px-1 rounded">meeting_opportunity_reviews</code> para
                    vincular oportunidades con reuniones y mantener un historial completo de revisiones.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Activity and Metrics */}
        <div className="col-span-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Actividad Reciente
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentUser.recentActivity && currentUser.recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {currentUser.recentActivity.map((activity, index) => (
                    <div key={index} className="flex gap-3 pb-3 border-b border-gray-100 last:border-0">
                      <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{activity.description}</div>
                        <div className="text-xs text-gray-500 mt-1">{activity.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500 text-center py-4">No hay actividad reciente</div>
              )}
            </CardContent>
          </Card>

          <Card className="border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <TrendingUp className="h-5 w-5" />
                Lo Bueno
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <TooltipProvider>
                <div className="space-y-4">
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
                  {(currentUser.totalOpportunities || 0) > 10 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex justify-between items-center cursor-help">
                          <span className="text-sm">Buena cantidad de oportunidades</span>
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
                  {currentUser.conversionRate > 20 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex justify-between items-center cursor-help">
                          <span className="text-sm">Buena tasa de conversión</span>
                          <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                            ✓
                          </Badge>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">{kpiExplanations.goodConversion}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {currentUser.kpis.opportunitiesWithRecentActivity > 0 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex justify-between items-center cursor-help">
                          <span className="text-sm">Oportunidades con actividad reciente</span>
                          <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                            {currentUser.kpis.opportunitiesWithRecentActivity}
                          </Badge>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">{kpiExplanations.recentActivity}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {currentUser.kpis.opportunitiesWithCompleteData > 0 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex justify-between items-center cursor-help">
                          <span className="text-sm">Oportunidades con datos completos</span>
                          <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                            {currentUser.kpis.opportunitiesWithCompleteData}
                          </Badge>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">{kpiExplanations.completeData}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {currentUser.kpis.activePartners > 0 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex justify-between items-center cursor-help">
                          <span className="text-sm">Partners activos</span>
                          <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                            {currentUser.kpis.activePartners}
                          </Badge>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">{kpiExplanations.activePartners}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {currentUser.kpis.totalPreviousCommitments > 0 &&
                    currentUser.kpis.completedCommitments / currentUser.kpis.totalPreviousCommitments >= 0.7 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex justify-between items-center cursor-help">
                            <span className="text-sm">Compromisos cumplidos</span>
                            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                              {Math.round(
                                (currentUser.kpis.completedCommitments / currentUser.kpis.totalPreviousCommitments) *
                                  100,
                              )}
                              %
                            </Badge>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">{kpiExplanations.completedCommitments}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  {!calculateFunnelHealth(funnelData) &&
                    (currentUser.totalOpportunities || 0) <= 10 &&
                    currentUser.conversionRate <= 20 &&
                    currentUser.kpis.opportunitiesWithRecentActivity === 0 &&
                    currentUser.kpis.opportunitiesWithCompleteData === 0 &&
                    currentUser.kpis.activePartners === 0 &&
                    (currentUser.kpis.totalPreviousCommitments === 0 ||
                      currentUser.kpis.completedCommitments / currentUser.kpis.totalPreviousCommitments < 0.7) && (
                      <div className="text-sm text-gray-500 text-center py-4">No hay métricas positivas destacadas</div>
                    )}
                </div>
              </TooltipProvider>
            </CardContent>
          </Card>

          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <TrendingDown className="h-5 w-5" />
                Lo Malo
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <TooltipProvider>
                <div className="space-y-4">
                  {!calculateFunnelHealth(funnelData) && (currentUser.totalOpportunities || 0) > 0 && (
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
                  {(currentUser.partners?.length || 0) === 0 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex justify-between items-center cursor-help">
                          <span className="text-sm">Sin partners asignados</span>
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
                  {currentUser.conversionRate < 10 && (currentUser.totalOpportunities || 0) > 5 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex justify-between items-center cursor-help">
                          <span className="text-sm">Baja tasa de conversión</span>
                          <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
                            ⚠
                          </Badge>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">{kpiExplanations.lowConversion}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {currentUser.kpis.opportunitiesWithoutCloseDate > 0 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex justify-between items-center cursor-help">
                          <span className="text-sm">Oportunidades sin fecha de cierre</span>
                          <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
                            {currentUser.kpis.opportunitiesWithoutCloseDate}
                          </Badge>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">{kpiExplanations.noCloseDate}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {currentUser.kpis.opportunitiesWithoutValue > 0 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex justify-between items-center cursor-help">
                          <span className="text-sm">Oportunidades sin valor estimado</span>
                          <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
                            {currentUser.kpis.opportunitiesWithoutValue}
                          </Badge>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">{kpiExplanations.noValue}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {currentUser.kpis.opportunitiesStagnant > 0 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex justify-between items-center cursor-help">
                          <span className="text-sm">Oportunidades estancadas</span>
                          <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
                            {currentUser.kpis.opportunitiesStagnant}
                          </Badge>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">{kpiExplanations.stagnant}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {currentUser.kpis.opportunitiesOld > 0 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex justify-between items-center cursor-help">
                          <span className="text-sm">Oportunidades antiguas</span>
                          <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
                            {currentUser.kpis.opportunitiesOld}
                          </Badge>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">{kpiExplanations.old}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {currentUser.kpis.totalPreviousCommitments > 0 &&
                    currentUser.kpis.notCompletedCommitments / currentUser.kpis.totalPreviousCommitments >= 0.3 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex justify-between items-center cursor-help">
                            <span className="text-sm">Compromisos no cumplidos</span>
                            <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
                              {Math.round(
                                (currentUser.kpis.notCompletedCommitments / currentUser.kpis.totalPreviousCommitments) *
                                  100,
                              )}
                              %
                            </Badge>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">{kpiExplanations.notCompletedCommitments}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  {currentUser.kpis.inactivePartners > 0 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex justify-between items-center cursor-help">
                          <span className="text-sm">Partners inactivos</span>
                          <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
                            {currentUser.kpis.inactivePartners}
                          </Badge>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">{kpiExplanations.inactivePartners}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {calculateFunnelHealth(funnelData) &&
                    (currentUser.partners?.length || 0) > 0 &&
                    (currentUser.conversionRate >= 10 || (currentUser.totalOpportunities || 0) <= 5) &&
                    currentUser.kpis.opportunitiesWithoutCloseDate === 0 &&
                    currentUser.kpis.opportunitiesWithoutValue === 0 &&
                    currentUser.kpis.opportunitiesStagnant === 0 &&
                    currentUser.kpis.opportunitiesOld === 0 &&
                    currentUser.kpis.inactivePartners === 0 &&
                    (currentUser.kpis.totalPreviousCommitments === 0 ||
                      currentUser.kpis.notCompletedCommitments / currentUser.kpis.totalPreviousCommitments < 0.3) && (
                      <div className="text-sm text-green-500 text-center py-4">¡No hay problemas detectados!</div>
                    )}
                </div>
              </TooltipProvider>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Dedicación por TechCompany (últimas 4 semanas)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-500 text-center py-4">Fórmula de cálculo por definir</div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex items-center justify-between mt-6 pt-4 border-t">
        <Button
          variant="outline"
          onClick={handlePrevUser}
          disabled={currentUserIndex === 0}
          className="flex items-center gap-2 bg-transparent"
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </Button>

        <div className="flex gap-2">
          {users.map((_, index) => (
            <div
              key={index}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentUserIndex ? "bg-blue-600 scale-125" : "bg-gray-300"
              }`}
            />
          ))}
        </div>

        <Button
          variant="outline"
          onClick={handleNextUser}
          disabled={currentUserIndex === users.length - 1}
          className="flex items-center gap-2 bg-transparent"
        >
          Siguiente
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <AddCommitmentDialog
        isOpen={isCommitmentDialogOpen}
        onClose={() => setIsCommitmentDialogOpen(false)}
        userId={currentUser.user.id}
        userName={`${currentUser.user.first_name} ${currentUser.user.last_name}`}
        meetingId={meetingId}
        onSuccess={async () => {
          console.log("[v0] Compromiso creado, refrescando dashboard...")
          try {
            const response = await fetch(
              `/api/internal-meetings/user-status?meetingId=${meetingId || ""}&newPartnerFilter=${newPartnerFilter}`,
            )
            if (response.ok) {
              const result = await response.json() // Fixed: Changed reloadResponse.json() to response.json()
              if (result.success && Array.isArray(result.data)) {
                setUsers(result.data)
                console.log("[v0] Dashboard refrescado exitosamente")
              }
            }
          } catch (error) {
            console.error("[v0] Error al refrescar dashboard:", error)
          }
        }}
      />

      <AddNoteDialog
        isOpen={isNoteDialogOpen}
        onClose={() => setIsNoteDialogOpen(false)}
        userId={currentUser.user.id}
        userName={`${currentUser.user.first_name} ${currentUser.user.last_name}`}
        meetingId={meetingId}
        onSuccess={() => {
          console.log("[v0] Nota creada exitosamente")
          toast.success("Nota agregada exitosamente")
        }}
      />
    </div>
  )
}
