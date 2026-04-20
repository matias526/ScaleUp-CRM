"use client"

import { useState, useEffect, useCallback } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTranslations } from "@/hooks/use-translations"
import { useTaskService } from "@/lib/services/task-service-client"
import { supabase } from "@/lib/supabase/client"
import { toast } from "@/components/ui/use-toast"
import type { Task } from "@/types/task"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { CalendarIcon, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/spanish-calendar"

interface SubtaskDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubtaskCreated: () => void
  parentTask: Task
}

const formSchema = z.object({
  title: z.string().min(2, {
    message: "El título debe tener al menos 2 caracteres.",
  }),
  description: z.string().optional(),
  due_date: z.date().optional(),
  assigned_to: z.string().min(1, {
    message: "Debes asignar la tarea a alguien.",
  }),
})

export function SubtaskDialog({ isOpen, onClose, onSubtaskCreated, parentTask }: SubtaskDialogProps) {
  const { t } = useTranslations()
  const taskService = useTaskService()

  const [users, setUsers] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      due_date: undefined,
      assigned_to: "",
    },
  })

  // Función para cargar usuarios filtrados
  const loadFilteredUsers = useCallback(async () => {
    try {
      const contextTechCompanyId = parentTask?.tech_company_id || null
      const contextPartnerId = parentTask?.partner_id || null

      const { data: allUsers, error: usersError } = await supabase
        .from("users")
        .select("id, first_name, last_name, email, tech_company_id, partner_id, role_id")
        .eq("is_active", true)
        .order("first_name", { ascending: true })

      if (usersError) throw usersError

      const filtered = allUsers?.filter((user) => {
        const isScaleUpUser = (!user.partner_id && !user.tech_company_id) || user.role_id === 1
        const isTechCompanyUser = contextTechCompanyId && user.tech_company_id === contextTechCompanyId
        const isPartnerUser = contextPartnerId && user.partner_id === contextPartnerId
        return isScaleUpUser || isTechCompanyUser || isPartnerUser
      })

      setUsers(filtered || [])
    } catch (error) {
      console.error("Error al cargar usuarios:", error)
    }
  }, [parentTask])

  // Cargar datos al abrir
  useEffect(() => {
    if (isOpen) {
      const init = async () => {
        setIsLoadingUsers(true)
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          const { data: userData } = await supabase
            .from("users")
            .select("*, roles:role_id(id, code)")
            .eq("id", user.id)
            .single()

          setCurrentUser(userData)
          // Reiniciamos el form con valores limpios pero el asignado por defecto
          form.reset({
            title: "",
            description: "",
            due_date: undefined,
            assigned_to: userData?.id || "",
          })
        }
        await loadFilteredUsers()
        setIsLoadingUsers(false)
      }
      init()
    }
  }, [isOpen, form, loadFilteredUsers])

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    if (isSubmitting) return
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
        opportunity_id: parentTask.opportunity_id || null,
        partner_id: parentTask.partner_id || null,
        tech_company_id: parentTask.tech_company_id || null,
        task_type_id: parentTask.task_type_id || null,
      }

      const result = await taskService.createTask(subtaskData)

      if (result) {
        toast({
          title: t("common.success", "Éxito"),
          description: t("tasks.subtask_created", "Subtarea creada correctamente"),
        })
        form.reset()
        onSubtaskCreated()
        onClose() // Cerramos después de todo el proceso
      }
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: t("tasks.error_creating", "No se pudo crear la subtarea"),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("tasks.create_subtask", "Crear subtarea")}</DialogTitle>
          <DialogDescription>
            {t("tasks.create_subtask_description", "Crea una subtarea para la tarea seleccionada")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
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

            <FormField
              control={form.control}
              name="due_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>{t("tasks.due_date", "Fecha de vencimiento")}</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP", { locale: es })
                          ) : (
                            <span>{t("common.pick_date", "Seleccionar fecha")}</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date("1900-01-01")}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="assigned_to"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("tasks.assigned_to", "Asignada a")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger disabled={isLoadingUsers}>
                        <SelectValue
                          placeholder={isLoadingUsers ? t("tasks.loading", "Cargando...") : t("tasks.select_user", "Seleccionar usuario")}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {users.length > 0 ? (
                        users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.first_name} {user.last_name}
                            {(!user.partner_id && !user.tech_company_id) ? " (ScaleUp)" : user.tech_company_id ? " (Tech)" : " (Partner)"}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-2 text-xs text-center text-muted-foreground">No hay usuarios disponibles</div>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                {t("common.cancel", "Cancelar")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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

export default SubtaskDialog