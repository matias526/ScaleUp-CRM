"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// Eliminar: import { DatePicker } from "@/components/ui/date-picker"
import { useTranslations } from "@/hooks/use-translations"
import { getUsersForTaskAssignment } from "@/lib/services/follow-up-meeting-service"

type AddTaskDialogProps = {
  open: boolean
  onClose: () => void
  opportunity: any
  onSuccess: () => void
  onAddTask?: (taskData: {
    title: string
    description: string
    due_date: Date
    assigned_to: string
    opportunity_id: string
    tech_company_id: string
    partner_id: string
  }) => Promise<boolean>
  users?: any[]
}

export function AddTaskDialog({ open, onClose, opportunity, onSuccess, onAddTask, users = [] }: AddTaskDialogProps) {
  const { t } = useTranslations()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined)
  const [assignedTo, setAssignedTo] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [availableUsers, setAvailableUsers] = useState<any[]>(users)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cargar usuarios si no se proporcionan
  useEffect(() => {
    const loadUsers = async () => {
      if (open && opportunity?.partner?.id && opportunity?.tech_company_id) {
        setLoading(true)
        setError(null)
        try {
          console.log("Loading users for task assignment...")
          console.log("Partner ID:", opportunity.partner.id)
          console.log("Tech Company ID:", opportunity.tech_company_id)

          const loadedUsers = await getUsersForTaskAssignment(opportunity.partner.id, opportunity.tech_company_id)
          console.log("Loaded users:", loadedUsers)

          if (loadedUsers.length === 0) {
            console.warn("No users were loaded for task assignment")
          }

          setAvailableUsers(loadedUsers)
        } catch (error) {
          console.error("Error loading users for task assignment:", error)
          setError("Error al cargar usuarios. Por favor, inténtelo de nuevo.")
        } finally {
          setLoading(false)
        }
      } else if (users.length > 0) {
        setAvailableUsers(users)
      }
    }

    if (open) {
      loadUsers()
    }
  }, [opportunity, users, open])

  const handleSubmit = async () => {
    if (!title.trim() || !dueDate) return

    setIsSubmitting(true)
    try {
      // Si hay una función onAddTask proporcionada, usarla
      if (onAddTask) {
        const success = await onAddTask({
          title,
          description,
          due_date: dueDate,
          assigned_to: assignedTo,
          opportunity_id: opportunity.id,
          tech_company_id: opportunity.tech_company_id,
          partner_id: opportunity.partner_id,
        })

        if (success) {
          onSuccess()
          resetForm()
        }
      } else {
        // Fallback para compatibilidad
        onSuccess()
        resetForm()
      }
    } catch (error) {
      console.error("Error al añadir tarea:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setTitle("")
    setDescription("")
    setDueDate(undefined)
    setAssignedTo("")
  }

  // Formatear nombre de usuario
  const formatUserName = (user: any) => {
    const name = `${user.first_name || ""} ${user.last_name || ""}`.trim()
    const isBDD = user.role_id && user.role_id === "BDD" // Asumiendo que role_id puede ser "BDD"

    if (name) {
      return isBDD ? `${name} (BDD)` : name
    }
    return user.email || "Usuario sin nombre"
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("follow_up_meeting.add_task", "Añadir Tarea")}</DialogTitle>
          <DialogDescription>
            Crea una nueva tarea relacionada con esta oportunidad. Asigna la tarea a un usuario responsable.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="task-title">{t("follow_up_meeting.task_title", "Título de la tarea")}</Label>
            <Input
              id="task-title"
              placeholder="Título de la tarea"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-description">{t("follow_up_meeting.task_description", "Descripción")}</Label>
            <Textarea
              id="task-description"
              placeholder="Descripción de la tarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="task-due-date">{t("follow_up_meeting.due_date", "Fecha de vencimiento")}</Label>
              <Input
                id="task-due-date"
                type="date"
                value={dueDate ? new Date(dueDate).toISOString().split("T")[0] : ""}
                onChange={(e) => {
                  const newDate = e.target.value ? new Date(e.target.value) : undefined
                  setDueDate(newDate)
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-assigned-to">{t("follow_up_meeting.assigned_to", "Asignada a")}</Label>
              {loading ? (
                <div className="text-sm text-gray-500">Cargando usuarios...</div>
              ) : error ? (
                <div className="text-sm text-red-500">{error}</div>
              ) : (
                <Select value={assignedTo} onValueChange={setAssignedTo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar usuario" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers.length > 0 ? (
                      availableUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {formatUserName(user)}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-users" disabled>
                        No hay usuarios disponibles
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel", "Cancelar")}
          </Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || !dueDate || isSubmitting || loading}>
            {t("common.save", "Guardar")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default AddTaskDialog
