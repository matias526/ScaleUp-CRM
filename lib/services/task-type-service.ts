//import { createClient } from "@/lib/supabase/server"
import { createServerClient } from "@/lib/supabase/server"
import type { TaskTypeInsert, TaskTypeUpdate } from "@/types/task"

// Esta función solo debe usarse en Server Components
export async function getTaskTypes() {
  const supabase = createServerClient()

  const { data, error } = await supabase.from("task_types").select("*").order("name", { ascending: true })

  if (error) {
    console.error("Error fetching task types:", error)
    throw error
  }

  return data || []
}

// Esta función solo debe usarse en Server Components
export async function getTaskTypeById(id: string) {
  const supabase = createServerClient()

  const { data, error } = await supabase.from("task_types").select("*").eq("id", id).single()

  if (error) {
    console.error(`Error fetching task type with id ${id}:`, error)
    throw error
  }

  return data
}

// Esta función solo debe usarse en Server Components
export async function createTaskType(taskType: TaskTypeInsert) {
  const supabase = createServerClient()

  const { data, error } = await supabase.from("task_types").insert(taskType).select().single()

  if (error) {
    console.error("Error creating task type:", error)
    throw error
  }

  return data
}

// Esta función solo debe usarse en Server Components
export async function updateTaskType(id: string, taskType: TaskTypeUpdate) {
  const supabase = createServerClient()

  const { data, error } = await supabase.from("task_types").update(taskType).eq("id", id).select().single()

  if (error) {
    console.error(`Error updating task type with id ${id}:`, error)
    throw error
  }

  return data
}

// Esta función solo debe usarse en Server Components
export async function deleteTaskType(id: string) {
  const supabase = createServerClient()

  const { error } = await supabase.from("task_types").delete().eq("id", id)

  if (error) {
    console.error(`Error deleting task type with id ${id}:`, error)
    throw error
  }

  return true
}
