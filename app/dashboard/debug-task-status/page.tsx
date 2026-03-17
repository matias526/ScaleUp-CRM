"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTaskService } from "@/lib/services/task-service-client"
import { toast } from "sonner"

export default function DebugTaskStatus() {
  const [taskId, setTaskId] = useState("")
  const [status, setStatus] = useState("pending")
  const [result, setResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [recentTasks, setRecentTasks] = useState<any[]>([])
  const taskService = useTaskService()

  // Cargar tareas recientes al inicio
  useEffect(() => {
    const loadRecentTasks = async () => {
      try {
        const tasks = await taskService.getTasks()
        setRecentTasks(tasks.slice(0, 10)) // Mostrar solo las 10 más recientes
      } catch (error) {
        console.error("Error loading recent tasks:", error)
      }
    }

    loadRecentTasks()
  }, [taskService])

  // Método 1: Usando la API directamente
  const updateViaAPI = async () => {
    if (!taskId) {
      toast.error("Please select a task")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/debug/task-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ taskId, status }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update task")
      }

      setResult({
        method: "API",
        data,
        timestamp: new Date().toISOString(),
      })

      toast.success("Task updated via API")
    } catch (error) {
      console.error("Error updating task via API:", error)
      toast.error(`API Error: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Método 2: Usando el servicio de tareas
  const updateViaService = async () => {
    if (!taskId) {
      toast.error("Please select a task")
      return
    }

    setIsLoading(true)
    try {
      console.log(`[DEBUG] Actualizando tarea ${taskId} a estado: ${status} via Service`)

      const updatedTask = await taskService.updateTaskStatus(taskId, status)

      setResult({
        method: "Service",
        data: updatedTask,
        timestamp: new Date().toISOString(),
      })

      toast.success("Task updated via Service")
    } catch (error) {
      console.error("Error updating task via Service:", error)
      toast.error(`Service Error: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Método 3: Usando updateTask del servicio
  const updateViaUpdateTask = async () => {
    if (!taskId) {
      toast.error("Please select a task")
      return
    }

    setIsLoading(true)
    try {
      console.log(`[DEBUG] Actualizando tarea ${taskId} a estado: ${status} via updateTask`)

      const updatedTask = await taskService.updateTask(taskId, { status })

      setResult({
        method: "updateTask",
        data: updatedTask,
        timestamp: new Date().toISOString(),
      })

      toast.success("Task updated via updateTask")
    } catch (error) {
      console.error("Error updating task via updateTask:", error)
      toast.error(`updateTask Error: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Task Status Debug Tool</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Update Task Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Task ID</label>
                <div className="flex gap-2">
                  <Input
                    value={taskId}
                    onChange={(e) => setTaskId(e.target.value)}
                    placeholder="Enter task ID"
                    className="flex-1"
                  />
                  <Select value={taskId} onValueChange={setTaskId}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select task" />
                    </SelectTrigger>
                    <SelectContent>
                      {recentTasks.map((task) => (
                        <SelectItem key={task.id} value={task.id}>
                          {task.title.substring(0, 20)}...
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
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

              <div className="flex flex-col gap-2">
                <Button onClick={updateViaAPI} disabled={isLoading}>
                  Update via API
                </Button>
                <Button onClick={updateViaService} disabled={isLoading} variant="outline">
                  Update via Service (updateTaskStatus)
                </Button>
                <Button onClick={updateViaUpdateTask} disabled={isLoading} variant="secondary">
                  Update via Service (updateTask)
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Result</CardTitle>
          </CardHeader>
          <CardContent>
            {result ? (
              <div>
                <div className="mb-2 text-sm text-gray-500">
                  Method: <span className="font-semibold">{result.method}</span> • Time:{" "}
                  <span className="font-semibold">{new Date(result.timestamp).toLocaleTimeString()}</span>
                </div>
                <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-[400px] text-xs">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="text-gray-500 text-center py-8">
                No results yet. Update a task to see the result here.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
