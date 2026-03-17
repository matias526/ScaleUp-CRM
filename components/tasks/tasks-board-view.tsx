"use client"
import { format } from "date-fns"
import { es, enUS, pt } from "date-fns/locale"
import { Calendar, User, Building, Briefcase, Eye, Clock, Target } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useTaskService } from "@/lib/services/task-service-client"
import { useToast } from "@/components/ui/use-toast"
import type { Task } from "@/types/task"
import { useTranslations } from "@/hooks/use-translations"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface TasksBoardViewProps {
  tasks: Task[]
  onTaskUpdate?: (updatedTask: Task) => void
}

// Estados posibles para las tareas
const TASK_STATUSES = ["pending", "in_progress", "completed", "cancelled"] as const
type TaskStatus = (typeof TASK_STATUSES)[number]

export default function TasksBoardView({ tasks, onTaskUpdate }: TasksBoardViewProps) {
  const { t, language } = useTranslations()
  const { toast } = useToast()
  const taskService = useTaskService()
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [isUpdating, setIsUpdating] = useState<boolean>(false)
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks)

  // Actualizar las tareas locales cuando cambian las props
  useEffect(() => {
    setLocalTasks(tasks)
  }, [tasks])

  // Configurar sensores para drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Distancia mínima para activar el arrastre
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  // Agrupar tareas por estado
  const tasksByStatus = TASK_STATUSES.reduce(
    (acc, status) => {
      acc[status] = localTasks.filter((task) => task.status === status)
      return acc
    },
    {} as Record<TaskStatus, Task[]>,
  )

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

  // Manejar inicio de arrastre
  function handleDragStart(event: DragStartEvent) {
    const { active } = event
    const task = localTasks.find((t) => t.id === active.id)
    if (task) {
      setActiveTask(task)
    }
  }

  // Manejar fin de arrastre
  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (!over) {
      setActiveTask(null)
      return
    }

    // Extraer el ID de la tarea y el contenedor de destino
    const taskId = active.id as string
    const overId = over.id as string

    // Verificar si el contenedor de destino es una columna de estado válida
    const isValidStatus = TASK_STATUSES.includes(overId as TaskStatus)

    if (!isValidStatus) {
      setActiveTask(null)
      return
    }

    const newStatus = overId as TaskStatus
    const task = localTasks.find((t) => t.id === taskId)

    if (!task || task.status === newStatus) {
      setActiveTask(null)
      return
    }

    setIsUpdating(true)

    try {
      console.log(`Actualizando tarea ${taskId} a estado: ${newStatus}`)

      // Actualizar localmente primero para una respuesta inmediata de la UI
      const updatedLocalTasks = localTasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      setLocalTasks(updatedLocalTasks)

      // Actualizar el estado de la tarea en la base de datos
      const updatedTask = await taskService.updateTaskStatus(taskId, newStatus)

      // Actualizar el estado local con la respuesta del servidor
      setLocalTasks(localTasks.map((t) => (t.id === taskId ? updatedTask : t)))

      // Notificar al componente padre si existe la función de callback
      if (onTaskUpdate) {
        onTaskUpdate(updatedTask)
      }

      toast({
        title: t("tasks.status_updated", "Task status updated"),
        description: t("tasks.moved_to_status", `Task moved to ${getStatusTranslation(newStatus)}`),
      })
    } catch (error) {
      console.error("Error updating task status:", error)

      // Revertir cambios locales en caso de error
      setLocalTasks(tasks)

      toast({
        title: t("tasks.update_error", "Error updating task"),
        description: t("tasks.try_again", "Please try again later"),
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
      setActiveTask(null)
    }
  }

  // Obtener el color de fondo para cada estado
  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case "pending":
        return "bg-yellow-50 border-yellow-200"
      case "in_progress":
        return "bg-blue-50 border-blue-200"
      case "completed":
        return "bg-green-50 border-green-200"
      case "cancelled":
        return "bg-red-50 border-red-200"
      default:
        return "bg-gray-50 border-gray-200"
    }
  }

  // Obtener el color del borde superior para cada tarjeta
  const getCardBorderColor = (status: TaskStatus) => {
    switch (status) {
      case "pending":
        return "border-t-4 border-t-yellow-400"
      case "in_progress":
        return "border-t-4 border-t-blue-400"
      case "completed":
        return "border-t-4 border-t-green-400"
      case "cancelled":
        return "border-t-4 border-t-red-400"
      default:
        return "border-t-4 border-t-gray-400"
    }
  }

  // Obtener la traducción para cada estado
  const getStatusTranslation = (status: string) => {
    return t(
      `tasks.status.${status}`,
      status.replace("_", " ").charAt(0).toUpperCase() + status.replace("_", " ").slice(1),
    )
  }

  // Obtener el color del encabezado para cada estado
  const getHeaderColor = (status: TaskStatus) => {
    switch (status) {
      case "pending":
        return "border-b border-yellow-200 bg-yellow-100/50"
      case "in_progress":
        return "border-b border-blue-200 bg-blue-100/50"
      case "completed":
        return "border-b border-green-200 bg-green-100/50"
      case "cancelled":
        return "border-b border-red-200 bg-red-100/50"
      default:
        return "border-b border-gray-200 bg-gray-100/50"
    }
  }

  // Obtener el color del texto para cada estado
  const getTextColor = (status: TaskStatus) => {
    switch (status) {
      case "pending":
        return "text-yellow-800"
      case "in_progress":
        return "text-blue-800"
      case "completed":
        return "text-green-800"
      case "cancelled":
        return "text-red-800"
      default:
        return "text-gray-800"
    }
  }

  // Obtener el color del badge para cada estado
  const getBadgeColor = (status: TaskStatus) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "completed":
        return "bg-green-100 text-green-800 border-green-200"
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      autoScroll={true}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {TASK_STATUSES.map((status) => (
          <TaskColumn
            key={status}
            id={status}
            status={status}
            tasks={tasksByStatus[status]}
            getStatusColor={getStatusColor}
            getCardBorderColor={getCardBorderColor}
            getStatusTranslation={getStatusTranslation}
            getHeaderColor={getHeaderColor}
            getTextColor={getTextColor}
            getBadgeColor={getBadgeColor}
            isUpdating={isUpdating}
            getLocale={getLocale}
          />
        ))}
      </div>

      {/* Overlay para mostrar la tarea mientras se arrastra */}
      <DragOverlay>
        {activeTask && (
          <Card className={`${getCardBorderColor(activeTask.status as TaskStatus)} shadow-md w-[250px]`}>
            <CardHeader className="p-3 pb-0">
              <CardTitle className="text-sm font-medium line-clamp-2">{activeTask.title}</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-2">
              {activeTask.assigned_to_user && (
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <User className="h-3 w-3" />
                  <span className="truncate">
                    {activeTask.assigned_to_user.first_name} {activeTask.assigned_to_user.last_name}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </DragOverlay>
    </DndContext>
  )
}

// Componente para cada columna de tareas
function TaskColumn({
  id,
  status,
  tasks,
  getStatusColor,
  getCardBorderColor,
  getStatusTranslation,
  getHeaderColor,
  getTextColor,
  getBadgeColor,
  isUpdating,
  getLocale,
}: {
  id: string
  status: TaskStatus
  tasks: Task[]
  getStatusColor: (status: TaskStatus) => string
  getCardBorderColor: (status: TaskStatus) => string
  getStatusTranslation: (status: string) => string
  getHeaderColor: (status: TaskStatus) => string
  getTextColor: (status: TaskStatus) => string
  getBadgeColor: (status: TaskStatus) => string
  isUpdating: boolean
  getLocale: () => any
}) {
  const { t } = useTranslations()
  const { setNodeRef } = useDroppable({
    id,
  })

  return (
    <div className={`rounded-lg border ${getStatusColor(status)} overflow-hidden`}>
      <div className={`p-3 ${getHeaderColor(status)} flex justify-between items-center`}>
        <h3 className={`font-medium ${getTextColor(status)} flex items-center`}>
          {getStatusTranslation(status)}
          <Badge variant="outline" className={`ml-2 ${getBadgeColor(status)}`}>
            {tasks.length}
          </Badge>
        </h3>
      </div>
      <ScrollArea className="h-[calc(100vh-280px)] p-2">
        <div ref={setNodeRef} className="min-h-[200px]">
          <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3 p-1">
              {tasks.length === 0 ? (
                <div className="text-center py-8 text-sm text-gray-500">
                  {t("tasks.no_tasks_in_status", "No tasks in this status")}
                </div>
              ) : (
                tasks.map((task) => (
                  <SortableTaskCard
                    key={task.id}
                    task={task}
                    borderColorClass={getCardBorderColor(status)}
                    disabled={isUpdating}
                    getLocale={getLocale}
                  />
                ))
              )}
            </div>
          </SortableContext>
        </div>
      </ScrollArea>
    </div>
  )
}

// Componente para cada tarjeta de tarea con funcionalidad de arrastrar
function SortableTaskCard({
  task,
  borderColorClass,
  disabled,
  getLocale,
}: {
  task: Task
  borderColorClass: string
  disabled: boolean
  getLocale: () => any
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: {
      type: "task",
      task,
    },
    disabled,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`touch-manipulation ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
    >
      <TaskCard task={task} borderColorClass={borderColorClass} getLocale={getLocale} />
    </div>
  )
}

// Componente para cada tarjeta de tarea
function TaskCard({
  task,
  borderColorClass,
  getLocale,
}: {
  task: Task
  borderColorClass: string
  getLocale: () => any
}) {
  const { t } = useTranslations()
  const locale = getLocale()

  return (
    <Card className={`${borderColorClass} shadow-sm hover:shadow transition-shadow`}>
      <CardHeader className="p-3 pb-0">
        <CardTitle className="text-sm font-medium line-clamp-2">{task.title}</CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-2 space-y-2">
        {task.assigned_to_user && (
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <User className="h-3 w-3" />
            <span className="truncate">
              {task.assigned_to_user.first_name} {task.assigned_to_user.last_name}
            </span>
          </div>
        )}

        {task.due_date && (
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <Calendar className="h-3 w-3" />
            <span>{format(new Date(task.due_date), "PPP", { locale })}</span>
          </div>
        )}

        <div className="flex flex-col gap-1">
          {task.opportunity && (
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <Target className="h-3 w-3" />
              <span className="truncate">{task.opportunity.title}</span>
            </div>
          )}
          {task.tech_company && (
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <Building className="h-3 w-3" />
              <span className="truncate">{task.tech_company.name}</span>
            </div>
          )}
          {task.partner && (
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <Briefcase className="h-3 w-3" />
              <span className="truncate">{task.partner.name}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-3 pt-0 flex justify-between items-center">
        <div className="text-xs text-gray-500 flex items-center">
          <Clock className="h-3 w-3 mr-1" />
          {format(new Date(task.created_at), "dd/MM/yy", { locale })}
        </div>
        <Link href={`/dashboard/tasks/${task.id}`}>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
            <Eye className="h-3.5 w-3.5" />
            <span className="sr-only">{t("tasks.view", "View task")}</span>
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
