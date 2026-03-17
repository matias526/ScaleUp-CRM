"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, CheckCircle2, Clock, AlertCircle, XCircle } from "lucide-react"
import { useTaskService } from "@/lib/services/task-service-client"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useTranslations } from "@/hooks/use-translations"
import { SubtaskDialog } from "./subtask-dialog"
import { toast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import type { Task } from "@/types/task"

interface TaskSubtasksProps {
  parentTask: Task
}

export default function TaskSubtasks({ parentTask }: TaskSubtasksProps) {
  const { t } = useTranslations()
  const taskService = useTaskService()
  const [subtasks, setSubtasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    loadSubtasks()
  }, [parentTask.id])

  const loadSubtasks = async () => {
    setLoading(true)
    try {
      const subtasksData = await taskService.getSubtasks(parentTask.id)
      setSubtasks(subtasksData || [])
    } catch (error) {
      console.error("Error al cargar subtareas:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las subtareas",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubtaskCreated = () => {
    setIsDialogOpen(false)
    loadSubtasks()
    toast({
      title: "Subtarea creada",
      description: "La subtarea ha sido creada correctamente",
    })
  }

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      console.log(`🎯 [TaskSubtasks] Cambiando status de subtarea ${taskId} a: ${newStatus}`)

      await taskService.updateTaskStatus(taskId, newStatus)

      console.log("✅ [TaskSubtasks] Status actualizado, recargando subtareas...")
      loadSubtasks()

      toast({
        title: "Estado actualizado",
        description: "El estado de la subtarea ha sido actualizado correctamente",
      })
    } catch (error) {
      console.error("❌ [TaskSubtasks] Error al actualizar estado:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de la subtarea",
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
            {t("tasks.status.completed", "Completada")}
          </Badge>
        )
      case "in_progress":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Clock className="h-3 w-3 mr-1" />
            {t("tasks.status.in_progress", "En progreso")}
          </Badge>
        )
      case "cancelled":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            {t("tasks.status.cancelled", "Cancelada")}
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            <AlertCircle className="h-3 w-3 mr-1" />
            {t("tasks.status.pending", "Pendiente")}
          </Badge>
        )
    }
  }

  return (
    <>
      <div className="mt-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xl">{t("tasks.subtasks", "Subtareas")}</CardTitle>
            <Button size="sm" onClick={() => setIsDialogOpen(true)}>
              <PlusCircle className="h-4 w-4 mr-2" />
              {t("tasks.add_subtask", "Añadir subtarea")}
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : subtasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>{t("tasks.no_subtasks", "No hay subtareas")}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {subtasks.map((subtask) => (
                  <div key={subtask.id} className="border rounded-md p-3 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{subtask.title}</div>
                      {getStatusBadge(subtask.status)}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {subtask.assigned_to_user && (
                        <span>
                          {t("tasks.assigned_to", "Asignada a")}: {subtask.assigned_to_user.first_name}{" "}
                          {subtask.assigned_to_user.last_name}
                        </span>
                      )}
                      {subtask.due_date && (
                        <span className="ml-3">
                          {t("tasks.due_date", "Fecha límite")}:{" "}
                          {format(new Date(subtask.due_date), "PPP", { locale: es })}
                        </span>
                      )}
                    </div>
                    <div className="flex mt-2 gap-2">
                      {subtask.status !== "completed" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => handleStatusChange(subtask.id, "completed")}
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          {t("tasks.mark_completed", "Marcar como completada")}
                        </Button>
                      )}
                      {subtask.status === "pending" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => handleStatusChange(subtask.id, "in_progress")}
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          {t("tasks.mark_in_progress", "Marcar en progreso")}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <SubtaskDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSubtaskCreated={handleSubtaskCreated}
        parentTask={parentTask}
      />
    </>
  )
}
