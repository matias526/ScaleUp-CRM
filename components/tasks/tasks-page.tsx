"use client"

import { useState, useEffect } from "react"
import { useTaskService } from "@/lib/services/task-service-client"
import { useTranslations } from "@/hooks/use-translations"
import { useToast } from "@/components/ui/use-toast"
import type { Task } from "@/types/task"
import TasksTable from "@/components/tasks/tasks-table"
import TasksBoardView from "@/components/tasks/tasks-board-view"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LayoutGrid, List } from "lucide-react"

export default function TasksPage() {
  const { t } = useTranslations()
  const { toast } = useToast()
  const taskService = useTaskService()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<"list" | "board">("list")

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true)
        const data = await taskService.getTasks()
        setTasks(data)
      } catch (error) {
        console.error("Error fetching tasks:", error)
        toast({
          title: t("tasks.fetch_error", "Error fetching tasks"),
          description: t("tasks.try_again", "Please try again later"),
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchTasks()
  }, [taskService, toast, t])

  const handleTaskUpdate = (updatedTask: Task) => {
    setTasks((prevTasks) => prevTasks.map((task) => (task.id === updatedTask.id ? updatedTask : task)))
  }

  const getLocale = () => {
    // Simplificado para este ejemplo, idealmente obtendría el locale del usuario
    return es
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t("tasks.title", "Tasks")}</h1>

        <Tabs defaultValue={view} onValueChange={(value) => setView(value as "list" | "board")}>
          <TabsList>
            <TabsTrigger value="list">
              <List className="h-4 w-4 mr-2" />
              {t("tasks.list_view", "List")}
            </TabsTrigger>
            <TabsTrigger value="board">
              <LayoutGrid className="h-4 w-4 mr-2" />
              {t("tasks.board_view", "Board")}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p>{t("common.loading", "Loading...")}</p>
        </div>
      ) : (
        <>
          {view === "list" ? (
            <TasksTable tasks={tasks} />
          ) : (
            <TasksBoardView tasks={tasks} onTaskUpdate={handleTaskUpdate} />
          )}
        </>
      )}
    </div>
  )
}

import { es } from "date-fns/locale"
