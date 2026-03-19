"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTaskService } from "@/lib/services/task-service-client"
import { useTranslations } from "@/hooks/use-translations"
import { DatePicker } from "@/components/ui/date-picker"
import { Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import type { Task } from "@/types/task"

// Definir el esquema de validación
const taskSchema = z.object({
  title: z.string().min(1, "El título es obligatorio"),
  description: z.string().optional(),
  status: z.string().default("pending"),
  priority: z.string().default("medium"),
  due_date: z.date().optional().nullable(),
  assigned_to: z.string().optional().nullable(),
  task_type_id: z.string().optional().nullable(),
  partner_id: z.string().optional().nullable(),
  tech_company_id: z.string().optional().nullable(),
  opportunity_id: z.string().optional().nullable(),
})

type TaskFormValues = z.infer<typeof taskSchema>

interface TaskCreateDialogProps {
  isOpen: boolean
  onClose: () => void
  onTaskCreated: (task: Task) => void
  partnerId?: string
  techCompanyId?: string
  opportunityId?: string
  initialValues?: Partial<TaskFormValues>
}

export function TaskCreateDialog({
  isOpen,
  onClose,
  onTaskCreated,
  partnerId: propPartnerId,
  techCompanyId: propTechCompanyId,
  opportunityId,
  initialValues,
}: TaskCreateDialogProps) {
  const [users, setUsers] = useState<any[]>([])
  const [taskTypes, setTaskTypes] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [partnerId, setPartnerId] = useState<string | undefined>(propPartnerId)
  const [techCompanyId, setTechCompanyId] = useState<string | undefined>(propTechCompanyId)
  const taskService = useTaskService()
  const { t } = useTranslations()
  
  // Códigos de roles con case sensitive correcto
  const ROLE_CODES = {
    ADMIN: "Admin",
    BDD: "BDD",
    PARTNER_USER: "PartnerUser",
    TECH_USER: "TechUser",
  }

  // Obtener partnerId y techCompanyId de la oportunidad si no se proporcionaron como props
  useEffect(() => {
    const fetchOpportunityDetails = async () => {
      if (!opportunityId) return

      try {
        const { data: opportunity, error } = await supabase
          .from("opportunities")
          .select("partner_id, tech_company_id")
          .eq("id", opportunityId)
          .single()

        if (error) {
          console.error("Error al obtener detalles de la oportunidad:", error)
          return
        }

        // Solo actualizar si no se proporcionaron como props
        if (!propPartnerId && opportunity.partner_id) {
          setPartnerId(opportunity.partner_id)
        }

        if (!propTechCompanyId && opportunity.tech_company_id) {
          setTechCompanyId(opportunity.tech_company_id)
        }
      } catch (error) {
        console.error("Error al obtener detalles de la oportunidad:", error)
      }
    }

    if (isOpen && opportunityId) {
      fetchOpportunityDetails()
    }
  }, [isOpen, opportunityId, propPartnerId, propTechCompanyId, supabase])

  // Inicializar el formulario con valores por defecto
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "pending",
      priority: "medium",
      due_date: null,
      assigned_to: null,
      task_type_id: null,
      partner_id: partnerId || null,
      tech_company_id: techCompanyId || null,
      opportunity_id: opportunityId || null,
      ...initialValues,
    },
  })

  // Actualizar los valores del formulario cuando cambian partnerId o techCompanyId
  useEffect(() => {
    form.setValue("partner_id", partnerId || null)
    form.setValue("tech_company_id", techCompanyId || null)
  }, [form, partnerId, techCompanyId])

  // Cargar usuarios y tipos de tareas
  useEffect(() => {
    const loadData = async () => {
      setIsLoadingData(true)
      try {
        // Obtener el ID del usuario actual
        const {
          data: { session },
        } = await supabase.auth.getSession()
        const currentUserId = session?.user?.id

        if (!currentUserId) {
          console.error("No se pudo obtener el ID del usuario actual")
          return
        }

        // Inicializar el array de usuarios combinados
        let combinedUsers: any[] = []

        // Obtener los IDs de los roles Admin y BDD con case sensitive correcto
        const { data: roleIds, error: roleError } = await supabase
          .from("roles")
          .select("id, code")
          .in("code", [ROLE_CODES.ADMIN, ROLE_CODES.BDD])

        if (roleError) {
          console.error("Error al obtener los IDs de roles:", roleError)
        } else {
          const adminBddRoleIds = roleIds.map((role) => role.id)

          // Cargar usuarios de ScaleUp (Admin y BDD)
          const { data: scaleupUsers, error: scaleupError } = await supabase
            .from("users")
            .select("id, first_name, last_name, email, role_id")
            .in("role_id", adminBddRoleIds)
            .eq("is_active", true)

          if (scaleupError) {
            console.error("Error al cargar usuarios de ScaleUp:", scaleupError)
          } else {
            combinedUsers = [...combinedUsers, ...(scaleupUsers || [])]
          }
        }

        // Cargar usuarios del Partner (si hay partnerId)
        if (partnerId) {
          // Primero obtener el ID del rol PartnerUser
          const { data: partnerRoleData, error: partnerRoleError } = await supabase
            .from("roles")
            .select("id")
            .eq("code", ROLE_CODES.PARTNER_USER)
            .single()

          if (partnerRoleError) {
            console.error(`Error al obtener el ID del rol ${ROLE_CODES.PARTNER_USER}:`, partnerRoleError)
          } else {
            // Luego obtener los usuarios con ese rol y partner_id
            const { data: partnerUsers, error: partnerError } = await supabase
              .from("users")
              .select("id, first_name, last_name, email, role_id, partner_id")
              .eq("partner_id", partnerId)
              .eq("role_id", partnerRoleData.id)
              .eq("is_active", true)

            if (partnerError) {
              console.error("Error al cargar usuarios del Partner:", partnerError)
            } else {
              combinedUsers = [...combinedUsers, ...(partnerUsers || [])]
            }
          }
        }

        // Cargar usuarios de la Tech Company (si hay techCompanyId)
        if (techCompanyId) {
          // Primero obtener el ID del rol TechUser
          const { data: techRoleData, error: techRoleError } = await supabase
            .from("roles")
            .select("id")
            .eq("code", ROLE_CODES.TECH_USER)
            .single()

          if (techRoleError) {
            console.error(`Error al obtener el ID del rol ${ROLE_CODES.TECH_USER}:`, techRoleError)
          } else {
            // Luego obtener los usuarios con ese rol y tech_company_id
            const { data: techUsers, error: techError } = await supabase
              .from("users")
              .select("id, first_name, last_name, email, role_id, tech_company_id")
              .eq("tech_company_id", techCompanyId)
              .eq("role_id", techRoleData.id)
              .eq("is_active", true)

            if (techError) {
              console.error("Error al cargar usuarios de la Tech Company:", techError)
            } else {
              combinedUsers = [...combinedUsers, ...(techUsers || [])]
            }
          }
        }

        // Eliminar duplicados
        const uniqueUserIds = new Set(combinedUsers.map((user) => user.id))
        const uniqueUsers = Array.from(uniqueUserIds).map((id) => combinedUsers.find((user) => user.id === id))

        setUsers(uniqueUsers)

        // Cargar tipos de tareas
        const { data: taskTypesData, error: taskTypesError } = await supabase
          .from("task_types")
          .select("id, name")
          .order("name")

        if (taskTypesError) {
          console.error("Error al cargar tipos de tareas:", taskTypesError)
        } else {
          setTaskTypes(taskTypesData || [])
        }
      } catch (error) {
        console.error("Error general al cargar datos:", error)
      } finally {
        setIsLoadingData(false)
      }
    }

    if (isOpen) {
      loadData()
    }
  }, [isOpen, supabase, partnerId, techCompanyId, opportunityId])

  const onSubmit = async (data: TaskFormValues) => {
    setIsLoading(true)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const currentUserId = session?.user?.id

      if (!currentUserId) {
        console.error("No se pudo obtener el ID del usuario actual")
        return
      }

      const newTask = await taskService.createTask({
        ...data,
        assigned_by: currentUserId, // Establecer el assigned_by con el ID del usuario actual
        partner_id: partnerId || null,
        tech_company_id: techCompanyId || null,
        opportunity_id: opportunityId || null,
      })
      if (newTask) {
        onTaskCreated(newTask)
        form.reset()
      }
    } catch (error) {
      console.error("Error creating task:", error)
    } finally {
      setIsLoading(false)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t("tasks.create.title", "Crear Nueva Tarea")}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("tasks.form.title", "Título")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("tasks.form.title_placeholder", "Ingrese el título de la tarea")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("tasks.form.description", "Descripción")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("tasks.form.description_placeholder", "Ingrese una descripción detallada")}
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("tasks.form.status", "Estado")}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("tasks.form.select_status", "Seleccione un estado")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">{t("tasks.status.pending", "Pendiente")}</SelectItem>
                        <SelectItem value="in_progress">{t("tasks.status.in_progress", "En Progreso")}</SelectItem>
                        <SelectItem value="completed">{t("tasks.status.completed", "Completada")}</SelectItem>
                        <SelectItem value="cancelled">{t("tasks.status.cancelled", "Cancelada")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("tasks.form.priority", "Prioridad")}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("tasks.form.select_priority", "Seleccione una prioridad")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">{t("tasks.priority.low", "Baja")}</SelectItem>
                        <SelectItem value="medium">{t("tasks.priority.medium", "Media")}</SelectItem>
                        <SelectItem value="high">{t("tasks.priority.high", "Alta")}</SelectItem>
                        <SelectItem value="urgent">{t("tasks.priority.urgent", "Urgente")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t("tasks.form.due_date", "Fecha límite")}</FormLabel>
                    <DatePicker
                      date={field.value ? new Date(field.value) : undefined}
                      setDate={(date) => field.onChange(date)}
                      placeholder={t("tasks.form.select_date", "Seleccione una fecha")}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="assigned_to"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("tasks.form.assigned_to", "Asignado a")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("tasks.form.select_user", "Seleccione un usuario")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {users.length === 0 ? (
                          <SelectItem value="no-users" disabled>
                            No hay usuarios disponibles
                          </SelectItem>
                        ) : (
                          users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {typeof user.first_name === "string" ? user.first_name : ""}{" "}
                              {typeof user.last_name === "string" ? user.last_name : ""}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="task_type_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("tasks.form.task_type", "Tipo de tarea")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("tasks.form.select_task_type", "Seleccione un tipo de tarea")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {taskTypes.length === 0 ? (
                        <SelectItem value="no-types" disabled>
                          No hay tipos de tareas disponibles
                        </SelectItem>
                      ) : (
                        taskTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {typeof type.name === "string" ? type.name : ""}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" type="button" onClick={onClose}>
                {t("common.cancel", "Cancelar")}
              </Button>
              <Button type="submit" disabled={isLoading || isLoadingData}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("common.saving", "Guardando...")}
                  </>
                ) : (
                  t("common.create", "Crear")
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
