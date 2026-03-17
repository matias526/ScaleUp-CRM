import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { TaskTypeInsert, TaskTypeUpdate } from "@/types/task"

// Esta versión del servicio es para Client Components
export function useTaskTypeService() {
  const supabase = createClientComponentClient()

  const getTaskTypes = async () => {
    const { data, error } = await supabase.from("task_types").select("*").order("name", { ascending: true })

    if (error) {
      console.error("Error fetching task types:", error)
      throw error
    }

    return data || []
  }

  const getTaskTypeById = async (id: string) => {
    const { data, error } = await supabase.from("task_types").select("*").eq("id", id).single()

    if (error) {
      console.error(`Error fetching task type with id ${id}:`, error)
      throw error
    }

    return data
  }

  const createTaskType = async (taskType: TaskTypeInsert) => {
    const { data, error } = await supabase.from("task_types").insert(taskType).select().single()

    if (error) {
      console.error("Error creating task type:", error)
      throw error
    }

    return data
  }

  const updateTaskType = async (id: string, taskType: TaskTypeUpdate) => {
    const { data, error } = await supabase.from("task_types").update(taskType).eq("id", id).select().single()

    if (error) {
      console.error(`Error updating task type with id ${id}:`, error)
      throw error
    }

    return data
  }

  const deleteTaskType = async (id: string) => {
    const { error } = await supabase.from("task_types").delete().eq("id", id)

    if (error) {
      console.error(`Error deleting task type with id ${id}:`, error)
      throw error
    }

    return true
  }

  return {
    getTaskTypes,
    getTaskTypeById,
    createTaskType,
    updateTaskType,
    deleteTaskType,
  }
}
