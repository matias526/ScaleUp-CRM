"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/spanish-calendar"
import { useTranslations } from "@/hooks/use-translations"
import { useTaskService } from "@/lib/services/task-service-client"
//import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { supabase } from "@/lib/supabase/client"
import { toast } from "@/components/ui/use-toast"
import type { Task } from "@/types/task"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

interface SubtaskDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubtaskCreated: () => void
  parentTask: Task
}

const formSchema = z.object({
  title: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
  description: z.string().optional(),
  due_date: z.date().optional(),
  assigned_to: z.string(),
})

export function SubtaskDialog({ isOpen, onClose, onSubtaskCreated, parentTask }: SubtaskDialogProps) {
  const { t } = useTranslations()
  const taskService = useTaskService()
  //const supabase = createClientComponentClient()

  // Estados para datos relacionados
  const [users, setUsers] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [isPartnerUser, setIsPartnerUser] = useState(false)
  const [userPartnerId, setUserPartnerId] = useState<string | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      due_date: undefined,
      assigned_to: "",
    },
  })

  // Cargar datos necesarios al abrir el diálogo
  useEffect(() => {
    if (isOpen) {
      loadData()
    } else {
      // Limpiar formulario al cerrar
      resetForm()
      form.reset()
    }
  }, [isOpen])

  const resetForm = () => {
    form.reset()
  }

  // Función para cargar datos necesarios
  const loadData = async () => {
    try {
      setIsLoadingUsers(true)

      // Cargar usuario actual
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data: userData } = await supabase
          .from("users")
          .select("*, roles:role_id(id, code)")
          .eq("id", user.id)
          .single()
        setCurrentUser(userData)
        form.setValue("assigned_to", userData?.id || "")
      }

      // Cargar usuarios filtrados según el contexto
      await loadFilteredUsers()
    } catch (error) {
      console.error("Error al cargar datos:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos necesarios",
        variant: "destructive",
      })
    } finally {
      setIsLoadingUsers(false)
    }
  }

  // Función para cargar usuarios filtrados según el contexto
  const loadFilteredUsers = async () => {
    try {
      // Obtener IDs de contexto
      const contextTechCompanyId = parentTask?.tech_company_id || null
      const contextPartnerId = parentTask?.partner_id || null

      // Construir la consulta para obtener usuarios
      const query = supabase
        .from("users")
        .select("id, first_name, last_name, email, tech_company_id, partner_id, role_id")
        .eq("is_active", true)
        .order("first_name", { ascending: true })

      // Obtener todos los usuarios
      const { data: allUsers, error: usersError } = await query

      if (usersError) {
        console.error("Error al obtener usuarios:", usersError)
        throw usersError
      }

      // Filtrar usuarios según las selecciones
      const filteredUsers = allUsers?.filter((user) => {
        // Incluir usuarios de ScaleUp (sin partner_id y sin tech_company_id o con role_id = 1)
        const isScaleUpUser = (!user.partner_id && !user.tech_company_id) || user.role_id === 1

        // Incluir usuarios de la tech company seleccionada
        const isTechCompanyUser = contextTechCompanyId && user.tech_company_id === contextTechCompanyId

        // Incluir usuarios del partner seleccionado
        const isPartnerUser = contextPartnerId && user.partner_id === contextPartnerId

        return isScaleUpUser || isTechCompanyUser || isPartnerUser
      })

      setUsers(filteredUsers || [])
    } catch (error) {
      console.error("Error al cargar usuarios filtrados:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios",
        variant: "destructive",
      })
    }
  }

  // Función para manejar el envío del formulario
  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true)

    try {
      const subtaskData = {
        title: values.title,
        description: values.description || null,
        status: "pending",
        due_date: values.due_date,
        assigned_to: values.assigned_to,
        assigned_by: currentUser?.id,
        parent_task_id: parentTask.id,
        // Heredar relaciones de la tarea padre
        opportunity_id: parentTask.opportunity_id || null,
        partner_id: parentTask.partner_id || null,
        tech_company_id: parentTask.tech_company_id || null,
        task_type_id: parentTask.task_type_id || null,
      }

      console.log("Datos de subtarea a crear:", subtaskData)

      const result = await taskService.createTask(subtaskData)

      if (result && result[0]) {
        toast({
          title: "Subtarea creada",
          description: "La subtarea ha sido creada correctamente",
        })
        onSubtaskCreated()
      }
    } catch (error) {
      console.error("Error al crear subtarea:", error)
      toast({
        title: "Error",
        description: "No se pudo crear la subtarea",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("tasks.create_subtask", "Crear subtarea")}</DialogTitle>
          <DialogDescription>
            {t("tasks.create_subtask_description", "Crea una subtarea para la tarea seleccionada")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
            <div className="space-y-2">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("tasks.title", "Título")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("tasks.subtask_title_placeholder", "Título de la subtarea")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-2">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("tasks.description", "Descripción")}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t("tasks.description_placeholder", "Descripción de la subtarea")}
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="due_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Date</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <Input
                        type="date"
                        {...field}
                        value={field.value ? new Date(field.value).toISOString().split("T")[0] : ""}
                        onChange={(e) => {
                          const value = e.target.value
                          field.onChange(value ? new Date(value) : null)
                        }}
                        className="pl-10 transition-all focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <Label htmlFor="assigned-to">{t("tasks.assigned_to", "Asignada a")}</Label>
              <Select
                value={form.getValues("assigned_to")}
                onValueChange={(value) => form.setValue("assigned_to", value)}
              >
                <SelectTrigger id="assigned-to" disabled={isLoadingUsers}>
                  <SelectValue
                    placeholder={
                      isLoadingUsers
                        ? t("tasks.loading_users", "Cargando usuarios...")
                        : t("tasks.select_user", "Seleccionar usuario")
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {!users || users.length === 0 ? (
                    <div className="px-2 py-2 text-sm text-muted-foreground">
                      {isLoadingUsers
                        ? t("tasks.loading_users", "Cargando usuarios...")
                        : t("tasks.no_users_available", "No hay usuarios disponibles")}
                    </div>
                  ) : (
                    users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.first_name} {user.last_name}
                        {!user.partner_id && !user.tech_company_id
                          ? " (ScaleUp)"
                          : user.tech_company_id
                            ? " (Tech)"
                            : " (Partner)"}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                {t("common.cancel", "Cancelar")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent rounded-full"></div>
                    {t("common.creating", "Creando...")}
                  </>
                ) : (
                  t("tasks.create_subtask_button", "Crear subtarea")
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

// Añadir la exportación predeterminada que falta
export default SubtaskDialog
