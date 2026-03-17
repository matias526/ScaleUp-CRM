import { createClient } from "@/lib/supabase/client"
import type { Tables } from "@/types/supabase"

export type TechField = Tables<"tech_fields">

// Obtener todos los campos tecnológicos
export async function getTechFields(): Promise<TechField[]> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase.from("tech_fields").select("*").order("name")

    if (error) {
      console.error("Error al obtener campos tecnológicos:", error)
      return []
    }

    return data
  } catch (error) {
    console.error("Error inesperado al obtener campos tecnológicos:", error)
    return []
  }
}

// Obtener campos tecnológicos por empresa tecnológica
export async function getTechFieldsByTechCompanyId(techCompanyId: string): Promise<TechField[]> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("tech_fields")
      .select("*")
      .eq("tech_company_id", techCompanyId)
      .order("name")

    if (error) {
      console.error(`Error al obtener campos tecnológicos para la empresa ${techCompanyId}:`, error)
      return []
    }

    return data
  } catch (error) {
    console.error(`Error inesperado al obtener campos tecnológicos para la empresa ${techCompanyId}:`, error)
    return []
  }
}

// Obtener un campo tecnológico por su ID
export async function getTechFieldById(id: string): Promise<TechField | null> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase.from("tech_fields").select("*").eq("id", id).single()

    if (error) {
      console.error(`Error al obtener campo tecnológico con ID ${id}:`, error)
      return null
    }

    return data
  } catch (error) {
    console.error(`Error inesperado al obtener campo tecnológico con ID ${id}:`, error)
    return null
  }
}

// Crear un nuevo campo tecnológico
export async function createTechField(techField: { name: string; tech_company_id: string }): Promise<TechField> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase.from("tech_fields").insert([techField]).select().single()

    if (error) {
      console.error("Error al crear campo tecnológico:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("Error inesperado al crear campo tecnológico:", error)
    throw error
  }
}

// Actualizar un campo tecnológico existente
export async function updateTechField(id: string, updates: { name: string }): Promise<TechField> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase.from("tech_fields").update(updates).eq("id", id).select().single()

    if (error) {
      console.error(`Error al actualizar campo tecnológico con ID ${id}:`, error)
      throw error
    }

    return data
  } catch (error) {
    console.error(`Error inesperado al actualizar campo tecnológico con ID ${id}:`, error)
    throw error
  }
}

// Eliminar un campo tecnológico
export async function deleteTechField(id: string): Promise<boolean> {
  try {
    const supabase = createClient()

    const { error } = await supabase.from("tech_fields").delete().eq("id", id)

    if (error) {
      console.error(`Error al eliminar campo tecnológico con ID ${id}:`, error)
      return false
    }

    return true
  } catch (error) {
    console.error(`Error inesperado al eliminar campo tecnológico con ID ${id}:`, error)
    return false
  }
}
