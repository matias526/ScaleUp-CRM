"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useTaskService } from "@/lib/services/task-service-client"

interface AddCommitmentDialogProps {
  isOpen: boolean
  onClose: () => void
  techCompanyId?: string
  techCompanyName?: string
  userId?: string
  userName?: string
  meetingId?: string
  onSuccess?: () => void
}

export function AddCommitmentDialog({
  isOpen,
  onClose,
  techCompanyId,
  techCompanyName,
  userId,
  userName,
  meetingId,
  onSuccess,
}: AddCommitmentDialogProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [assignedTo, setAssignedTo] = useState("")
  const [priority, setPriority] = useState("medium")
  const [isCommitment, setIsCommitment] = useState(true)
  const [selectedTechCompany, setSelectedTechCompany] = useState("")
  const [users, setUsers] = useState<any[]>([])
  const [techCompanies, setTechCompanies] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const [isLoadingTechCompanies, setIsLoadingTechCompanies] = useState(true)
  const { createTask } = useTaskService()

  useEffect(() => {
    if (userId) {
      setAssignedTo(userId)
    }
  }, [userId])

  useEffect(() => {
    if (techCompanyId) {
      setSelectedTechCompany(techCompanyId)
    }
  }, [techCompanyId])

  // Cargar usuarios (Admin y BDD)
  useEffect(() => {
    const loadUsers = async () => {
      if (!isOpen) return

      setIsLoadingUsers(true)
      try {
        // Obtener los IDs de los roles Admin, BDD y Marketing
        const { data: roleIds, error: roleError } = await supabase
          .from("roles")
          .select("id, code")
          .in("code", ["Admin", "BDD", "Marketing"])

        if (roleError) {
          console.error("Error al obtener roles:", roleError)
          return
        }

        const adminBddRoleIds = roleIds.map((role) => role.id)

        // Cargar usuarios con esos roles
        const { data: usersData, error: usersError } = await supabase
          .from("users")
          .select("id, first_name, last_name, email")
          .in("role_id", adminBddRoleIds)
          .eq("is_active", true)
          .order("first_name")

        if (usersError) {
          console.error("Error al cargar usuarios:", usersError)
          return
        }

        setUsers(usersData || [])
      } catch (error) {
        console.error("Error al cargar usuarios:", error)
      } finally {
        setIsLoadingUsers(false)
      }
    }

    loadUsers()
  }, [isOpen, supabase])

  useEffect(() => {
    const loadTechCompanies = async () => {
      if (!isOpen) return

      setIsLoadingTechCompanies(true)
      try {
        const { data: techCompaniesData, error: techCompaniesError } = await supabase
          .from("tech_companies")
          .select("id, name")
          .eq("is_active", true)
          .order("name")

        if (techCompaniesError) {
          console.error("Error al cargar tech companies:", techCompaniesError)
          return
        }

        setTechCompanies(techCompaniesData || [])
      } catch (error) {
        console.error("Error al cargar tech companies:", error)
      } finally {
        setIsLoadingTechCompanies(false)
      }
    }

    loadTechCompanies()
  }, [isOpen, supabase])

  useEffect(() => {
    if (isCommitment) {
      const today = new Date()
      const nextWeek = new Date(today)
      nextWeek.setDate(today.getDate() + 7)
      const formattedDate = nextWeek.toISOString().split("T")[0]
      setDueDate(formattedDate)
    }
  }, [isCommitment])

  const handleSubmit = async () => {
    if (!title.trim() || !assignedTo) {
      return
    }

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

      const taskData = {
        title: title.trim(),
        description: description.trim() || null,
        status: "pending" as const,
        priority: priority as "low" | "medium" | "high",
        due_date: dueDate ? new Date(dueDate) : null,
        assigned_to: assignedTo,
        assigned_by: currentUserId,
        tech_company_id: selectedTechCompany || techCompanyId || null,
        partner_id: null,
        opportunity_id: null,
        task_type_id: null,
        is_commitment: isCommitment,
        meeting_id: isCommitment && meetingId ? meetingId : null,
        commitment_status: null,
        comments: null,
      }

      const newTask = await createTask(taskData)

      if (newTask) {
        resetForm()
        onSuccess?.()
        onClose()
      }
    } catch (error) {
      console.error("Error al crear compromiso:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setTitle("")
    setDescription("")
    setDueDate("")
    if (!userId) {
      setAssignedTo("")
    }
    if (!techCompanyId) {
      setSelectedTechCompany("")
    }
    setPriority("medium")
    setIsCommitment(true)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const contextName = techCompanyName || userName || "General"

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isCommitment ? "Agregar Compromiso" : "Agregar Tarea"} - {contextName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex-1">
              <Label htmlFor="is-commitment" className="font-medium">
                ¿Es un compromiso?
              </Label>
              <p className="text-xs text-gray-600 mt-1">
                Los compromisos se revisan en la próxima reunión y tienen fecha automática (7 días)
              </p>
            </div>
            <Switch id="is-commitment" checked={isCommitment} onCheckedChange={setIsCommitment} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="commitment-title">Título {isCommitment ? "del compromiso" : "de la tarea"} *</Label>
            <Input
              id="commitment-title"
              placeholder="Ej: Revisar pipeline de oportunidades"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="commitment-description">Descripción</Label>
            <Textarea
              id="commitment-description"
              placeholder="Detalles adicionales del compromiso"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="commitment-tech-company">TechCompany (opcional)</Label>
            {isLoadingTechCompanies ? (
              <div className="text-sm text-gray-500">Cargando empresas...</div>
            ) : (
              <Select value={selectedTechCompany} onValueChange={setSelectedTechCompany} disabled={!!techCompanyId}>
                <SelectTrigger className={techCompanyId ? "bg-gray-100 cursor-not-allowed" : ""}>
                  <SelectValue placeholder="Seleccionar empresa (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin empresa asignada</SelectItem>
                  {techCompanies.length > 0 ? (
                    techCompanies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-companies" disabled>
                      No hay empresas disponibles
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            )}
            {techCompanyId && <p className="text-xs text-gray-500">Empresa asignada automáticamente</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="commitment-due-date">Fecha límite {isCommitment && "(automática)"}</Label>
              <Input
                id="commitment-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={isCommitment}
                className={isCommitment ? "bg-gray-100 cursor-not-allowed" : ""}
              />
              {isCommitment && <p className="text-xs text-gray-500">Se establece automáticamente en 7 días</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="commitment-priority">Prioridad</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baja</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="commitment-assigned-to">Asignado a *</Label>
            {isLoadingUsers ? (
              <div className="text-sm text-gray-500">Cargando usuarios...</div>
            ) : (
              <Select value={assignedTo} onValueChange={setAssignedTo} disabled={!!userId}>
                <SelectTrigger className={userId ? "bg-gray-100 cursor-not-allowed" : ""}>
                  <SelectValue placeholder="Seleccionar responsable" />
                </SelectTrigger>
                <SelectContent>
                  {users.length > 0 ? (
                    users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.first_name} {user.last_name}
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
            {userId && <p className="text-xs text-gray-500">Asignado automáticamente al usuario actual</p>}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || !assignedTo || isLoading || isLoadingUsers}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              `Guardar ${isCommitment ? "Compromiso" : "Tarea"}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
