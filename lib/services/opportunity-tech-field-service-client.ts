//import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { supabase } from "@/lib/supabase/client"

export interface OpportunityTechField {
  id: string
  tech_company_id: string
  field_name: string
  field_type: string
  is_required: boolean
  options: any[] | null
  created_at: string
  updated_at: string
  display_order?: number
  tech_companies?: {
    name: string
  }
}

export interface OpportunityTechFieldFormData {
  tech_company_id: string
  field_name: string
  field_type: string
  is_required: boolean
  options: any[] | null
  file_config?: {
    allowed_types: string[]
    max_size: number
  } | null
}

// Función para obtener todos los campos personalizados (versión cliente)
export async function getOpportunityTechFieldsClient(techCompanyId?: string): Promise<OpportunityTechField[]> {
  try {
    console.log("CLIENT: Iniciando getOpportunityTechFieldsClient")

    //const supabase = createClientComponentClient()

    // Mostrar la consulta que se va a ejecutar
    const queryStr = `
      supabase.from("opportunity_tech_fields")
      .select(\`
        id,
        tech_company_id,
        field_name,
        field_type,
        is_required,
        options,
        created_at,
        updated_at,
        display_order,
        tech_companies:tech_company_id (name)
      \`)
      .order("display_order")
    `
    console.log("CLIENT QUERY:", queryStr)

    // Ejecutar la consulta
    let query = supabase.from("opportunity_tech_fields").select(`
        id,
        tech_company_id,
        field_name,
        field_type,
        is_required,
        options,
        created_at,
        updated_at,
        display_order,
        tech_companies:tech_company_id (name)
      `)

    // Aplicar filtro por tech_company_id si se proporciona
    if (techCompanyId) {
      console.log(`CLIENT: Filtrando por tech_company_id: ${techCompanyId}`)
      query = query.eq("tech_company_id", techCompanyId)
    }

    // Ordenar los resultados por display_order
    const { data, error } = await query.order("display_order")

    if (error) {
      console.error("CLIENT ERROR en getOpportunityTechFieldsClient:", error)
      throw new Error(`Error al obtener campos personalizados: ${error.message}`)
    }

    console.log(
      `CLIENT: getOpportunityTechFieldsClient obtuvo ${data?.length || 0} registros${techCompanyId ? ` para tech_company_id: ${techCompanyId}` : ""}`,
    )

    // Transformar los datos para que tech_company sea un objeto con la propiedad name
    return (data || []).map((field) => ({
      ...field,
      tech_company: field.tech_companies,
      tech_companies: field.tech_companies,
    }))
  } catch (error: any) {
    console.error("CLIENT EXCEPTION en getOpportunityTechFieldsClient:", error)
    throw new Error(`Excepción al obtener campos personalizados: ${error.message}`)
  }
}

// Función para obtener un campo personalizado por su ID (versión cliente)
export async function getOpportunityTechFieldByIdClient(id: string): Promise<OpportunityTechField | null> {
  try {
    //const supabase = createClientComponentClient()

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
        display_order,
        tech_companies:tech_company_id (name)
      `)
      .eq("id", id)
      .single()

    if (error) {
      console.error(`CLIENT ERROR en getOpportunityTechFieldByIdClient con ID ${id}:`, error)
      return null
    }

    // Transformar los datos para que tech_company sea un objeto con la propiedad name
    return {
      ...data,
      tech_company: data.tech_companies,
      tech_companies: data.tech_companies,
    }
  } catch (error) {
    console.error(`CLIENT EXCEPTION en getOpportunityTechFieldByIdClient con ID ${id}:`, error)
    return null
  }
}

// Función para obtener el próximo display_order para una tech_company
async function getNextDisplayOrder(supabase: any, techCompanyId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from("opportunity_tech_fields")
      .select("display_order")
      .eq("tech_company_id", techCompanyId)
      .order("display_order", { ascending: false })
      .limit(1)

    if (error) {
      console.error("Error obteniendo display_order:", error)
      return 10 // Valor por defecto
    }

    if (!data || data.length === 0) {
      return 10 // Primer campo
    }

    return (data[0].display_order || 0) + 10
  } catch (error) {
    console.error("Exception obteniendo display_order:", error)
    return 10 // Valor por defecto
  }
}

// Función para crear un nuevo campo personalizado (versión cliente)
export async function createOpportunityTechFieldClient(
  data: OpportunityTechFieldFormData,
): Promise<OpportunityTechField | null> {
  try {
    console.log("CLIENT: Iniciando createOpportunityTechFieldClient con datos:", data)

    //const supabase = createClientComponentClient()

    // Verificar que el usuario esté autenticado
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError) {
      console.error("CLIENT AUTH ERROR:", authError)
      throw new Error(`Error de autenticación: ${authError.message}`)
    }

    if (!user) {
      console.error("CLIENT: Usuario no autenticado")
      throw new Error("Usuario no autenticado")
    }

    console.log("CLIENT: Usuario autenticado:", user.id)

    // Obtener el próximo display_order
    const displayOrder = await getNextDisplayOrder(supabase, data.tech_company_id)
    console.log("CLIENT: Display order calculado:", displayOrder)

    // Preparar los datos para insertar
    const insertData = {
      tech_company_id: data.tech_company_id,
      field_name: data.field_name,
      field_type: data.field_type,
      is_required: data.is_required,
      options: data.options,
      file_config: data.file_config,
      display_order: displayOrder,
    }

    console.log("CLIENT: Datos a insertar:", insertData)

    const { data: newField, error } = await supabase
      .from("opportunity_tech_fields")
      .insert([insertData])
      .select()
      .single()

    if (error) {
      console.error("CLIENT ERROR en createOpportunityTechFieldClient:", error)
      console.error("CLIENT ERROR details:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      })
      throw new Error(`Error al crear campo personalizado: ${error.message}`)
    }

    if (!newField) {
      console.error("CLIENT: No se devolvió ningún campo después de la inserción")
      throw new Error("No se pudo crear el campo personalizado")
    }

    console.log("CLIENT: Campo personalizado creado exitosamente:", newField)
    return newField
  } catch (error: any) {
    console.error("CLIENT EXCEPTION en createOpportunityTechFieldClient:", error)
    throw error // Re-lanzar el error para que se muestre en el toast
  }
}

// Función para actualizar un campo personalizado existente (versión cliente)
export async function updateOpportunityTechFieldClient(
  id: string,
  data: OpportunityTechFieldFormData,
): Promise<OpportunityTechField | null> {
  try {
    console.log(`CLIENT: Iniciando updateOpportunityTechFieldClient con ID ${id} y datos:`, data)

    //const supabase = createClientComponentClient()

    // Verificar que el usuario esté autenticado
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError) {
      console.error("CLIENT AUTH ERROR:", authError)
      throw new Error(`Error de autenticación: ${authError.message}`)
    }

    if (!user) {
      console.error("CLIENT: Usuario no autenticado")
      throw new Error("Usuario no autenticado")
    }

    const { data: updatedField, error } = await supabase
      .from("opportunity_tech_fields")
      .update({
        tech_company_id: data.tech_company_id,
        field_name: data.field_name,
        field_type: data.field_type,
        is_required: data.is_required,
        options: data.options,
        file_config: data.file_config,
        updated_at: new Date().toISOString(),
        // No actualizamos display_order en edición para mantener el orden
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error(`CLIENT ERROR en updateOpportunityTechFieldClient con ID ${id}:`, error)
      console.error("CLIENT ERROR details:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      })
      throw new Error(`Error al actualizar campo personalizado: ${error.message}`)
    }

    console.log(`CLIENT: Campo personalizado actualizado exitosamente:`, updatedField)
    return updatedField
  } catch (error: any) {
    console.error(`CLIENT EXCEPTION en updateOpportunityTechFieldClient con ID ${id}:`, error)
    throw error // Re-lanzar el error para que se muestre en el toast
  }
}

// Función para eliminar un campo personalizado (versión cliente)
export async function deleteOpportunityTechFieldClient(id: string): Promise<boolean> {
  try {
    console.log(`CLIENT: Iniciando deleteOpportunityTechFieldClient con ID ${id}`)

    //const supabase = createClientComponentClient()

    // Verificar que el usuario esté autenticado
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError) {
      console.error("CLIENT AUTH ERROR:", authError)
      throw new Error(`Error de autenticación: ${authError.message}`)
    }

    if (!user) {
      console.error("CLIENT: Usuario no autenticado")
      throw new Error("Usuario no autenticado")
    }

    const { error } = await supabase.from("opportunity_tech_fields").delete().eq("id", id)

    if (error) {
      console.error(`CLIENT ERROR en deleteOpportunityTechFieldClient con ID ${id}:`, error)
      console.error("CLIENT ERROR details:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      })
      throw new Error(`Error al eliminar campo personalizado: ${error.message}`)
    }

    console.log(`CLIENT: Campo personalizado eliminado exitosamente con ID ${id}`)
    return true
  } catch (error: any) {
    console.error(`CLIENT EXCEPTION en deleteOpportunityTechFieldClient con ID ${id}:`, error)
    throw error // Re-lanzar el error para que se muestre en el toast
  }
}
