"use client"

//import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { supabase } from "@/lib/supabase/client"
import { useState } from "react"
import type { Task, TaskInsert, TaskUpdate } from "@/types/task"

export function useTaskService() {
  //const supabase = createClientComponentClient()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Obtener todas las tareas (solo para administradores)
  const getTasks = async (): Promise<Task[]> => {
    setIsLoading(true)
    setError(null)

    try {
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
        .is("parent_task_id", null) // Solo tareas principales
        .order("due_date", { ascending: true, nullsLast: true })

      if (error) throw error

      console.log(`Cliente - Se obtuvieron ${data?.length || 0} tareas (todas)`)
      return data || []
    } catch (err) {
      console.error("Error al obtener tareas:", err)
      setError(err instanceof Error ? err : new Error(String(err)))
      return []
    } finally {
      setIsLoading(false)
    }
  }

  // Obtener tareas para un usuario específico (asignadas a él o creadas por él)
  const getTasksForUser = async (userId: string): Promise<Task[]> => {
    setIsLoading(true)
    setError(null)

    try {
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
        .or(`assigned_to.eq.${userId},assigned_by.eq.${userId}`)
        .is("parent_task_id", null) // Solo tareas principales
        .order("due_date", { ascending: true, nullsLast: true })

      if (error) throw error

      console.log(`Cliente - Se obtuvieron ${data?.length || 0} tareas para el usuario ${userId}`)
      return data || []
    } catch (err) {
      console.error(`Error al obtener tareas para el usuario ${userId}:`, err)
      setError(err instanceof Error ? err : new Error(String(err)))
      return []
    } finally {
      setIsLoading(false)
    }
  }

  // Obtener tareas para un BDD (todas las tareas de sus partners)
  const getTasksForBDD = async (userId: string): Promise<Task[]> => {
    setIsLoading(true)
    setError(null)

    try {
      // Primero obtenemos los partners asociados al BDD
      const { data: userPartners, error: userPartnersError } = await supabase
        .from("users")
        .select("partner_id")
        .eq("id", userId)
        .single()

      if (userPartnersError) throw userPartnersError

      const partnerId = userPartners?.partner_id

      if (!partnerId) {
        console.log(`El usuario ${userId} no tiene un partner asociado`)
        return []
      }

      // Luego obtenemos las tareas de esos partners
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
        .eq("partner_id", partnerId)
        .is("parent_task_id", null) // Solo tareas principales
        .order("due_date", { ascending: true, nullsLast: true })

      if (error) throw error

      console.log(`Cliente - Se obtuvieron ${data?.length || 0} tareas para el BDD ${userId} (partner ${partnerId})`)
      return data || []
    } catch (err) {
      console.error(`Error al obtener tareas para el BDD ${userId}:`, err)
      setError(err instanceof Error ? err : new Error(String(err)))
      return []
    } finally {
      setIsLoading(false)
    }
  }

  // Obtener una tarea por su ID
  const getTaskById = async (id: string): Promise<Task | null> => {
    setIsLoading(true)
    setError(null)

    try {
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

      if (error) throw error

      return data
    } catch (err) {
      console.error(`Error al obtener la tarea ${id}:`, err)
      setError(err instanceof Error ? err : new Error(String(err)))
      return null
    } finally {
      setIsLoading(false)
    }
  }

  // Obtener subtareas de una tarea principal
  const getSubtasks = async (parentTaskId: string): Promise<Task[]> => {
    setIsLoading(true)
    setError(null)

    try {
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
        .eq("parent_task_id", parentTaskId)
        .order("due_date", { ascending: true, nullsLast: true })

      if (error) throw error

      console.log(`Cliente - Se obtuvieron ${data?.length || 0} subtareas para la tarea ${parentTaskId}`)
      return data || []
    } catch (err) {
      console.error(`Error al obtener subtareas para la tarea ${parentTaskId}:`, err)
      setError(err instanceof Error ? err : new Error(String(err)))
      return []
    } finally {
      setIsLoading(false)
    }
  }

  // Obtener tareas por oportunidad
  const getTasksByOpportunity = async (opportunityId: string): Promise<Task[]> => {
    setIsLoading(true)
    setError(null)

    try {
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
        .eq("opportunity_id", opportunityId)
        .order("due_date", { ascending: true, nullsLast: true })

      if (error) throw error

      console.log(`Cliente - Se obtuvieron ${data?.length || 0} tareas para la oportunidad ${opportunityId}`)
      return data || []
    } catch (err) {
      console.error(`Error al obtener tareas para la oportunidad ${opportunityId}:`, err)
      setError(err instanceof Error ? err : new Error(String(err)))
      return []
    } finally {
      setIsLoading(false)
    }
  }

  // Obtener tareas por partner
  const getTasksByPartnerId = async (partnerId: string): Promise<Task[]> => {
    setIsLoading(true)
    setError(null)

    try {
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
        .eq("partner_id", partnerId)
        .order("due_date", { ascending: true, nullsLast: true })

      if (error) throw error

      console.log(`Cliente - Se obtuvieron ${data?.length || 0} tareas para el partner ${partnerId}`)
      return data || []
    } catch (err) {
      console.error(`Error al obtener tareas para el partner ${partnerId}:`, err)
      setError(err instanceof Error ? err : new Error(String(err)))
      return []
    } finally {
      setIsLoading(false)
    }
  }

  // Obtener tareas por tech company
  const getTasksByTechCompanyId = async (techCompanyId: string): Promise<Task[]> => {
    setIsLoading(true)
    setError(null)

    try {
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
        .eq("tech_company_id", techCompanyId)
        .order("due_date", { ascending: true, nullsLast: true })

      if (error) throw error

      console.log(`Cliente - Se obtuvieron ${data?.length || 0} tareas para la tech company ${techCompanyId}`)
      return data || []
    } catch (err) {
      console.error(`Error al obtener tareas para la tech company ${techCompanyId}:`, err)
      setError(err instanceof Error ? err : new Error(String(err)))
      return []
    } finally {
      setIsLoading(false)
    }
  }

  // Actualizar el estado de una tarea - VERSIÓN CORREGIDA CON MÁS DEBUG
  const updateTaskStatus = async (taskId: string, status: string): Promise<Task | null> => {
    setIsLoading(true)
    setError(null)

    try {
      console.log(`🔄 [updateTaskStatus] Iniciando actualización:`)
      console.log(`   - Task ID: ${taskId}`)
      console.log(`   - Nuevo status: ${status}`)
      console.log(`   - Tipo de status: ${typeof status}`)

      // Paso 1: Verificar que la tarea existe y obtener el status actual
      const { data: existingTask, error: fetchError } = await supabase
        .from("tasks")
        .select("id, status, title")
        .eq("id", taskId)
        .single()

      if (fetchError) {
        console.error("❌ Error al buscar la tarea:", fetchError)
        throw fetchError
      }

      console.log("✅ Tarea encontrada:")
      console.log(`   - ID: ${existingTask.id}`)
      console.log(`   - Status actual: ${existingTask.status}`)
      console.log(`   - Título: ${existingTask.title}`)

      // Paso 2: Preparar el objeto de actualización
      const updateData = { status: status }
      console.log("🔄 Datos de actualización:", updateData)

      // Paso 3: Hacer el update
      const { data: updateResult, error: updateError } = await supabase
        .from("tasks")
        .update(updateData)
        .eq("id", taskId)
        .select("id, status, title, updated_at")

      if (updateError) {
        console.error("❌ Error en el update:", updateError)
        throw updateError
      }

      console.log("✅ Update exitoso:")
      console.log("   - Resultado:", updateResult)

      if (updateResult && updateResult.length > 0) {
        const updatedRecord = updateResult[0]
        console.log(`   - Nuevo status en DB: ${updatedRecord.status}`)
        console.log(`   - Updated at: ${updatedRecord.updated_at}`)
      }

      // Paso 4: Verificar que el cambio se aplicó correctamente
      const { data: verificationTask, error: verificationError } = await supabase
        .from("tasks")
        .select("id, status, title")
        .eq("id", taskId)
        .single()

      if (verificationError) {
        console.error("❌ Error en verificación:", verificationError)
      } else {
        console.log("🔍 Verificación post-update:")
        console.log(`   - Status verificado: ${verificationTask.status}`)
        console.log(`   - ¿Cambio aplicado? ${verificationTask.status === status ? "✅ SÍ" : "❌ NO"}`)
      }

      // Paso 5: Obtener la tarea completa actualizada
      const { data: fullTask, error: fullFetchError } = await supabase
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
        .eq("id", taskId)
        .single()

      if (fullFetchError) {
        console.error("❌ Error al obtener tarea completa:", fullFetchError)
        // Devolver un objeto básico con el nuevo status
        return {
          ...existingTask,
          status: status as Task["status"],
          updated_at: new Date().toISOString(),
        } as Task
      }

      console.log("✅ Tarea completa obtenida:")
      console.log(`   - Status final: ${fullTask.status}`)
      console.log(`   - ¿Status correcto? ${fullTask.status === status ? "✅ SÍ" : "❌ NO"}`)

      return fullTask
    } catch (err) {
      console.error(`❌ Error general al actualizar la tarea ${taskId}:`, err)
      setError(err instanceof Error ? err : new Error(String(err)))
      return null
    } finally {
      setIsLoading(false)
    }
  }

  // Crear una nueva tarea
  const createTask = async (task: TaskInsert): Promise<Task | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.from("tasks").insert(task).select().single()

      if (error) throw error

      return data
    } catch (err) {
      console.error("Error al crear la tarea:", err)
      setError(err instanceof Error ? err : new Error(String(err)))
      return null
    } finally {
      setIsLoading(false)
    }
  }

  // Actualizar una tarea existente
  const updateTask = async (id: string, task: TaskUpdate): Promise<Task | null> => {
    setIsLoading(true)
    setError(null)

    try {
      console.log(`🔄 Actualizando tarea ${id} con:`, task)

      const { data, error } = await supabase
        .from("tasks")
        .update(task)
        .eq("id", id)
        .select(`
          *,
          assigned_to_user:users!tasks_assigned_to_fkey(id, first_name, last_name),
          assigned_by_user:users!tasks_assigned_by_fkey(id, first_name, last_name),
          opportunity:opportunities(id, title),
          tech_company:tech_companies(id, name),
          partner:partners(id, name),
          task_type:task_types(id, name, code)
        `)
        .single()

      if (error) {
        console.error("❌ Error en updateTask:", error)
        throw error
      }

      console.log("✅ updateTask exitoso:", data)
      return data
    } catch (err) {
      console.error(`❌ Error al actualizar la tarea ${id}:`, err)
      setError(err instanceof Error ? err : new Error(String(err)))
      return null
    } finally {
      setIsLoading(false)
    }
  }

  // Eliminar una tarea
  const deleteTask = async (id: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.from("tasks").delete().eq("id", id)

      if (error) throw error

      return true
    } catch (err) {
      console.error(`Error al eliminar la tarea ${id}:`, err)
      setError(err instanceof Error ? err : new Error(String(err)))
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return {
    getTasks,
    getTasksForUser,
    getTasksForBDD,
    getTaskById,
    getSubtasks,
    getTasksByOpportunity,
    getTasksByPartnerId,
    getTasksByTechCompanyId,
    updateTaskStatus,
    createTask,
    updateTask,
    deleteTask,
    isLoading,
    error,
  }
}
