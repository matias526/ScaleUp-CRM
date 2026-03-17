"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
  ArrowLeft,
  Calendar,
  User,
  Building,
  Briefcase,
  CheckCircle,
  XCircle,
  Target,
  Check,
  X,
  Pencil,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Task } from "@/types/task"
import TaskSubtasks from "./task-subtasks"
import { useTaskService } from "@/lib/services/task-service-client"
import { useAuth } from "@/components/auth/auth-provider"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface TaskDetailProps {
  task: Task
}

// Si hay un componente que muestra los detalles de la tarea, asegúrate de que formatee correctamente la fecha
// Por ejemplo, si hay una función que muestra la fecha de vencimiento:
const formatDate = (date?: Date | null) => {
  if (!date) return "-"
  return new Date(date).toISOString().split("T")[0] // Formato YYYY-MM-DD
}

export default function TaskDetail({ task }: TaskDetailProps) {
  const [currentTask, setCurrentTask] = useState<Task>(task)
  const taskService = useTaskService()
  const router = useRouter()
  const { userInfo } = useAuth()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Estados para edición inline
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<string>("")
  const [editDate, setEditDate] = useState<Date | undefined>(undefined)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Verificar si el usuario actual es quien creó la tarea
  const isCreator = userInfo?.id === currentTask.assigned_by

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

  const handleStatusChange = async (newStatus: string) => {
    try {
      console.log(`Updating task ${task.id} status to: ${newStatus}`)

      const updatedTask = await taskService.updateTask(task.id, { status: newStatus })

      if (updatedTask) {
        console.log("Task updated successfully:", updatedTask)
        setCurrentTask({
          ...currentTask,
          status: newStatus as Task["status"],
        })
        toast.success(`Task marked as ${newStatus.replace("_", " ")}`)
      } else {
        console.error("updateTask returned null")
        toast.error("Failed to update task status")
      }
    } catch (error) {
      console.error("Error updating task status:", error)
      toast.error("Failed to update task status")
    }
  }

  // Manejar cambio de status desde el Select
  const handleStatusSelectChange = async (newStatus: string) => {
    console.log(`🎯 [handleStatusSelectChange] Nuevo status seleccionado: ${newStatus}`)
    setIsSubmitting(true)
    await handleStatusChange(newStatus)
    setIsSubmitting(false)
  }

  // Iniciar edición de un campo
  const startEditing = (field: string, value: string) => {
    setEditingField(field)
    setEditValue(value)

    // Si es un campo de fecha, convertir a Date
    if (field === "due_date" && value) {
      setEditDate(new Date(value))
    }
  }

  // Cancelar edición
  const cancelEditing = () => {
    setEditingField(null)
    setEditValue("")
    setEditDate(undefined)
  }

  // Guardar cambios (solo para title, due_date y comments, no para status)
  const saveChanges = async () => {
    if (!editingField) return

    setIsSubmitting(true)
    try {
      const updateData: any = {}

      if (editingField === "title") {
        updateData.title = editValue
      } else if (editingField === "due_date") {
        updateData.due_date = editDate
      } else if (editingField === "comments") {
        updateData.comments = editValue
      }

      console.log("🔄 [saveChanges] Updating task with data:", updateData)
      const updatedTask = await taskService.updateTask(currentTask.id, updateData)

      if (updatedTask) {
        console.log("✅ [saveChanges] Task updated successfully:", updatedTask)

        // Actualizar la tarea en el estado local
        setCurrentTask((prev) => ({
          ...prev,
          ...updateData,
          updated_at: updatedTask.updated_at || new Date().toISOString(),
        }))

        toast.success("Task updated successfully")
      } else {
        console.error("❌ [saveChanges] updateTask returned null")
        toast.error("Failed to update task")
      }
    } catch (error) {
      console.error("❌ [saveChanges] Error updating task:", error)
      toast.error("Failed to update task")
    } finally {
      setIsSubmitting(false)
      cancelEditing()
    }
  }

  // Manejar la eliminación de la tarea
  const handleDeleteTask = async () => {
    if (currentTask.is_commitment) {
      toast.error("Cannot delete commitments")
      setShowDeleteDialog(false)
      return
    }

    setIsDeleting(true)
    try {
      const success = await taskService.deleteTask(currentTask.id)
      if (success) {
        toast.success("Task deleted successfully")
        router.push("/dashboard/tasks")
      } else {
        toast.error("Failed to delete task")
      }
    } catch (error) {
      console.error("Error deleting task:", error)
      toast.error("Failed to delete task")
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <Link href="/dashboard/tasks">
          <Button variant="ghost" className="flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Tasks</span>
          </Button>
        </Link>

        <div className="flex gap-2">
          {isCreator && !currentTask.is_commitment && (
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1 text-red-600 bg-transparent"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete Task</span>
            </Button>
          )}
          {currentTask.status !== "completed" && (
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1 text-green-600 bg-transparent"
              onClick={() => handleStatusChange("completed")}
            >
              <CheckCircle className="h-4 w-4" />
              <span>Mark as Completed</span>
            </Button>
          )}

          {currentTask.status !== "cancelled" && (
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1 text-red-600 bg-transparent"
              onClick={() => handleStatusChange("cancelled")}
            >
              <XCircle className="h-4 w-4" />
              <span>Cancel Task</span>
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            {editingField === "title" ? (
              <div className="flex items-center gap-2 w-full max-w-xl">
                <Input
                  ref={inputRef}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="text-xl font-semibold"
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
                className="group cursor-pointer hover:bg-gray-50 p-1 rounded flex items-center gap-2"
                onClick={() => startEditing("title", currentTask.title)}
              >
                <CardTitle>{currentTask.title}</CardTitle>
                <Pencil className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100" />
              </div>
            )}

            {editingField === "status" ? (
              <div className="flex items-center gap-2">
                <Select
                  value={editValue}
                  onValueChange={(value) => {
                    setEditValue(value)
                    // Auto-save on select change
                    setTimeout(() => {
                      handleStatusChange(value)
                      cancelEditing()
                    }, 100)
                  }}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="h-8 w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div
                className="inline-flex group cursor-pointer"
                onClick={() => startEditing("status", currentTask.status)}
              >
                <Badge className={`${getStatusColor(currentTask.status)} group-hover:ring-2 group-hover:ring-gray-200`}>
                  {currentTask.status.replace("_", " ").charAt(0).toUpperCase() +
                    currentTask.status.replace("_", " ").slice(1)}
                </Badge>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {currentTask.description && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
              <p className="text-gray-700">{currentTask.description}</p>
            </div>
          )}

          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Comments</h3>
            {editingField === "comments" ? (
              <div className="flex flex-col gap-2">
                <Textarea
                  ref={textareaRef}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="min-h-[100px]"
                  disabled={isSubmitting}
                  placeholder="Add comments..."
                />
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-green-600 bg-transparent"
                    onClick={saveChanges}
                    disabled={isSubmitting}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 bg-transparent"
                    onClick={cancelEditing}
                    disabled={isSubmitting}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div
                className="group cursor-pointer hover:bg-gray-50 p-2 rounded flex items-start gap-2 min-h-[60px]"
                onClick={() => startEditing("comments", currentTask.comments || "")}
              >
                <p className="text-gray-700 flex-1">
                  {currentTask.comments || <span className="text-gray-400 italic">No comments yet. Click to add.</span>}
                </p>
                <Pencil className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 mt-1" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Details</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="h-4 w-4 text-gray-400">#</span>
                  <span className="text-sm">
                    <span className="text-gray-500">Type:</span>{" "}
                    <Badge
                      variant="outline"
                      className={
                        currentTask.is_commitment
                          ? "bg-purple-50 text-purple-700 border-purple-200"
                          : "bg-gray-50 text-gray-700 border-gray-200"
                      }
                    >
                      {currentTask.is_commitment ? "Commitment" : "Task"}
                    </Badge>
                  </span>
                </div>

                {currentTask.is_commitment && (
                  <div className="flex items-center gap-2">
                    <span className="h-4 w-4 text-gray-400">✓</span>
                    <span className="text-sm text-gray-500">Commitment Status:</span>
                    <Select
                      value={currentTask.commitment_status || ""}
                      onValueChange={async (value) => {
                        setIsSubmitting(true)
                        try {
                          const updatedTask = await taskService.updateTask(currentTask.id, { commitment_status: value })
                          if (updatedTask) {
                            setCurrentTask((prev) => ({
                              ...prev,
                              commitment_status: value,
                            }))
                            toast.success("Commitment status updated successfully")
                          }
                        } catch (error) {
                          console.error("Error updating commitment status:", error)
                          toast.error("Failed to update commitment status")
                        } finally {
                          setIsSubmitting(false)
                        }
                      }}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger className="h-8 w-[180px]">
                        <SelectValue placeholder="Select status..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="completed">Cumplido</SelectItem>
                        <SelectItem value="not_completed">No cumplido</SelectItem>
                        <SelectItem value="partial">Parcialmente cumplido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {currentTask.assigned_to_user && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">
                      <span className="text-gray-500">Assigned to:</span> {currentTask.assigned_to_user.first_name}{" "}
                      {currentTask.assigned_to_user.last_name}
                    </span>
                  </div>
                )}

                {editingField === "due_date" ? (
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <Input
                        type="date"
                        value={editDate ? formatDate(editDate) : ""}
                        onChange={(e) => {
                          if (e.target.value) {
                            setEditDate(new Date(e.target.value))
                          } else {
                            setEditDate(undefined)
                          }
                        }}
                        className="pl-10 transition-all focus:ring-2 focus:ring-primary/20"
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
                    className="flex items-center gap-2 group cursor-pointer hover:bg-gray-50 p-1 rounded"
                    onClick={() => startEditing("due_date", currentTask.due_date || "")}
                  >
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">
                      <span className="text-gray-500">Due date:</span>{" "}
                      {currentTask.due_date ? (
                        format(new Date(currentTask.due_date), "PPP", { locale: es })
                      ) : (
                        <span className="text-gray-400">No due date</span>
                      )}
                    </span>
                    <Pencil className="h-3.5 w-3.5 text-gray-400 opacity-0 group-hover:opacity-100" />
                  </div>
                )}

                {currentTask.task_type && (
                  <div className="flex items-center gap-2">
                    <span className="h-4 w-4 text-gray-400">#</span>
                    <span className="text-sm">
                      <span className="text-gray-500">Type:</span> {currentTask.task_type.name}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Related to</h3>
              <div className="space-y-3">
                {currentTask.opportunity && (
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">
                      <span className="text-gray-500">Opportunity:</span> {currentTask.opportunity.title}
                    </span>
                  </div>
                )}

                {currentTask.tech_company && (
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">
                      <span className="text-gray-500">Tech Company:</span> {currentTask.tech_company.name}
                    </span>
                  </div>
                )}

                {currentTask.partner && (
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">
                      <span className="text-gray-500">Partner:</span> {currentTask.partner.name}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Subtasks section */}
          <TaskSubtasks parentTask={currentTask} />
        </CardContent>
      </Card>

      {/* Diálogo de confirmación para eliminar tarea */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this task?</AlertDialogTitle>
            <AlertDialogDescription>
              {currentTask.is_commitment
                ? "This is a commitment and cannot be deleted."
                : "This action cannot be undone. This will permanently delete the task and all its subtasks."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            {!currentTask.is_commitment && (
              <AlertDialogAction
                onClick={handleDeleteTask}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
