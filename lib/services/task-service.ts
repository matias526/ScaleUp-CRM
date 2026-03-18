//import { createClient } from "@/lib/supabase/server"
import { createServerClient } from "@/lib/supabase/server"
import type { TaskInsert, TaskUpdate } from "@/types/task"

// Esta función solo debe usarse en Server Components
export async function getTasks(userId?: string, isAdmin?: boolean) {
  const supabase = createServerClient()

  console.log(`getTasks called with userId: ${userId}, isAdmin: ${isAdmin}`)

  let query = supabase
    .from("tasks")
    .select(`
      *,
      assigned_to_user:users!tasks_assigned_to_fkey(id, first_name, last_name),
      assigned_by_user:users!tasks_assigned_by_fkey(id, first_name, last_name),
      opportunity:opportunities(id, title),
      tech_company:tech_companies(id, name),
      partner:partners(id, name),
      task_type:task_types(id, name, code)
    `)
    .is("parent_task_id", null) // Solo tareas principales

  // Si no es admin y hay un userId, filtrar por tareas asignadas o creadas por el usuario
  if (!isAdmin && userId) {
    console.log(`Applying filter for non-admin user: ${userId}`)
    query = query.or(`assigned_to.eq.${userId},assigned_by.eq.${userId}`)
  } else {
    console.log(`No filter applied: isAdmin=${isAdmin}, userId=${userId}`)
  }

  // Ordenar por fecha de vencimiento
  query = query.order("due_date", { ascending: true, nullsLast: true })

  const { data, error } = await query

  if (error) {
    console.error("Error fetching tasks:", error)
    throw error
  }

  console.log(`Retrieved ${data?.length || 0} tasks`)
  return data || []
}

// Esta función solo debe usarse en Server Components
export async function getTaskById(id: string) {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from("tasks")
    .select(`
      *,
      assigned_to_user:users!tasks_assigned_to_fkey(id, first_name, last_name),
      assigned_by_user:users!tasks_assigned_by_fkey(id, first_name, last_name),
      opportunity:opportunities(id, title),
      tech_company:tech_companies(id, name),
      partner:partners(id, name),
      task_type:task_types(id, name, code)
    `)
    .eq("id", id)
    .single()

  if (error) {
    console.error(`Error fetching task with id ${id}:`, error)
    throw error
  }

  return data
}

// Esta función solo debe usarse en Server Components
export async function createTask(task: TaskInsert) {
  const supabase = createServerClient()

  const { data, error } = await supabase.from("tasks").insert(task).select().single()

  if (error) {
    console.error("Error creating task:", error)
    throw error
  }

  return data
}

// Esta función solo debe usarse en Server Components
export async function updateTask(id: string, task: TaskUpdate) {
  const supabase = createServerClient()

  const { data, error } = await supabase.from("tasks").update(task).eq("id", id).select().single()

  if (error) {
    console.error(`Error updating task with id ${id}:`, error)
    throw error
  }

  return data
}

// Esta función solo debe usarse en Server Components
export async function deleteTask(id: string) {
  const supabase = createServerClient()

  const { error } = await supabase.from("tasks").delete().eq("id", id)

  if (error) {
    console.error(`Error deleting task with id ${id}:`, error)
    throw error
  }

  return true
}
