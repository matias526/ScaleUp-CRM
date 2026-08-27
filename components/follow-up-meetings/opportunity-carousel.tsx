"use client"

import { useState, useRef, useEffect } from "react"
import { useTranslations } from "@/hooks/use-translations"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  FileText,
  CheckCircle2,
  Clock,
  Building,
  Plus,
  TrendingUp,
  AlertCircle,
  MapPin,
  Tag,
  Edit,
  MessageSquare,
  ClipboardList,
  X,
  CircleSlash,
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { AddNoteDialog } from "./add-note-dialog"
import { AddTaskDialog } from "./add-task-dialog"
import { EditOpportunityDialog } from "./edit-opportunity-dialog"
import { useToast } from "@/components/ui/use-toast"
import { addNoteToOpportunity, addTaskToOpportunity } from "@/lib/services/follow-up-meeting-service"
import { useAuth } from "@/components/auth/auth-provider"
import { getCountryName, getDaysSince } from "@/lib/utils/country-utils"
import { supabase } from "@/lib/supabase/client"
import { OpportunityChecklist } from "@/components/opportunities/opportunity-checklist"

type OpportunityCarouselProps = {
  opportunities: any[]
  onReview?: (opportunityId: string) => void
  reviewedOpportunities?: string[]
  partnerLogo?: string | null
  techCompanyLogo?: string | null
  onDataChange?: () => void
  hideNavigation?: boolean
  hideReviewButton?: boolean
  showCloseButton?: boolean
  onClose?: () => void
}

export function OpportunityCarousel({
  opportunities,
  onReview = () => {},
  reviewedOpportunities = [],
  partnerLogo = null,
  techCompanyLogo = null,
  onDataChange,
  hideNavigation = false,
  hideReviewButton = false,
  showCloseButton = false,
  onClose,
}: OpportunityCarouselProps) {
  const { t, language } = useTranslations()
  const { toast } = useToast()
  const [isMarkingLost, setIsMarkingLost] = useState(false)
  const lostStageId = "c4d86f83-5dba-4db2-83e0-c96831e5c8b9"
  const markAsLostLabel = language === "en" ? "Mark as lost" : language === "pt" ? "Passar para perdida" : "Pasar a perdida"
  const { userInfo } = useAuth()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAddNote, setShowAddNote] = useState(false)
  const [showAddTask, setShowAddTask] = useState(false)
  const [showEditOpportunity, setShowEditOpportunity] = useState(false)
  const [currentOpportunity, setCurrentOpportunity] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [partnerUsers, setPartnerUsers] = useState<any[]>([])
  const [techFields, setTechFields] = useState<any[]>([])
  const [partnerResponsible, setPartnerResponsible] = useState<any>(null)
  const [isLoadingPartnerResponsible, setIsLoadingPartnerResponsible] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMarkAsLost = async () => {
    if (!currentOpportunity || isMarkingLost || currentOpportunity.pipeline_stage_id === lostStageId) return
    setIsMarkingLost(true)
    const { error } = await supabase.from("opportunities").update({ pipeline_stage_id: lostStageId }).eq("id", currentOpportunity.id)
    setIsMarkingLost(false)
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
      return
    }
    setCurrentOpportunity((current: any) => current ? { ...current, pipeline_stage_id: lostStageId } : current)
    toast({ title: markAsLostLabel, description: language === "en" ? "Opportunity moved to Lost." : language === "pt" ? "A oportunidade foi movida para Perdida." : "La oportunidad fue pasada a Perdida." })
    onDataChange?.()
  }

  // Cargar el responsable del partner cuando cambia la oportunidad actual
  useEffect(() => {
    const loadPartnerResponsible = async () => {
      if (currentOpportunity?.partner_responsible_id) {
        setIsLoadingPartnerResponsible(true)
        try {
          console.log(`Cargando responsable del partner: ${currentOpportunity.partner_responsible_id}`)
          const { data, error } = await supabase
            .from("users")
            .select("id, first_name, last_name, email, role_id")
            .eq("id", currentOpportunity.partner_responsible_id)
            .single()

          if (error) {
            console.error(`Error al cargar responsable del partner: ${error.message}`)
            setPartnerResponsible(null)
          } else {
            console.log(`Responsable del partner cargado: ${data?.id}`)
            setPartnerResponsible(data)
          }
        } catch (error) {
          console.error(`Error al cargar responsable del partner: ${error}`)
          setPartnerResponsible(null)
        } finally {
          setIsLoadingPartnerResponsible(false)
        }
      } else {
        setPartnerResponsible(null)
      }
    }

    if (currentOpportunity) {
      loadPartnerResponsible()
    }
  }, [currentOpportunity, supabase])

  // Actualizar la oportunidad actual cuando cambia el índice
  useEffect(() => {
    if (opportunities && opportunities.length > 0 && currentIndex < opportunities.length) {
      setCurrentOpportunity(opportunities[currentIndex])
    }
  }, [opportunities, currentIndex])

  // Asegurarse de que hay oportunidades disponibles
  if (!opportunities || opportunities.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-gray-500">{t("follow_up_meeting.no_opportunities", "No hay oportunidades disponibles")}</p>
      </Card>
    )
  }

  if (!currentOpportunity) {
    setCurrentOpportunity(opportunities[0])
    return null
  }

  const prevOpportunity = currentIndex > 0 ? opportunities[currentIndex - 1] : null
  const nextOpportunity = currentIndex < opportunities.length - 1 ? opportunities[currentIndex + 1] : null

  // Asegurarse de que reviewedOpportunities es un array
  const isReviewed = currentOpportunity ? reviewedOpportunities.includes(currentOpportunity.id) : false

  // Determinar si la oportunidad ha tenido cambios recientes (última semana)
  const hasRecentChanges = (opportunity: any) => {
    if (!opportunity || !opportunity.updated_at) return false

    const lastWeek = new Date()
    lastWeek.setDate(lastWeek.getDate() - 7)
    return new Date(opportunity.updated_at) > lastWeek
  }

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const goToNext = () => {
    if (currentIndex < opportunities.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const handleReview = () => {
    if (currentOpportunity && onReview) {
      onReview(currentOpportunity.id)
    }
  }

  const handleClose = () => {
    if (onClose) {
      onClose()
    }
  }

  // Formatear fecha
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No definida"
    try {
      return format(new Date(dateString), "dd MMM yyyy", { locale: es })
    } catch (error) {
      return "Fecha inválida"
    }
  }

  // Obtener el nombre del cliente final
  const getEndCustomerName = () => {
    if (!currentOpportunity) return ""

    if (currentOpportunity.end_customer && typeof currentOpportunity.end_customer === "object") {
      return currentOpportunity.end_customer.name
    }

    if (currentOpportunity.end_customer_name) {
      return currentOpportunity.end_customer_name
    }

    return "Cliente no especificado"
  }

  // Manejar la creación de una nueva nota
  const handleAddNote = async (noteData: { content: string; is_private: boolean }) => {
    if (!currentOpportunity || !userInfo?.id) {
      toast({
        title: "Error",
        description: "No se pudo añadir la nota. Información de usuario o oportunidad no disponible.",
        variant: "destructive",
      })
      return false
    }

    try {
      await addNoteToOpportunity({
        opportunity_id: currentOpportunity.id,
        user_id: userInfo.id,
        content: noteData.content,
        is_private: noteData.is_private,
      })

      toast({
        title: "Nota añadida",
        description: "La nota se ha añadido correctamente.",
      })

      // Actualizar datos si es necesario
      if (onDataChange) {
        onDataChange()
      }

      return true
    } catch (error) {
      console.error("Error al añadir nota:", error)
      toast({
        title: "Error",
        description: "No se pudo añadir la nota. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      })
      return false
    }
  }

  // Calcular días desde la creación y última actualización
  const daysSinceCreation = getDaysSince(currentOpportunity.created_at)
  const daysSinceUpdate = getDaysSince(currentOpportunity.updated_at)

  // Función para truncar texto
  const truncateText = (text: string, maxLength: number) => {
    if (!text) return ""
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text
  }

  // Función para obtener el valor formateado de un campo técnico
  const getFieldValue = (field: any) => {
    if (!field) return "No especificado"

    // Verificar el tipo de campo y mostrar el valor correspondiente
    if (field.value_text !== null && field.value_text !== undefined) {
      return field.value_text || "No especificado"
    }

    if (field.value_numeric !== null && field.value_numeric !== undefined) {
      return field.value_numeric.toString()
    }

    if (field.value_boolean !== null && field.value_boolean !== undefined) {
      return field.value_boolean ? "Sí" : "No"
    }

    if (field.value_date) {
      return formatDate(field.value_date)
    }

    if (field.value_json) {
      try {
        const jsonValue = typeof field.value_json === "string" ? JSON.parse(field.value_json) : field.value_json
        return JSON.stringify(jsonValue)
      } catch (e) {
        return "Valor JSON inválido"
      }
    }

    return "No especificado"
  }

  // Función para actualizar el estado de una tarea
  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const { error } = await supabase.from("tasks").update({ status: newStatus }).eq("id", taskId)

      if (error) throw error

      toast({
        title: "Estado actualizado",
        description: `La tarea se ha marcado como ${
          newStatus === "completed"
            ? "completada"
            : newStatus === "in_progress"
              ? "en progreso"
              : newStatus === "cancelled"
                ? "cancelada"
                : "pendiente"
        }.`,
      })

      // Actualizar datos si es necesario
      if (onDataChange) {
        onDataChange()
      }
    } catch (error) {
      console.error("Error al actualizar estado de tarea:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de la tarea.",
        variant: "destructive",
      })
    }
  }

  // Función para obtener los botones de estado según el estado actual
  const getStatusButtons = (task: any) => {
    const currentStatus = task.status

    switch (currentStatus) {
      case "pending":
        return (
          <div className="flex gap-1 mt-2">
            <Button
              size="sm"
              variant="outline"
              className="h-6 px-2 text-xs bg-transparent"
              onClick={() => updateTaskStatus(task.id, "in_progress")}
            >
              Iniciar
            </Button>
            <Button
              size="sm"
              variant="default"
              className="h-6 px-2 text-xs bg-green-600 hover:bg-green-700"
              onClick={() => updateTaskStatus(task.id, "completed")}
            >
              Completar
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="h-6 px-2 text-xs"
              onClick={() => updateTaskStatus(task.id, "cancelled")}
            >
              Cancelar
            </Button>
          </div>
        )
      case "in_progress":
        return (
          <div className="flex gap-1 mt-2">
            <Button
              size="sm"
              variant="default"
              className="h-6 px-2 text-xs bg-green-600 hover:bg-green-700"
              onClick={() => updateTaskStatus(task.id, "completed")}
            >
              Completar
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="h-6 px-2 text-xs"
              onClick={() => updateTaskStatus(task.id, "cancelled")}
            >
              Cancelar
            </Button>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {t("follow_up_meeting.reviewing_opportunities", "Revisando Oportunidades")}
        </h2>
        <div className="flex items-center space-x-2">
          <div className="text-sm text-gray-500">
            {currentIndex + 1} de {opportunities.length}
          </div>
          {showCloseButton && (
            <Button variant="ghost" size="sm" onClick={handleClose} className="ml-2">
              <X className="h-4 w-4 mr-1" />
              Cerrar
            </Button>
          )}
        </div>
      </div>

      <div className="relative" ref={containerRef}>
        <div className="flex items-center justify-center space-x-4">
          {/* Oportunidad anterior (difuminada) */}
          {!hideNavigation && prevOpportunity && (
            <div
              className="hidden md:block w-1/5 opacity-50 filter blur-sm cursor-pointer transition-all"
              onClick={goToPrevious}
            >
              <Card className="h-64 overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm truncate">{truncateText(prevOpportunity.title, 50)}</CardTitle>
                </CardHeader>
                <CardContent className="text-xs h-32 overflow-hidden">
                  <div className="line-clamp-6">{prevOpportunity.description || "Sin descripción"}</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Oportunidad actual - Estilo detallado similar a la vista de detalle */}
          <div className={`w-full ${!hideNavigation ? "md:w-3/5" : ""}`}>
            <Card className="border-2 border-primary/20">
              {/* Encabezado con título y badges */}
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start mb-4">
                  {/* Información de tiempo - TEXTO MÁS GRANDE */}
                  <div className="flex flex-col space-y-1 text-sm font-medium text-gray-700">
                    <span>Oportunidad abierta hace {daysSinceCreation} días</span>
                    <span>Último cambio hace {daysSinceUpdate} días</span>
                  </div>

                  {/* Badges de estado */}
  <div className="flex flex-wrap items-center justify-end gap-2">
  {currentOpportunity.pipeline_stage_id !== lostStageId && <Button variant="outline" size="sm" onClick={handleMarkAsLost} disabled={isMarkingLost} className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"><CircleSlash className="mr-1.5 h-4 w-4" />{isMarkingLost ? "..." : markAsLostLabel}</Button>}
  {hasRecentChanges(currentOpportunity) ? (
                      <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Actualizada
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-amber-50 text-amber-800 hover:bg-amber-100">
                        <Clock className="h-3 w-3 mr-1" />
                        Sin cambios
                      </Badge>
                    )}

                    {currentOpportunity.validation_status === "validated" ? (
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

                    {isReviewed && (
                      <Badge variant="default" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Revisada
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Título y cliente */}
                <div>
                  <CardTitle className="text-2xl font-bold flex-grow">
                    {currentOpportunity.title}
                    {currentOpportunity.end_customer && ` - ${getEndCustomerName()}`}
                  </CardTitle>
                </div>
              </CardHeader>

              <div className="px-6 pb-2">
                <OpportunityChecklist opportunityId={currentOpportunity.id} canEdit />
              </div>

              <CardContent className="pb-2">
                {/* Nuevo layout: Detalles y notas en 2 columnas, tareas debajo */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Columna de detalles (2/3 del ancho) */}
                  <div className="md:col-span-2 space-y-4">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 mr-2 text-primary" />
                      <h3 className="text-lg font-semibold">Detalles</h3>
                    </div>

                    {/* Descripción */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Descripción:</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2"
                          onClick={() => setShowEditOpportunity(true)}
                        >
                          <Edit className="h-3 w-3 mr-1" /> Editar
                        </Button>
                      </div>
                      <div className="text-sm bg-gray-50 p-3 rounded-md max-h-32 overflow-y-auto">
                        {currentOpportunity.description || "Sin descripción"}
                      </div>
                    </div>

                    {/* Grid de información detallada */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Cliente final */}
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <Building className="h-4 w-4 mr-2 text-gray-500" />
                          <span className="text-sm font-medium">Cliente final:</span>
                        </div>
                        <div className="text-sm pl-6">
                          <span>{getEndCustomerName()}</span>
                        </div>
                      </div>

                      {/* País */}
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                          <span className="text-sm font-medium">País:</span>
                        </div>
                        <div className="text-sm pl-6">
                          <span>{getCountryName(currentOpportunity.country)}</span>
                        </div>
                      </div>

                      {/* Fecha de cierre estimada */}
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                          <span className="text-sm font-medium">Fecha de cierre estimada:</span>
                        </div>
                        <div className="text-sm pl-6 flex items-center justify-between group">
                          <span>{formatDate(currentOpportunity.estimated_close_date)}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => setShowEditOpportunity(true)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Responsable del Partner */}
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2 text-gray-500" />
                          <span className="text-sm font-medium">Responsable del Partner:</span>
                        </div>
                        <div className="text-sm pl-6 flex items-center justify-between group">
                          {isLoadingPartnerResponsible ? (
                            <span className="text-gray-400">Cargando...</span>
                          ) : (
                            <span>
                              {partnerResponsible
                                ? `${partnerResponsible.first_name || ""} ${partnerResponsible.last_name || ""}`.trim() ||
                                  "No asignado"
                                : "No asignado"}
                            </span>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => setShowEditOpportunity(true)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Campos técnicos */}
                    {techFields && techFields.length > 0 && (
                      <div className="space-y-2 border-t pt-4">
                        <div className="flex items-center">
                          <Tag className="h-4 w-4 mr-2 text-gray-500" />
                          <span className="text-sm font-medium">Campos técnicos:</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                          {techFields.map((field) => (
                            <div key={field.id} className="space-y-1">
                              <div className="text-xs text-gray-500">{field.field_info?.field_name || "Campo"}:</div>
                              <div className="text-sm bg-gray-50 p-2 rounded">{getFieldValue(field)}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Columna de notas (1/3 del ancho) */}
                  {/* Sección de notas - IMPORTANTE: Aquí solo se deben mostrar notas públicas */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <MessageSquare className="h-5 w-5 mr-2 text-primary" />
                        <h3 className="text-lg font-semibold">Notas</h3>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setShowAddNote(true)}>
                        <Plus className="h-4 w-4 mr-1" /> Añadir
                      </Button>
                    </div>

                    <div className="h-64 overflow-y-auto p-2 border rounded-md">
                      {currentOpportunity.notes && currentOpportunity.notes.length > 0 ? (
                        <div className="space-y-2">
                          {/* Aquí se muestran las notas - No filtrar aquí, ya que deben venir filtradas del backend */}
                          {currentOpportunity.notes.map((note: any) => (
                            <div key={note.id} className="bg-gray-50 p-3 rounded-md">
                              <div className="text-xs text-gray-500 flex justify-between">
                                <span>{formatDate(note.created_at)}</span>
                                <span>
                                  {note.user?.first_name && note.user?.last_name
                                    ? `${note.user.first_name} ${note.user.last_name}`
                                    : note.user?.email || "Usuario"}
                                </span>
                              </div>
                              <div className="text-sm mt-1">{note.content}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-gray-500 py-4">No hay notas para esta oportunidad</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sección de tareas (debajo) */}
                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <ClipboardList className="h-5 w-5 mr-2 text-primary" />
                      <h3 className="text-lg font-semibold">Tareas</h3>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setShowAddTask(true)}>
                      <Plus className="h-4 w-4 mr-1" /> Añadir
                    </Button>
                  </div>

                  <div className="border rounded-md p-2">
                    {currentOpportunity.tasks && currentOpportunity.tasks.length > 0 ? (
                      <div className="space-y-2">
                        {currentOpportunity.tasks
                          .filter((task: any) => task.status !== "completed" && task.status !== "cancelled")
                          .map((task: any) => (
                            <div key={task.id} className="bg-gray-50 p-3 rounded-md">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="text-sm font-medium">{task.title}</div>
                                  <div className="text-xs text-gray-500 mt-1">Vence: {formatDate(task.due_date)}</div>
                                  {task.description && (
                                    <div className="text-sm mt-2 bg-white p-2 rounded max-h-20 overflow-y-auto">
                                      {task.description}
                                    </div>
                                  )}
                                  {/* Botones de cambio de estado */}
                                  {getStatusButtons(task)}
                                </div>
                                <Badge
                                  variant={task.status === "completed" ? "default" : "outline"}
                                  className={
                                    task.status === "completed"
                                      ? "bg-green-100 text-green-800"
                                      : task.status === "in_progress"
                                        ? "bg-blue-50 text-blue-800"
                                        : task.status === "cancelled"
                                          ? "bg-red-50 text-red-800"
                                          : "bg-amber-50 text-amber-800"
                                  }
                                >
                                  {task.status === "completed"
                                    ? "Completada"
                                    : task.status === "in_progress"
                                      ? "En progreso"
                                      : task.status === "cancelled"
                                        ? "Cancelada"
                                        : "Pendiente"}
                                </Badge>
                              </div>
                              <div className="text-xs text-gray-500 mt-2 flex justify-between">
                                <span>
                                  Asignada a:{" "}
                                  {task.assigned_to_user?.first_name && task.assigned_to_user?.last_name
                                    ? `${task.assigned_to_user.first_name} ${task.assigned_to_user.last_name}`
                                    : task.assigned_to_user?.email || "No asignada"}
                                </span>
                                <span>
                                  Por:{" "}
                                  {task.assigned_by_user?.first_name && task.assigned_by_user?.last_name
                                    ? `${task.assigned_by_user.first_name} ${task.assigned_by_user.last_name}`
                                    : task.assigned_by_user?.email || "Desconocido"}
                                </span>
                              </div>
                            </div>
                          ))}
                        {currentOpportunity.tasks.filter(
                          (task: any) => task.status !== "completed" && task.status !== "cancelled",
                        ).length === 0 && (
                          <div className="text-center text-gray-500 py-4">
                            No hay tareas activas para esta oportunidad
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-4">No hay tareas para esta oportunidad</div>
                    )}
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex justify-between pt-2">
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => setShowEditOpportunity(true)}>
                    Editar
                  </Button>
                </div>

                {showCloseButton ? (
                  <Button variant="default" size="sm" onClick={handleClose}>
                    Cerrar
                  </Button>
                ) : !hideReviewButton ? (
                  <Button
                    variant={isReviewed ? "outline" : "default"}
                    size="sm"
                    onClick={handleReview}
                    disabled={isReviewed}
                  >
                    {isReviewed ? "Revisada" : "Marcar como revisada"}
                  </Button>
                ) : null}
              </CardFooter>
            </Card>
          </div>

          {/* Oportunidad siguiente (difuminada) */}
          {!hideNavigation && nextOpportunity && (
            <div
              className="hidden md:block w-1/5 opacity-50 filter blur-sm cursor-pointer transition-all"
              onClick={goToNext}
            >
              <Card className="h-64 overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm truncate">{truncateText(nextOpportunity.title, 50)}</CardTitle>
                </CardHeader>
                <CardContent className="text-xs h-32 overflow-hidden">
                  <div className="line-clamp-6">{nextOpportunity.description || "Sin descripción"}</div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Controles de navegación */}
        {!hideNavigation && (
          <>
            <div className="absolute inset-y-0 left-0 flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={goToPrevious}
                disabled={currentIndex === 0}
                className="h-8 w-8 rounded-full bg-white shadow-md"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>

            <div className="absolute inset-y-0 right-0 flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={goToNext}
                disabled={currentIndex === opportunities.length - 1}
                className="h-8 w-8 rounded-full bg-white shadow-md"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Indicador de progreso */}
      {!hideNavigation && opportunities.length > 1 && (
        <div className="flex justify-center">
          <div className="flex space-x-1">
            {opportunities.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-2 rounded-full ${index === currentIndex ? "bg-primary" : "bg-gray-200"}`}
                onClick={() => setCurrentIndex(index)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Diálogos */}
      {showAddNote && currentOpportunity && (
        <AddNoteDialog
          open={showAddNote}
          onClose={() => setShowAddNote(false)}
          opportunityId={currentOpportunity.id}
          onSuccess={() => {
            if (onDataChange) {
              onDataChange()
            }
            setShowAddNote(false)
          }}
          onAddNote={handleAddNote}
        />
      )}

      {showAddTask && currentOpportunity && (
        <AddTaskDialog
          open={showAddTask}
          onClose={() => setShowAddTask(false)}
          opportunity={currentOpportunity}
          onSuccess={() => {
            if (onDataChange) {
              onDataChange()
            }
            setShowAddTask(false)
          }}
          onAddTask={async (taskData) => {
            if (!userInfo?.id) {
              toast({
                title: "Error",
                description: "No se pudo añadir la tarea. Información de usuario no disponible.",
                variant: "destructive",
              })
              return false
            }

            try {
              await addTaskToOpportunity({
                title: taskData.title,
                description: taskData.description,
                opportunity_id: currentOpportunity.id,
                tech_company_id: currentOpportunity.tech_company_id,
                partner_id: currentOpportunity.partner_id,
                assigned_to: taskData.assigned_to,
                assigned_by: userInfo.id,
                due_date: taskData.due_date.toISOString(),
                status: "pending",
              })

              toast({
                title: "Tarea añadida",
                description: "La tarea se ha añadido correctamente.",
              })

              // Actualizar datos si es necesario
              if (onDataChange) {
                onDataChange()
              }

              return true
            } catch (error) {
              console.error("Error al añadir tarea:", error)
              toast({
                title: "Error",
                description: "No se pudo añadir la tarea. Por favor, inténtalo de nuevo.",
                variant: "destructive",
              })
              return false
            }
          }}
          users={users}
        />
      )}

      {showEditOpportunity && currentOpportunity && (
        <EditOpportunityDialog
          open={showEditOpportunity}
          onClose={() => setShowEditOpportunity(false)}
          opportunity={currentOpportunity}
          onSuccess={() => {
            if (onDataChange) {
              onDataChange()
            }
            setShowEditOpportunity(false)
          }}
          partnerUsers={partnerUsers}
        />
      )}
    </div>
  )
}

// Add default export to fix the deployment error
export default OpportunityCarousel
