"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar, User, Eye, Plus } from "lucide-react"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTaskService } from "@/lib/services/task-service-client"
import { TaskCreateDialog } from "@/components/tasks/task-create-dialog"
import { useTranslations } from "@/hooks/use-translations"
import type { Task } from "@/types/task"

interface TechCompanyTasksProps {
  techCompanyId: string
  techCompanyName: string
}

export function TechCompanyTasks({ techCompanyId, techCompanyName }: TechCompanyTasksProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const taskService = useTaskService()
  const router = useRouter()
  const { t } = useTranslations()

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setIsLoading(true)
        const data = await taskService.getTasksByTechCompanyId(techCompanyId)
        // Filtrar solo tareas pendientes y en progreso
        const filteredTasks = (data || []).filter((task) => task.status === "pending" || task.status === "in_progress")
        setTasks(filteredTasks)
      } catch (err) {
        console.error("Error fetching tech company tasks:", err)
        setError("Error al cargar las tareas de la empresa tecnológica")
      } finally {
        setIsLoading(false)
      }
    }

    fetchTasks()
  }, [techCompanyId])

  const handleTaskCreated = (task: Task) => {
    setIsDialogOpen(false)
    setTasks((prevTasks) => [task, ...prevTasks])
    router.refresh()
  }

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
    const translationKey = `tasks.status.${status}`
    const defaultText = status.replace("_", " ").charAt(0).toUpperCase() + status.replace("_", " ").slice(1)
    return t(translationKey, defaultText)
  }

  // Asegurarse de que techCompanyName sea una cadena
  const companyName = typeof techCompanyName === "string" ? techCompanyName : "esta empresa tecnológica"

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-bold">
          {t("tech_company.tasks.title", "Tareas de la Empresa Tecnológica")}
        </CardTitle>
        <Button onClick={() => setIsDialogOpen(true)} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          {t("tasks.new", "Nueva Tarea")}
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4">{t("common.loading", "Cargando...")}</div>
        ) : error ? (
          <div className="text-center py-4 text-red-500">{error}</div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-4">
            {t("tech_company.tasks.no_tasks", "No hay tareas asociadas a esta empresa tecnológica")}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("tasks.table.title", "Título")}</TableHead>
                  <TableHead>{t("tasks.table.status", "Estado")}</TableHead>
                  <TableHead>{t("tasks.table.assigned_to", "Asignado a")}</TableHead>
                  <TableHead>{t("tasks.table.due_date", "Fecha límite")}</TableHead>
                  <TableHead className="text-right">{t("tasks.table.actions", "Acciones")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">{task.title}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(task.status || "pending")}>
                        {getStatusTranslation(task.status || "pending")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {task.assigned_to_user ? (
                        <div className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5 text-gray-500" />
                          <span>
                            {task.assigned_to_user.first_name || ""} {task.assigned_to_user.last_name || ""}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">{t("tasks.not_assigned", "No asignado")}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {task.due_date ? (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-gray-500" />
                          <span>{format(new Date(task.due_date), "PPP", { locale: es })}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">{t("tasks.no_due_date", "Sin fecha límite")}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => router.push(`/dashboard/tasks/${task.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">{t("tasks.view", "Ver tarea")}</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {isDialogOpen && (
          <TaskCreateDialog
            isOpen={isDialogOpen}
            onClose={() => setIsDialogOpen(false)}
            onTaskCreated={handleTaskCreated}
            techCompanyId={techCompanyId}
          />
        )}
      </CardContent>
    </Card>
  )
}

export default TechCompanyTasks
