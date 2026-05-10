"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { PlusCircle, CheckCircle2, Clock, AlertCircle, XCircle } from "lucide-react"
import { useTaskService } from "@/lib/services/task-service-client"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useTranslations } from "@/hooks/use-translations"
import { DICT_LANG_OPPORTUNITIES } from "@/lib/constants/dict-lang-opportunities"
import { TaskCreateDialog } from "./task-create-dialog"
import { toast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface RelatedTasksListProps {
  opportunityId?: string
  partnerId?: string
  techCompanyId?: string
  title?: string
  description?: string
}

export function RelatedTasksList({
  opportunityId,
  partnerId,
  techCompanyId,
  title = "Tareas",
  description,
}: RelatedTasksListProps) {
  const router = useRouter()
  const { t } = useTranslations(DICT_LANG_OPPORTUNITIES)
  const taskService = useTaskService()
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [isSubtaskDialogOpen, setIsSubtaskDialogOpen] = useState(false)

  // Cargar tareas relacionadas
  useEffect(() => {
    loadTasks()
  }, [opportunityId, partnerId, techCompanyId])

  const loadTasks = async () => {
    setLoading(true)
    try {
      console.log("Cargando tareas relacionadas...")
      let tasksData: any[] = []

      if (opportunityId) {
        console.log(`Cargando tareas para oportunidad ID: ${opportunityId}`)
        tasksData = await taskService.getTasksByOpportunity(opportunityId)
      } else if (partnerId) {
        console.log(`Cargando tareas para partner ID: ${partnerId}`)
        tasksData = await taskService.getTasksByPartnerId(partnerId)
      } else if (techCompanyId) {
        console.log(`Cargando tareas para tech company ID: ${techCompanyId}`)
        tasksData = await taskService.getTasksByTechCompanyId(techCompanyId)
      }

      console.log(`Se cargaron ${tasksData.length} tareas`)

      // Filtrar tareas según los criterios especificados
      const now = new Date()
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      const filteredTasks = tasksData.filter((task) => {
        // Mostrar todas las tareas pendientes o en progreso
        if (task.status === "pending" || task.status === "in_progress") {
          return true
        }

        // Para tareas completadas o canceladas, solo mostrar las actualizadas en la última semana
        if (task.status === "completed" || task.status === "cancelled") {
          const updatedAt = new Date(task.updated_at)
          return updatedAt >= oneWeekAgo
        }

        // Por defecto, no mostrar otras tareas
        return false
      })

      console.log(`Se filtraron ${filteredTasks.length} tareas de ${tasksData.length} totales`)
      setTasks(filteredTasks)
    } catch (error) {
      console.error("Error al cargar tareas:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las tareas relacionadas",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTaskCreated = (task: any) => {
    console.log("Tarea creada:", task)
    setIsCreateDialogOpen(false)
    setIsSubtaskDialogOpen(false)
    setSelectedTaskId(null)
    loadTasks()
    toast({
      title: "Tarea creada",
      description: "La tarea ha sido creada correctamente",
    })
  }

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      console.log(`Actualizando estado de tarea ${taskId} a ${newStatus}`)
      await taskService.updateTaskStatus(taskId, newStatus)
      loadTasks()
      toast({
        title: "Estado actualizado",
        description: "El estado de la tarea ha sido actualizado correctamente",
      })
    } catch (error) {
      console.error("Error al actualizar estado:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de la tarea",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {t("tasks.status.completed")}
                  </Badge>
        )
      case "in_progress":
        return (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    <Clock className="h-3 w-3 mr-1" />
                    {t("tasks.status.in_progress")}
                  </Badge>
        )
      case "cancelled":
        return (
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    <XCircle className="h-3 w-3 mr-1" />
                    {t("tasks.status.cancelled")}
                  </Badge>
        )
      default:
        return (
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {t("tasks.status.pending")}
                  </Badge>
        )
    }
  }

  const openSubtaskDialog = (taskId: string) => {
    console.log(`Abriendo diálogo de subtarea para tarea ${taskId}`)
    setSelectedTaskId(taskId)
    setIsSubtaskDialogOpen(true)
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-xl">{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            {t("tasks.create_task")}
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>{t("tasks.no_tasks")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="border rounded-md p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/dashboard/tasks/${task.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{task.title}</div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(task.status)}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          openSubtaskDialog(task.id)
                        }}
                      >
                        <PlusCircle className="h-4 w-4" />
                        <span className="sr-only">{t("tasks.add_subtask")}</span>
                      </Button>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {task.assigned_to_user && (
                      <span>
                        {t("tasks.assigned_to")}: {task.assigned_to_user.first_name}{" "}
                        {task.assigned_to_user.last_name}
                      </span>
                    )}
                    {task.due_date && (
                      <span className="ml-3">
                        {t("tasks.due_date")}:{" "}
                        {task.due_date ? format(new Date(task.due_date), "PPP", { locale: es }) : t("tasks.no_date")}
                      </span>
                    )}
                  </div>
                  <div className="flex mt-2 gap-2">
                    {task.status !== "completed" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleStatusChange(task.id, "completed")
                        }}
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        {t("tasks.mark_completed")}
                      </Button>
                    )}
                    {task.status === "pending" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleStatusChange(task.id, "in_progress")
                        }}
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        {t("tasks.mark_in_progress")}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diálogo para crear tarea */}
      <TaskCreateDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onTaskCreated={handleTaskCreated}
        opportunityId={opportunityId}
        partnerId={partnerId}
        techCompanyId={techCompanyId}
      />

      {/* Diálogo para crear subtarea */}
      <TaskCreateDialog
        isOpen={isSubtaskDialogOpen}
        onClose={() => {
          setIsSubtaskDialogOpen(false)
          setSelectedTaskId(null)
        }}
        onTaskCreated={handleTaskCreated}
        opportunityId={opportunityId}
        partnerId={partnerId}
        techCompanyId={techCompanyId}
        parentTaskId={selectedTaskId || undefined}
      />
    </>
  )
}
