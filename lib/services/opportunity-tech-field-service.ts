import { createClient as createAnonClient } from "@supabase/supabase-js"

export interface OpportunityTechField {
  id: string
  tech_company_id: string
  field_name: string
  field_type: string
  is_required: boolean
  options: any[] | null
  created_at: string
  updated_at: string
  tech_company?: {
    name: string
  }
}

export interface OpportunityTechFieldFormData {
  tech_company_id: string
  field_name: string
  field_type: string
  is_required: boolean
  options: any[] | null
}

// Función para obtener todos los campos personalizados
export async function getOpportunityTechFields(): Promise<OpportunityTechField[]> {
  try {
    // Usamos directamente el cliente anónimo para evitar problemas con next/headers
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("SERVER ERROR: Variables de entorno de Supabase no disponibles")
      return []
    }

    const supabase = createAnonClient(supabaseUrl, supabaseAnonKey)

    const { data, error } = await supabase
      .from("opportunity_tech_fields")
      .select(`
        id,
        tech_company_id,
        field_name,
        field_type,
        is_required,
        options,
        created_at,
        updated_at,
        tech_companies:tech_company_id (name)
      `)
      .order("field_name")

    if (error) {
      console.error("Error al obtener campos personalizados:", error)
      return []
    }

    // Transformar los datos para que tech_company sea un objeto con la propiedad name
    return (data || []).map((field) => ({
      ...field,
      tech_company: field.tech_companies,
      tech_companies: undefined,
    }))
  } catch (error) {
    console.error("Error inesperado al obtener campos personalizados:", error)
    return []
  }
}

// Función para obtener un campo personalizado por su ID
export async function getOpportunityTechFieldById(id: string): Promise<OpportunityTechField | null> {
  try {
    // Usamos directamente el cliente anónimo para evitar problemas con next/headers
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("SERVER ERROR: Variables de entorno de Supabase no disponibles")
      return null
    }

    const supabase = createAnonClient(supabaseUrl, supabaseAnonKey)

    const { data, error } = await supabase
      .from("opportunity_tech_fields")
      .select(`
        id,
        tech_company_id,
        field_name,
        field_type,
        is_required,
        options,
        created_at,
        updated_at,
        tech_companies:tech_company_id (name)
      `)
      .eq("id", id)
      .single()

    if (error) {
      console.error(`Error al obtener campo personalizado con ID ${id}:`, error)
      return null
    }

    // Transformar los datos para que tech_company sea un objeto con la propiedad name
    return {
      ...data,
      tech_company: data.tech_companies,
      tech_companies: undefined,
    }
  } catch (error) {
    console.error(`Error inesperado al obtener campo personalizado con ID ${id}:`, error)
    return null
  }
}

// Función para crear un nuevo campo personalizado
export async function createOpportunityTechField(
  data: OpportunityTechFieldFormData,
): Promise<OpportunityTechField | null> {
  try {
    // Usamos directamente el cliente anónimo para evitar problemas con next/headers
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("SERVER ERROR: Variables de entorno de Supabase no disponibles")
      return null
    }

    const supabase = createAnonClient(supabaseUrl, supabaseAnonKey)

    const { data: newField, error } = await supabase
      .from("opportunity_tech_fields")
      .insert([
        {
          tech_company_id: data.tech_company_id,
          field_name: data.field_name,
          field_type: data.field_type,
          is_required: data.is_required,
          options: data.options,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error al crear campo personalizado:", error)
      return null
    }

    return newField
  } catch (error) {
    console.error("Error inesperado al crear campo personalizado:", error)
    return null
  }
}

// Función para actualizar un campo personalizado existente
export async function updateOpportunityTechField(
  id: string,
  data: OpportunityTechFieldFormData,
): Promise<OpportunityTechField | null> {
  try {
    // Usamos directamente el cliente anónimo para evitar problemas con next/headers
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("SERVER ERROR: Variables de entorno de Supabase no disponibles")
      return null
    }

    const supabase = createAnonClient(supabaseUrl, supabaseAnonKey)

    const { data: updatedField, error } = await supabase
      .from("opportunity_tech_fields")
      .update({
        tech_company_id: data.tech_company_id,
        field_name: data.field_name,
        field_type: data.field_type,
        is_required: data.is_required,
        options: data.options,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error(`Error al actualizar campo personalizado con ID ${id}:`, error)
      return null
    }

    return updatedField
  } catch (error) {
    console.error(`Error inesperado al actualizar campo personalizado con ID ${id}:`, error)
    return null
  }
}

// Función para eliminar un campo personalizado
export async function deleteOpportunityTechField(id: string): Promise<boolean> {
  try {
    // Usamos directamente el cliente anónimo para evitar problemas con next/headers
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("SERVER ERROR: Variables de entorno de Supabase no disponibles")
      return false
    }

    const supabase = createAnonClient(supabaseUrl, supabaseAnonKey)

    const { error } = await supabase.from("opportunity_tech_fields").delete().eq("id", id)

    if (error) {
      console.error(`Error al eliminar campo personalizado con ID ${id}:`, error)
      return false
    }

    return true
  } catch (error) {
    console.error(`Error inesperado al eliminar campo personalizado con ID ${id}:`, error)
    return false
  }
}
