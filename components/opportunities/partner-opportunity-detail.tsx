"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Calendar,
  Clock,
  Building,
  MapPin,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  User,
  FileText,
  Tag,
  X,
  MessageSquare,
  ClipboardList,
  Plus,
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useTranslations } from "@/hooks/use-translations"
import { getCountryName, getDaysSince } from "@/lib/utils/country-utils"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/auth/auth-provider"
import {
  addNoteToOpportunity,
  addTaskToOpportunity,
  getRelevantUsersForOpportunity,
  getTechFieldsForOpportunity,
} from "@/lib/services/follow-up-meeting-service"
import { AddNoteDialog } from "@/components/follow-up-meetings/add-note-dialog"
import { AddTaskDialog } from "@/components/follow-up-meetings/add-task-dialog"
import { EditOpportunityDialog } from "@/components/follow-up-meetings/edit-opportunity-dialog"
import type { OpportunityWithRelations } from "@/lib/services/opportunity-service"
import { supabase } from "@/lib/supabase/client"
import { OpportunityQuotes } from "./opportunity-quotes"

interface PartnerOpportunityDetailProps {
  opportunity: OpportunityWithRelations
  onClose: () => void
  onDataChange?: () => void
}

export function PartnerOpportunityDetail({ opportunity, onClose, onDataChange }: PartnerOpportunityDetailProps) {
  const { t } = useTranslations()
  const { toast } = useToast()
  const { userInfo } = useAuth()
  const [showAddNote, setShowAddNote] = useState(false)
  const [showAddTask, setShowAddTask] = useState(false)
  const [showEditOpportunity, setShowEditOpportunity] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [partnerUsers, setPartnerUsers] = useState<any[]>([])
  const [techFields, setTechFields] = useState<any[]>([])
  const [partnerResponsible, setPartnerResponsible] = useState<any>(null)
  const [isLoadingPartnerResponsible, setIsLoadingPartnerResponsible] = useState(false)
  
  // Cargar usuarios relevantes y campos técnicos
  useEffect(() => {
    const loadData = async () => {
      if (opportunity?.id && opportunity?.partner?.id && opportunity?.tech_company?.id) {
        try {
          // Cargar usuarios
          const relevantUsers = await getRelevantUsersForOpportunity(
            opportunity.partner.id,
            opportunity.tech_company.id,
          )
          setUsers(relevantUsers)

          // Filtrar solo los usuarios del partner para el responsable
          const partnerOnlyUsers = relevantUsers.filter((user) => user.partner_id === opportunity.partner.id)
          setPartnerUsers(partnerOnlyUsers)

          // Cargar campos técnicos directamente
          const fields = await getTechFieldsForOpportunity(opportunity.id)
          setTechFields(fields)
        } catch (error) {
          console.error("Error loading data:", error)
        }
      }
    }

    loadData()
  }, [opportunity])

  // Cargar el responsable del partner
  useEffect(() => {
    const loadPartnerResponsible = async () => {
      if (opportunity?.partner_responsible_id) {
        setIsLoadingPartnerResponsible(true)
        try {
          console.log(`Cargando responsable del partner: ${opportunity.partner_responsible_id}`)
          const { data, error } = await supabase
            .from("users")
            .select("id, first_name, last_name, email, role_id")
            .eq("id", opportunity.partner_responsible_id)
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

    loadPartnerResponsible()
  }, [opportunity, supabase])

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
    if (!opportunity) return ""

    if (opportunity.end_customer && typeof opportunity.end_customer === "object") {
      return opportunity.end_customer.name
    }

    if (opportunity.end_customer_name) {
      return opportunity.end_customer_name
    }

    return "Cliente no especificado"
  }

  // Manejar la creación de una nueva nota
  const handleAddNote = async (noteData: { content: string; is_private: boolean }) => {
    if (!opportunity || !userInfo?.id) {
      toast({
        title: "Error",
        description: "No se pudo añadir la nota. Información de usuario o oportunidad no disponible.",
        variant: "destructive",
      })
      return false
    }

    try {
      await addNoteToOpportunity({
        opportunity_id: opportunity.id,
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

  // Determinar si la oportunidad ha tenido cambios recientes (última semana)
  const hasRecentChanges = (opportunity: any) => {
    if (!opportunity || !opportunity.updated_at) return false
    const lastWeek = new Date()
    lastWeek.setDate(lastWeek.getDate() - 7)
    return new Date(opportunity.updated_at) > lastWeek
  }

  // Calcular días desde la creación y última actualización
  const daysSinceCreation = getDaysSince(opportunity.created_at)
  const daysSinceUpdate = getDaysSince(opportunity.updated_at)

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

  // Filtrar notas para mostrar solo las públicas (no privadas) para usuarios Partner
  const getVisibleNotes = () => {
    if (!opportunity.notes) return []
    // Para usuarios Partner, filtrar las notas privadas
    return opportunity.notes.filter((note: any) => !note.is_private)
  }

  return (
    <div className="space-y-4 p-4 bg-white rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Detalles de la oportunidad</h2>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Card className="border-2 border-primary/20">
        {/* Encabezado con título y badges */}
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start mb-4">
            {/* Información de tiempo */}
            <div className="flex flex-col space-y-1 text-sm font-medium text-gray-700">
              <span>Oportunidad abierta hace {daysSinceCreation} días</span>
              <span>Último cambio hace {daysSinceUpdate} días</span>
            </div>

            {/* Badges de estado */}
            <div className="flex space-x-2">
              {hasRecentChanges(opportunity) ? (
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

          {/* Título y cliente */}
          <div>
            <CardTitle className="text-2xl font-bold flex-grow">
              {opportunity.name || opportunity.title}
              {opportunity.end_customer && ` - ${getEndCustomerName()}`}
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent className="pb-2">
          {/* Layout: Detalles y notas en 2 columnas, tareas debajo */}
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
                  <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => setShowEditOpportunity(true)}>
                    <FileText className="h-3 w-3 mr-1" /> Ver completo
                  </Button>
                </div>
                <div className="text-sm bg-gray-50 p-3 rounded-md max-h-32 overflow-y-auto">
                  {opportunity.description || "Sin descripción"}
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
                    <span>{getCountryName(opportunity.country)}</span>
                  </div>
                </div>

                {/* Fecha de cierre estimada */}
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-sm font-medium">Fecha de cierre estimada:</span>
                  </div>
                  <div className="text-sm pl-6">
                    <span>{formatDate(opportunity.expected_close_date)}</span>
                  </div>
                </div>

                {/* Responsable del Partner */}
                <div className="space-y-2">
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-sm font-medium">Responsable del Partner:</span>
                  </div>
                  <div className="text-sm pl-6">
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
                {getVisibleNotes().length > 0 ? (
                  <div className="space-y-2">
                    {getVisibleNotes().map((note: any) => (
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
                  <div className="text-center text-gray-500 py-4">No hay notas públicas para esta oportunidad</div>
                )}
              </div>
            </div>
          </div>

          {/* Sección de Quotes */}
          <OpportunityQuotes 
            opportunityId={opportunity?.id || ""} 
            lang={userInfo?.preferred_language || "es"}
            userRole={userInfo?.role_code || ""}
          />

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
              {opportunity.tasks && opportunity.tasks.length > 0 ? (
                <div className="space-y-2">
                  {opportunity.tasks.map((task: any) => (
                    <div key={task.id} className="bg-gray-50 p-3 rounded-md">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-sm font-medium">{task.title}</div>
                          <div className="text-xs text-gray-500 mt-1">Vence: {formatDate(task.due_date)}</div>
                          {task.description && (
                            <div className="text-sm mt-2 bg-white p-2 rounded max-h-20 overflow-y-auto">
                              {task.description}
                            </div>
                          )}
                        </div>
                        <Badge
                          variant={task.status === "completed" ? "default" : "outline"}
                          className={
                            task.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : task.status === "in_progress"
                                ? "bg-blue-50 text-blue-800"
                                : "bg-amber-50 text-amber-800"
                          }
                        >
                          {task.status === "completed"
                            ? "Completada"
                            : task.status === "in_progress"
                              ? "En progreso"
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
                </div>
              ) : (
                <div className="text-center text-gray-500 py-4">No hay tareas para esta oportunidad</div>
              )}
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end pt-2">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </CardFooter>
      </Card>

      {/* Diálogos */}
      {showAddNote && (
        <AddNoteDialog
          open={showAddNote}
          onClose={() => setShowAddNote(false)}
          opportunityId={opportunity.id}
          onSuccess={() => {
            if (onDataChange) {
              onDataChange()
            }
            setShowAddNote(false)
          }}
          onAddNote={handleAddNote}
        />
      )}

      {showAddTask && (
        <AddTaskDialog
          open={showAddTask}
          onClose={() => setShowAddTask(false)}
          opportunity={opportunity}
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
                opportunity_id: opportunity.id,
                tech_company_id: opportunity.tech_company_id,
                partner_id: opportunity.partner_id,
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

      {showEditOpportunity && (
        <EditOpportunityDialog
          open={showEditOpportunity}
          onClose={() => setShowEditOpportunity(false)}
          opportunity={opportunity}
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

export default PartnerOpportunityDetail
