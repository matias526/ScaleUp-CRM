"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { es, enUS, pt } from "date-fns/locale"
import {
  Calendar,
  User,
  Building,
  Briefcase,
  Eye,
  ChevronUp,
  ChevronDown,
  Search,
  Filter,
  LayoutGrid,
  List,
  Target,
  Check,
  X,
  Pencil,
  Trash2,
} from "lucide-react"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTaskService } from "@/lib/services/task-service-client"
import { useTranslations } from "@/hooks/use-translations"
import type { Task } from "@/types/task"
import { useAuth } from "@/components/auth/auth-provider"
import { Card, CardContent } from "@/components/ui/card"
import TasksBoardView from "./tasks-board-view"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface UserRoleInfo {
  id: string | null
  role: string | null
  isAdmin: boolean
  isBDD: boolean
  isPartnerUser: boolean
  isTechUser: boolean
}

interface TechCompany {
  id: string
  name: string
}

interface Partner {
  id: string
  name: string
}

interface AssignedUser {
  id: string
  name: string
}

export default function TasksTable({
  initialTasks = [],
  userRoleInfo,
  techCompanies = [],
  partners = [],
}: {
  initialTasks?: Task[]
  userRoleInfo?: UserRoleInfo
  techCompanies?: TechCompany[]
  partners?: Partner[]
}) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [filteredTasks, setFilteredTasks] = useState<Task[]>(initialTasks)
  const [isLoading, setIsLoading] = useState(initialTasks.length === 0)
  const taskService = useTaskService()
  const { t, language, isLoaded } = useTranslations()
  const { userInfo } = useAuth() // Obtener información del usuario actual
  const [viewMode, setViewMode] = useState<"list" | "board">("list")

  // Estados para el diálogo de confirmación de eliminación
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Estados para edición inline
  const [editingTask, setEditingTask] = useState<string | null>(null)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<string>("")
  const [editDate, setEditDate] = useState<Date | undefined>(undefined)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Estados para filtrado y ordenamiento
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string[]>(["pending", "in_progress"])
  const [techCompanyFilter, setTechCompanyFilter] = useState("all")
  const [partnerFilter, setPartnerFilter] = useState("all")
  const [assignedToFilter, setAssignedToFilter] = useState("all")
  const [commitmentFilter, setCommitmentFilter] = useState("all") // "all", "commitment", "task"
  const [sortField, setSortField] = useState("due_date")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [showFilters, setShowFilters] = useState(false)

  // Extraer tech companies y partners únicos de las tareas actuales
  const availableTechCompanies = useMemo(() => {
    // Obtener IDs únicos de tech companies en las tareas
    const uniqueTechCompanyIds = new Set<string>()
    tasks.forEach((task) => {
      if (task.tech_company_id) {
        uniqueTechCompanyIds.add(task.tech_company_id)
      }
    })

    // Filtrar la lista completa de tech companies para incluir solo las que están en las tareas
    return techCompanies
      .filter((company) => uniqueTechCompanyIds.has(company.id))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [tasks, techCompanies])

  const availablePartners = useMemo(() => {
    // Obtener IDs únicos de partners en las tareas
    const uniquePartnerIds = new Set<string>()
    tasks.forEach((task) => {
      if (task.partner_id) {
        uniquePartnerIds.add(task.partner_id)
      }
    })

    // Filtrar la lista completa de partners para incluir solo los que están en las tareas
    return partners.filter((partner) => uniquePartnerIds.has(partner.id)).sort((a, b) => a.name.localeCompare(b.name))
  }, [tasks, partners])

  // Extraer usuarios asignados únicos de las tareas actuales
  const availableAssignedUsers = useMemo(() => {
    const uniqueUsers = new Map<string, AssignedUser>()

    tasks.forEach((task) => {
      if (task.assigned_to && task.assigned_to_user) {
        const userId = task.assigned_to
        if (!uniqueUsers.has(userId)) {
          uniqueUsers.set(userId, {
            id: userId,
            name: `${task.assigned_to_user.first_name} ${task.assigned_to_user.last_name}`,
          })
        }
      }
    })

    // Convertir el Map a un array y ordenar por nombre
    return Array.from(uniqueUsers.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [tasks])

  // Función para obtener el locale correcto para date-fns
  const getLocale = () => {
    switch (language) {
      case "es":
        return es
      case "pt":
        return pt
      default:
        return enUS
    }
  }

  useEffect(() => {
    // Solo cargar tareas si no se proporcionaron inicialmente
    if (initialTasks.length === 0 && isLoading) {
      const fetchTasks = async () => {
        try {
          let data

          // Verificar si el usuario es admin, partner, bdd o tech
          const isAdmin = userRoleInfo?.isAdmin || userInfo?.roleCode?.toLowerCase() === "admin" || false
          const isPartnerUser =
            userRoleInfo?.isPartnerUser || userInfo?.roleCode?.toLowerCase().includes("partner") || false
          const isBDD = userRoleInfo?.isBDD || userInfo?.roleCode?.toLowerCase() === "bdd" || false
          const isTechUser =
            userRoleInfo?.isTechUser ||
            (userInfo?.roleCode?.toLowerCase().includes("tech") &&
              userInfo?.roleCode?.toLowerCase().includes("user")) ||
            false

          const userId = userRoleInfo?.id || userInfo?.id

          if (isAdmin) {
            // Si es admin, obtener todas las tareas
            data = await taskService.getTasks()
          } else if ((isPartnerUser || isBDD || isTechUser) && userId) {
            // Para partner, bdd o tech, obtener solo sus tareas
            data = await taskService.getTasksForUser(userId)
          } else {
            // Para otros roles o si no hay userId, no mostrar tareas
            data = []
          }

          // Actualizar todos los estados juntos
          setTasks(data || [])
          setFilteredTasks(data || [])
          setIsLoading(false)
        } catch (error) {
          console.error("Error fetching tasks:", error)
          setIsLoading(false)
        }
      }

      fetchTasks()
    }
  }, [initialTasks, taskService, userInfo, userRoleInfo, isLoading])

  // Restablecer filtros si las opciones ya no están disponibles
  useEffect(() => {
    // Verificar si el tech company seleccionado todavía está disponible
    if (techCompanyFilter !== "all" && !availableTechCompanies.some((c) => c.id === techCompanyFilter)) {
      setTechCompanyFilter("all")
    }

    // Verificar si el partner seleccionado todavía está disponible
    if (partnerFilter !== "all" && !availablePartners.some((p) => p.id === partnerFilter)) {
      setPartnerFilter("all")
    }

    // Verificar si el usuario asignado seleccionado todavía está disponible
    if (assignedToFilter !== "all" && !availableAssignedUsers.some((u) => u.id === assignedToFilter)) {
      setAssignedToFilter("all")
    }
  }, [
    availableTechCompanies,
    availablePartners,
    availableAssignedUsers,
    techCompanyFilter,
    partnerFilter,
    assignedToFilter,
  ])

  // Aplicar filtros y ordenamiento cuando cambian los criterios
  useEffect(() => {
    let result = [...tasks]

    // Aplicar filtro de búsqueda
    if (searchTerm) {
      result = result.filter(
        (task) =>
          task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          task.description?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Aplicar filtro de estado
    if (!statusFilter.includes("all")) {
      result = result.filter((task) => statusFilter.includes(task.status))
    }

    // Aplicar filtro de tech company
    if (techCompanyFilter !== "all") {
      result = result.filter((task) => task.tech_company_id === techCompanyFilter)
    }

    // Aplicar filtro de partner
    if (partnerFilter !== "all") {
      result = result.filter((task) => task.partner_id === partnerFilter)
    }

    // Aplicar filtro de usuario asignado
    if (assignedToFilter !== "all") {
      result = result.filter((task) => task.assigned_to === assignedToFilter)
    }

    if (commitmentFilter === "commitment") {
      result = result.filter((task) => task.is_commitment === true)
    } else if (commitmentFilter === "task") {
      result = result.filter((task) => !task.is_commitment || task.is_commitment === false)
    }

    // Aplicar ordenamiento
    result.sort((a, b) => {
      let comparison = 0

      switch (sortField) {
        case "title":
          comparison = (a.title || "").localeCompare(b.title || "")
          break
        case "status":
          comparison = (a.status || "").localeCompare(b.status || "")
          break
        case "due_date":
          const dateA = a.due_date ? new Date(a.due_date).getTime() : 0
          const dateB = b.due_date ? new Date(b.due_date).getTime() : 0
          comparison = dateA - dateB
          break
        case "assigned_to":
          const nameA = a.assigned_to_user ? `${a.assigned_to_user.first_name} ${a.assigned_to_user.last_name}` : ""
          const nameB = b.assigned_to_user ? `${b.assigned_to_user.first_name} ${b.assigned_to_user.last_name}` : ""
          comparison = nameA.localeCompare(nameB)
          break
        default:
          comparison = 0
      }

      return sortDirection === "asc" ? comparison : -comparison
    })

    setFilteredTasks(result)
  }, [
    tasks,
    searchTerm,
    statusFilter,
    techCompanyFilter,
    partnerFilter,
    assignedToFilter,
    commitmentFilter, // Add commitmentFilter to dependencies
    sortField,
    sortDirection,
  ])

  // Enfocar el input cuando se inicia la edición
  useEffect(() => {
    if (editingField && inputRef.current) {
      inputRef.current.focus()
    }
  }, [editingField])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
      case "in_progress":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100"
      case "completed":
        return "bg-green-100 text-green-800 hover:bg-green-100"
      case "cancelled":
        return "bg-red-100 text-red-800 hover:bg-red-100"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100"
    }
  }

  const getStatusTranslation = (status: string) => {
    return t(
      `tasks.status.${status}`,
      status.replace("_", " ").charAt(0).toUpperCase() + status.replace("_", " ").slice(1),
    )
  }

  // Función para manejar el cambio de ordenamiento
  const handleSort = (field: string) => {
    if (sortField === field) {
      // Si ya estamos ordenando por este campo, cambiamos la dirección
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      // Si es un nuevo campo, establecemos el campo y dirección predeterminada
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Función para limpiar todos los filtros
  const clearFilters = () => {
    setSearchTerm("")
    setStatusFilter(["all"])
    setTechCompanyFilter("all")
    setPartnerFilter("all")
    setAssignedToFilter("all")
    setCommitmentFilter("all")
  }

  // Función para actualizar una tarea
  const handleTaskUpdate = (updatedTask: Task) => {
    setTasks((prevTasks) => prevTasks.map((task) => (task.id === updatedTask.id ? updatedTask : task)))
  }

  // Iniciar edición de un campo
  const startEditing = (taskId: string, field: string, value: string) => {
    setEditingTask(taskId)
    setEditingField(field)
    setEditValue(value)

    // Si es un campo de fecha, convertir a Date
    if (field === "due_date" && value) {
      setEditDate(new Date(value))
    }
  }

  // Cancelar edición
  const cancelEditing = () => {
    setEditingTask(null)
    setEditingField(null)
    setEditValue("")
    setEditDate(undefined)
  }

  // Guardar cambios
  const saveChanges = async () => {
    if (!editingTask || !editingField) return

    setIsSubmitting(true)
    try {
      const task = tasks.find((t) => t.id === editingTask)
      if (!task) return

      const updateData: any = {}

      if (editingField === "title") {
        updateData.title = editValue
      } else if (editingField === "due_date") {
        updateData.due_date = editDate
      }
      // Removemos la lógica de status de aquí ya que se maneja por separado

      const updatedTask = await taskService.updateTask(editingTask, updateData)

      // Actualizar la tarea en el estado local
      setTasks((prevTasks) => prevTasks.map((task) => (task.id === editingTask ? { ...task, ...updateData } : task)))

      toast.success(t("tasks.updated_successfully", "Task updated successfully"))
    } catch (error) {
      console.error("Error updating task:", error)
      toast.error(t("tasks.update_error", "Failed to update task"))
    } finally {
      setIsSubmitting(false)
      cancelEditing()
    }
  }

  // Función para eliminar una tarea
  const handleDeleteTask = async () => {
    if (!taskToDelete) return

    const task = tasks.find((t) => t.id === taskToDelete)
    if (task?.is_commitment) {
      toast.error(t("tasks.cannot_delete_commitment", "Cannot delete commitments"))
      setShowDeleteDialog(false)
      setTaskToDelete(null)
      return
    }

    setIsDeleting(true)
    try {
      const success = await taskService.deleteTask(taskToDelete)
      if (success) {
        // Eliminar la tarea del estado local
        setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskToDelete))
        toast.success(t("tasks.deleted_successfully", "Task deleted successfully"))
      } else {
        toast.error(t("tasks.delete_error", "Failed to delete task"))
      }
    } catch (error) {
      console.error("Error deleting task:", error)
      toast.error(t("tasks.delete_error", "Failed to delete task"))
    } finally {
      setIsDeleting(false)
      setTaskToDelete(null)
      setShowDeleteDialog(false)
    }
  }

  // Contar cuántos filtros están activos
  const activeFiltersCount =
    (!statusFilter.includes("all") ? 1 : 0) +
    (techCompanyFilter !== "all" ? 1 : 0) +
    (partnerFilter !== "all" ? 1 : 0) +
    (assignedToFilter !== "all" ? 1 : 0) +
    (commitmentFilter !== "all" ? 1 : 0)

  const isScaleUpUser = useMemo(() => {
    const isAdmin = userRoleInfo?.isAdmin || userInfo?.roleCode?.toLowerCase() === "admin" || false
    const isBDD = userRoleInfo?.isBDD || userInfo?.roleCode?.toLowerCase() === "bdd" || false
    return isAdmin || isBDD
  }, [userRoleInfo, userInfo])

  if (!isLoaded) {
    return <div className="text-center py-10">{t("tasks.loading", "Loading tasks...")}</div>
  }

  if (isLoading) {
    return <div className="text-center py-10">{t("tasks.loading", "Loading tasks...")}</div>
  }

  return (
    <div className="space-y-4">
      {/* Barra de búsqueda, botón de filtros y selector de vista */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-3 h-4 w-4 text-gray-400" />
          <Input
            type="search"
            placeholder={t("common.search", "Search...")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 h-10"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="h-10 px-4 py-2">
            <Filter className="h-4 w-4 mr-2" />
            {t("common.filters", "Filters")}
            {activeFiltersCount > 0 && (
              <span className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                {activeFiltersCount}
              </span>
            )}
          </Button>

          {/* Selector de vista */}
          <div className="border rounded-md flex">
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              className="rounded-r-none h-10 px-3"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4 mr-1" />
              {t("common.list", "List")}
            </Button>
            <Button
              variant={viewMode === "board" ? "default" : "ghost"}
              size="sm"
              className="rounded-l-none h-10 px-3"
              onClick={() => setViewMode("board")}
            >
              <LayoutGrid className="h-4 w-4 mr-1" />
              {t("common.board", "Board")}
            </Button>
          </div>
        </div>
      </div>

      {/* Panel de filtros expandible */}
      {showFilters && (
        <Card className="mb-4">
          <CardContent className="p-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("tasks.filter_by_status", "Filter by Status")}
                </label>
                <div className="border rounded-md p-2 space-y-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="status-all"
                      className="mr-2 h-4 w-4"
                      checked={statusFilter.includes("all")}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setStatusFilter(["all"])
                        } else {
                          setStatusFilter([])
                        }
                      }}
                    />
                    <label htmlFor="status-all" className="text-sm">
                      {t("common.all", "All")}
                    </label>
                  </div>
                  {["pending", "in_progress", "completed", "cancelled"].map((status) => (
                    <div key={status} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`status-${status}`}
                        className="mr-2 h-4 w-4"
                        checked={statusFilter.includes(status)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            // Si "all" está seleccionado, quitarlo
                            const newFilter = statusFilter.includes("all") ? [status] : [...statusFilter, status]
                            setStatusFilter(newFilter)
                          } else {
                            const newFilter = statusFilter.filter((s) => s !== status)
                            // Si no queda ningún filtro, seleccionar "all"
                            setStatusFilter(newFilter.length === 0 ? ["all"] : newFilter)
                          }
                        }}
                        disabled={statusFilter.includes("all")}
                      />
                      <label
                        htmlFor={`status-${status}`}
                        className={`text-sm flex items-center ${statusFilter.includes("all") ? "text-gray-400" : ""}`}
                      >
                        <Badge className={`mr-2 ${getStatusColor(status)}`}>{getStatusTranslation(status)}</Badge>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("tasks.filter_by_assigned_to", "Filter by Assigned To")}
                  {availableAssignedUsers.length > 0 && (
                    <span className="ml-1 text-xs text-gray-500">({availableAssignedUsers.length})</span>
                  )}
                </label>
                <Select value={assignedToFilter} onValueChange={setAssignedToFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("common.all_users", "All Users")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("common.all", "All")}</SelectItem>
                    {availableAssignedUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("tasks.filter_by_tech_company", "Filter by Tech Company")}
                  {availableTechCompanies.length > 0 && (
                    <span className="ml-1 text-xs text-gray-500">({availableTechCompanies.length})</span>
                  )}
                </label>
                <Select value={techCompanyFilter} onValueChange={setTechCompanyFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("common.all_tech_companies", "All Tech Companies")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("common.all", "All")}</SelectItem>
                    {availableTechCompanies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("tasks.filter_by_partner", "Filter by Partner")}
                  {availablePartners.length > 0 && (
                    <span className="ml-1 text-xs text-gray-500">({availablePartners.length})</span>
                  )}
                </label>
                <Select value={partnerFilter} onValueChange={setPartnerFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("common.all_partners", "All Partners")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("common.all", "All")}</SelectItem>
                    {availablePartners.map((partner) => (
                      <SelectItem key={partner.id} value={partner.id}>
                        {partner.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isScaleUpUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("tasks.filter_by_type", "Filter by Type")}
                  </label>
                  <Select value={commitmentFilter} onValueChange={setCommitmentFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t("common.all", "All")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("common.all", "All")}</SelectItem>
                      <SelectItem value="commitment">{t("tasks.commitments_only", "Commitments Only")}</SelectItem>
                      <SelectItem value="task">{t("tasks.tasks_only", "Tasks Only")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={clearFilters}>
                {t("common.clear_filters", "Clear Filters")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contador de resultados */}
      <div className="text-sm text-gray-500 mb-2">
        {t("common.showing_results", "Showing")} {filteredTasks.length} {t("common.of", "of")} {tasks.length}{" "}
        {t("tasks.tasks", "tasks")}
      </div>

      {/* Vistas alternativas: Lista o Tablero */}
      {viewMode === "list" ? (
        /* Vista de Lista */
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer" onClick={() => handleSort("title")}>
                  <div className="flex items-center">
                    {t("tasks.table.title", "Title")}
                    {sortField === "title" &&
                      (sortDirection === "asc" ? (
                        <ChevronUp className="ml-1 h-4 w-4" />
                      ) : (
                        <ChevronDown className="ml-1 h-4 w-4" />
                      ))}
                  </div>
                </TableHead>
                <TableHead>{t("tasks.table.commitment", "Type")}</TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("status")}>
                  <div className="flex items-center">
                    {t("tasks.table.status", "Status")}
                    {sortField === "status" &&
                      (sortDirection === "asc" ? (
                        <ChevronUp className="ml-1 h-4 w-4" />
                      ) : (
                        <ChevronDown className="ml-1 h-4 w-4" />
                      ))}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("assigned_to")}>
                  <div className="flex items-center">
                    {t("tasks.table.assigned_to", "Assigned To")}
                    {sortField === "assigned_to" &&
                      (sortDirection === "asc" ? (
                        <ChevronUp className="ml-1 h-4 w-4" />
                      ) : (
                        <ChevronDown className="ml-1 h-4 w-4" />
                      ))}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("due_date")}>
                  <div className="flex items-center">
                    {t("tasks.table.due_date", "Due Date")}
                    {sortField === "due_date" &&
                      (sortDirection === "asc" ? (
                        <ChevronUp className="ml-1 h-4 w-4" />
                      ) : (
                        <ChevronDown className="ml-1 h-4 w-4" />
                      ))}
                  </div>
                </TableHead>
                <TableHead>{t("tasks.table.related_to", "Related To")}</TableHead>
                <TableHead className="text-right">{t("tasks.table.actions", "Actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10">
                    {t("tasks.no_tasks_filtered", "No tasks found matching your filters")}
                  </TableCell>
                </TableRow>
              ) : (
                filteredTasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">
                      {editingTask === task.id && editingField === "title" ? (
                        <div className="flex items-center gap-2">
                          <Input
                            ref={inputRef}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="h-8"
                            disabled={isSubmitting}
                          />
                          <div className="flex items-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-green-600"
                              onClick={saveChanges}
                              disabled={isSubmitting}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-600"
                              onClick={cancelEditing}
                              disabled={isSubmitting}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="flex items-center justify-between group cursor-pointer hover:bg-gray-50 p-1 rounded"
                          onClick={() => startEditing(task.id, "title", task.title)}
                        >
                          <span>{task.title}</span>
                          <Pencil className="h-3.5 w-3.5 text-gray-400 opacity-0 group-hover:opacity-100" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge
                          variant="outline"
                          className={
                            task.is_commitment
                              ? "bg-purple-50 text-purple-700 border-purple-200"
                              : "bg-gray-50 text-gray-700 border-gray-200"
                          }
                        >
                          {task.is_commitment ? t("tasks.commitment", "Commitment") : t("tasks.task", "Task")}
                        </Badge>
                        {task.is_commitment && (
                          <Select
                            value={task.commitment_status || ""}
                            onValueChange={async (value) => {
                              setIsSubmitting(true)
                              try {
                                const updatedTask = await taskService.updateTask(task.id, { commitment_status: value })
                                if (updatedTask) {
                                  setTasks((prevTasks) =>
                                    prevTasks.map((t) => (t.id === task.id ? { ...t, commitment_status: value } : t)),
                                  )
                                  toast.success(t("tasks.updated_successfully", "Task updated successfully"))
                                }
                              } catch (error) {
                                console.error("Error updating commitment status:", error)
                                toast.error(t("tasks.update_error", "Failed to update task"))
                              } finally {
                                setIsSubmitting(false)
                              }
                            }}
                            disabled={isSubmitting}
                          >
                            <SelectTrigger className="h-7 text-xs w-full">
                              <SelectValue placeholder={t("tasks.select_status", "Select...")} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="completed">{t("tasks.commitment_completed", "Cumplido")}</SelectItem>
                              <SelectItem value="not_completed">
                                {t("tasks.commitment_not_completed", "No cumplido")}
                              </SelectItem>
                              <SelectItem value="partial">
                                {t("tasks.commitment_partial", "Parcialmente cumplido")}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {editingTask === task.id && editingField === "status" ? (
                        <div className="flex items-center gap-2">
                          <Select
                            value={editValue}
                            onValueChange={async (value) => {
                              setIsSubmitting(true)
                              try {
                                const updatedTask = await taskService.updateTask(task.id, { status: value })
                                if (updatedTask) {
                                  setTasks((prevTasks) =>
                                    prevTasks.map((t) => (t.id === task.id ? { ...t, status: value } : t)),
                                  )
                                  toast.success(t("tasks.updated_successfully", "Task updated successfully"))
                                }
                              } catch (error) {
                                console.error("Error updating task status:", error)
                                toast.error(t("tasks.update_error", "Failed to update task"))
                              } finally {
                                setIsSubmitting(false)
                                cancelEditing()
                              }
                            }}
                            disabled={isSubmitting}
                          >
                            <SelectTrigger className="h-8 w-[130px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">{getStatusTranslation("pending")}</SelectItem>
                              <SelectItem value="in_progress">{getStatusTranslation("in_progress")}</SelectItem>
                              <SelectItem value="completed">{getStatusTranslation("completed")}</SelectItem>
                              <SelectItem value="cancelled">{getStatusTranslation("cancelled")}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <div
                          className="inline-flex group cursor-pointer"
                          onClick={() => startEditing(task.id, "status", task.status)}
                        >
                          <Badge
                            className={`${getStatusColor(task.status)} group-hover:ring-2 group-hover:ring-gray-200`}
                          >
                            {getStatusTranslation(task.status)}
                          </Badge>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {task.assigned_to_user ? (
                        <div className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5 text-gray-500" />
                          <span>
                            {task.assigned_to_user.first_name} {task.assigned_to_user.last_name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">{t("tasks.not_assigned", "Not assigned")}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingTask === task.id && editingField === "due_date" ? (
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <Calendar className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                            <Input
                              ref={inputRef}
                              type="date"
                              value={editDate ? format(editDate, "yyyy-MM-dd") : ""}
                              onChange={(e) => {
                                const newDate = e.target.value ? new Date(e.target.value) : undefined
                                setEditDate(newDate)
                              }}
                              className="h-8 pl-8 w-[160px]"
                              disabled={isSubmitting}
                            />
                          </div>
                          <div className="flex items-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-green-600"
                              onClick={saveChanges}
                              disabled={isSubmitting}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-600"
                              onClick={cancelEditing}
                              disabled={isSubmitting}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="flex items-center gap-1 group cursor-pointer hover:bg-gray-50 p-1 rounded"
                          onClick={() => startEditing(task.id, "due_date", task.due_date || "")}
                        >
                          <Calendar className="h-3.5 w-3.5 text-gray-500" />
                          {task.due_date ? (
                            <span>{format(new Date(task.due_date), "PPP", { locale: getLocale() })}</span>
                          ) : (
                            <span className="text-gray-400">{t("tasks.no_due_date", "No due date")}</span>
                          )}
                          <Pencil className="h-3.5 w-3.5 text-gray-400 opacity-0 group-hover:opacity-100 ml-1" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {task.opportunity && (
                          <div className="flex items-center gap-1 text-xs">
                            <Target className="h-3 w-3 text-gray-500" />
                            <span>{task.opportunity.title}</span>
                          </div>
                        )}
                        {task.tech_company && (
                          <div className="flex items-center gap-1 text-xs">
                            <Building className="h-3 w-3 text-gray-500" />
                            <span>{task.tech_company.name}</span>
                          </div>
                        )}
                        {task.partner && (
                          <div className="flex items-center gap-1 text-xs">
                            <Briefcase className="h-3 w-3 text-gray-500" />
                            <span>{task.partner.name}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Link href={`/dashboard/tasks/${task.id}`}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">{t("tasks.view", "View task")}</span>
                          </Button>
                        </Link>
                        {userInfo?.id === task.assigned_by && !task.is_commitment && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              setTaskToDelete(task.id)
                              setShowDeleteDialog(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">{t("tasks.delete", "Delete task")}</span>
                          </Button>
                        )}
                        {task.is_commitment && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-gray-400 cursor-not-allowed"
                            disabled
                            title={t("tasks.commitment_cannot_delete", "Commitments cannot be deleted")}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">
                              {t("tasks.commitment_cannot_delete", "Commitments cannot be deleted")}
                            </span>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      ) : (
        /* Vista de Tablero */
        <TasksBoardView tasks={filteredTasks} onTaskUpdate={handleTaskUpdate} />
      )}

      {/* Diálogo de confirmación para eliminar tarea */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("tasks.delete_confirmation_title", "Are you sure you want to delete this task?")}
            </DialogTitle>
            <DialogDescription>
              {t(
                "tasks.delete_confirmation_description",
                "This action cannot be undone. This will permanently delete the task and all its subtasks.",
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={isDeleting}>
              {t("common.cancel", "Cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteTask}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? t("tasks.deleting", "Deleting...") : t("tasks.delete", "Delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
