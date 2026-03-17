import { supabase } from "@/lib/supabase/client"
import type { Tables } from "@/types/supabase"
import { createOpportunityCreationNote, createOpportunityValidationNote } from "@/lib/services/notes-service"

export type OpportunityWithRelations = Tables<"opportunities"> & {
  stage: Tables<"pipeline_stages"> | null
  tech_company: Tables<"tech_companies"> | null
  partner: Tables<"partners"> | null
  end_customer: Tables<"end_customers"> | null
}

// Modificar la función getOpportunities para añadir logs detallados del query
export async function getOpportunities(userInfo?: any): Promise<OpportunityWithRelations[]> {
  try {
    console.log("getOpportunities recibió userInfo:", JSON.stringify(userInfo, null, 2))

    let query = supabase.from("opportunities").select(`
        *,
        stage:pipeline_stages(id, code, display_order),
        tech_company:tech_companies(id, name, logo_url),
        partner:partners(id, name, logo_url),
        end_customer:end_customers(id, name)
      `)

    // Aplicar filtros según el rol del usuario
    if (userInfo) {
      console.log("Rol del usuario:", userInfo.roleCode)
      console.log("ID del usuario:", userInfo.id)
      console.log("¿Es admin?:", userInfo.isAdmin)
      console.log("Partner ID:", userInfo.partnerId)

      // Si es un usuario Partner, filtrar por partner_id
      if (userInfo.partnerId) {
        console.log(`Filtrando oportunidades para el partner: ${userInfo.partnerId}`)
        query = query.eq("partner_id", userInfo.partnerId)
      } else if (userInfo.roleCode && userInfo.roleCode.toLowerCase() === "bdd" && userInfo.id) {
        console.log(`Filtrando oportunidades para el BDD asignado o creadas por: ${userInfo.id}`)
        query = query.or(`assigned_to.eq.${userInfo.id},created_by.eq.${userInfo.id}`)

        // Imprimir el query SQL generado (aproximado)
        const queryStr = `SELECT * FROM opportunities WHERE assigned_to = '${userInfo.id}' OR created_by = '${userInfo.id}' ORDER BY created_at DESC`
        console.log("Query SQL aproximado:", queryStr)
      } else {
        console.log("No se aplicó ningún filtro específico por rol")
      }
    } else {
      console.log("No se recibió información del usuario, mostrando todas las oportunidades")
    }

    // Ordenar por fecha de creación descendente
    query = query.order("created_at", { ascending: false })

    // Ejecutar la consulta
    console.log("Ejecutando consulta a Supabase...")
    const { data, error } = await query

    if (error) {
      console.error("Error al obtener oportunidades:", error)
      return []
    }

    console.log(`Se encontraron ${data?.length || 0} oportunidades después de aplicar filtros`)

    // Mostrar los primeros 3 resultados para debug
    if (data && data.length > 0) {
      console.log(
        "Primeras 3 oportunidades:",
        data.slice(0, 3).map((op) => ({
          id: op.id,
          name: op.name,
          assigned_to: op.assigned_to,
          partner_id: op.partner_id,
        })),
      )
    }

    return (data as OpportunityWithRelations[]) || []
  } catch (error) {
    console.error("Error inesperado al obtener oportunidades:", error)
    return []
  }
}

// También actualizar la versión cliente con los mismos logs
export async function getOpportunitiesClient(userInfo?: any): Promise<OpportunityWithRelations[]> {
  try {
    console.log("getOpportunitiesClient recibió userInfo:", JSON.stringify(userInfo, null, 2))

    let query = supabase.from("opportunities").select(`
      *,
      stage:pipeline_stages(id, code, display_order),
      tech_company:tech_companies(id, name, logo_url),
      partner:partners(id, name, logo_url),
      end_customer:end_customers(id, name)
    `)

    // Aplicar filtros según el rol del usuario
    if (userInfo) {
      console.log("Rol del usuario:", userInfo.roleCode)
      console.log("ID del usuario:", userInfo.id)
      console.log("¿Es admin?:", userInfo.isAdmin)
      console.log("Partner ID:", userInfo.partnerId)

      // Si es un usuario Partner, filtrar por partner_id
      if (userInfo.partnerId) {
        console.log(`Filtrando oportunidades para el partner: ${userInfo.partnerId}`)
        query = query.eq("partner_id", userInfo.partnerId)
      } else if (userInfo.roleCode && userInfo.roleCode.toLowerCase() === "bdd" && userInfo.id) {
        console.log(`Filtrando oportunidades para el BDD asignado o creadas por: ${userInfo.id}`)
        query = query.or(`assigned_to.eq.${userInfo.id},created_by.eq.${userInfo.id}`)

        // Imprimir el query SQL generado (aproximado)
        const queryStr = `SELECT * FROM opportunities WHERE assigned_to = '${userInfo.id}' OR created_by = '${userInfo.id}' ORDER BY created_at DESC`
        console.log("Query SQL aproximado:", queryStr)
      } else {
        console.log("No se aplicó ningún filtro específico por rol")
      }
    } else {
      console.log("No se recibió información del usuario, mostrando todas las oportunidades")
    }

    // Ordenar por fecha de creación descendente
    query = query.order("created_at", { ascending: false })

    // Ejecutar la consulta
    console.log("Ejecutando consulta a Supabase...")
    const { data, error } = await query

    if (error) {
      console.error("Error al obtener oportunidades:", error)
      return []
    }

    console.log(`Se encontraron ${data?.length || 0} oportunidades después de aplicar filtros`)

    // Mostrar los primeros 3 resultados para debug
    if (data && data.length > 0) {
      console.log(
        "Primeras 3 oportunidades:",
        data.slice(0, 3).map((op) => ({
          id: op.id,
          name: op.name,
          assigned_to: op.assigned_to,
          partner_id: op.partner_id,
        })),
      )
    }

    return (data as OpportunityWithRelations[]) || []
  } catch (error) {
    console.error("Error inesperado al obtener oportunidades:", error)
    return []
  }
}

// Función para obtener las etapas del pipeline
export async function getOpportunityStages(): Promise<Tables<"pipeline_stages">[]> {
  try {
    const { data, error } = await supabase
      .from("pipeline_stages")
      .select("*")
      .order("display_order", { ascending: true })

    if (error) {
      console.error("Error al obtener etapas del pipeline:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error inesperado al obtener etapas del pipeline:", error)
    return []
  }
}

// Modificar la función createOpportunity para añadir la creación de nota
export async function createOpportunity(
  opportunityData: any,
  techFieldIds: string[] = [],
  userRole: string | null = null,
): Promise<any> {
  try {
    console.log("🔧 Datos de oportunidad a crear:", opportunityData)

    // Validar si el cliente final es requerido según el rol
    if (userRole && userRole.toLowerCase() === "partner" && !opportunityData.end_customer_id) {
      throw new Error("El cliente final es obligatorio para usuarios Partner")
    }

    // Establecer los campos de validación según el rol del usuario
    if (userRole) {
      const lowerCaseRole = userRole.toLowerCase()

      // Si es usuario ScaleUp (Admin o BDD), la oportunidad se valida automáticamente
      if (lowerCaseRole === "admin" || lowerCaseRole === "scaleup" || lowerCaseRole === "bdd") {
        opportunityData.validation_status = "validated"
        opportunityData.validation_date = new Date().toISOString()
        opportunityData.validated_by = opportunityData.created_by
      }
      // Si es usuario Partner, la oportunidad queda pendiente de validación
      else if (lowerCaseRole === "partner") {
        opportunityData.validation_status = "pending"
        opportunityData.validation_date = null
        opportunityData.validated_by = null
      }
    }

    // Eliminar el campo probability si existe
    if (opportunityData.hasOwnProperty("probability")) {
      delete opportunityData.probability
    }

    if (opportunityData.hasOwnProperty("is_new_partner")) {
      // Convertir a boolean si viene como string
      opportunityData.is_new_partner = Boolean(opportunityData.is_new_partner)
    } else {
      // Si no existe el campo, establecer como false por defecto
      opportunityData.is_new_partner = false
    }

    console.log("🔧 is_new_partner antes del insert:", opportunityData.is_new_partner)
    console.log("🔧 Campos que se van a insertar:", Object.keys(opportunityData))

    const { data, error } = await supabase.from("opportunities").insert(opportunityData).select().single()

    if (error) {
      console.error("Error al crear oportunidad:", error)
      throw error
    }

    console.log("🔧 is_new_partner en la respuesta de Supabase:", data?.is_new_partner)

    // Si hay campos tecnológicos seleccionados, crear las relaciones
    if (techFieldIds.length > 0 && data) {
      const techFieldRelations = techFieldIds.map((fieldId) => ({
        opportunity_id: data.id,
        tech_field_id: fieldId,
      }))

      const { error: relationError } = await supabase.from("opportunity_tech_fields").insert(techFieldRelations)

      if (relationError) {
        console.error("Error al crear relaciones con campos tecnológicos:", relationError)
        // No revertimos la creación de la oportunidad, solo registramos el error
      }
    }

    // Crear nota de creación de oportunidad
    if (data && opportunityData.created_by) {
      console.log("Intentando crear nota de creación para la oportunidad:", data.id)

      try {
        await createOpportunityCreationNote(data.id, opportunityData.created_by)
        console.log("Nota de creación creada exitosamente")

        // Si la oportunidad fue validada automáticamente, crear nota de validación
        if (data.validation_status === "validated" && data.validated_by) {
          console.log("Intentando crear nota de validación automática")
          await createOpportunityValidationNote(data.id, data.validated_by)
          console.log("Nota de validación automática creada exitosamente")
        }
      } catch (noteError) {
        console.error("Error al crear notas automáticas:", noteError)
        // No revertimos la creación de la oportunidad, solo registramos el error
      }
    }

    return data
  } catch (error) {
    console.error("Error inesperado al crear oportunidad:", error)
    throw error
  }
}

// Función para obtener usuarios para asignación
export async function getUsersForAssignment() {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, first_name, last_name, email")
      .order("first_name", { ascending: true })

    if (error) {
      console.error("Error al obtener usuarios para asignación:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error inesperado al obtener usuarios para asignación:", error)
    return []
  }
}

// Función para obtener el rol de un usuario
export async function getUserRole(userId: string): Promise<string | null> {
  try {
    if (!userId) {
      return null
    }

    const { data, error } = await supabase.from("users").select("role_code").eq("id", userId).single()

    if (error) {
      console.error(`Error al obtener rol del usuario ${userId}:`, error)
      return null
    }

    return data?.role_code || null
  } catch (error) {
    console.error(`Error inesperado al obtener rol del usuario ${userId}:`, error)
    return null
  }
}

// Simplificar la función getPartnerCountries para asegurar que funcione correctamente
export async function getPartnerCountries(partnerId: string): Promise<{ id: string; name: string; code: string }[]> {
  try {
    if (!partnerId) {
      console.log("No se proporcionó ID de partner")
      return []
    }

    console.log(`Obteniendo países para el partner con ID: ${partnerId}`)

    // Paso 1: Obtener los IDs de países asociados al partner
    const { data: partnerCountriesData, error: partnerCountriesError } = await supabase
      .from("partner_countries")
      .select("country_id")
      .eq("partner_id", partnerId)

    if (partnerCountriesError) {
      console.error(`Error al obtener IDs de países para el partner ${partnerId}:`, partnerCountriesError)
      return []
    }

    if (!partnerCountriesData || partnerCountriesData.length === 0) {
      console.log(`No se encontraron países asociados al partner ${partnerId}`)
      return []
    }

    // Extraer los IDs de países
    const countryIds = partnerCountriesData.map((item) => item.country_id)
    console.log(`IDs de países encontrados para el partner ${partnerId}:`, countryIds)

    // Paso 2: Obtener los detalles de los países
    const { data: countriesData, error: countriesError } = await supabase
      .from("countries")
      .select("id, name, code")
      .in("id", countryIds)

    if (countriesError) {
      console.error(`Error al obtener detalles de países:`, countriesError)
      return []
    }

    if (!countriesData || countriesData.length === 0) {
      console.log(`No se encontraron detalles para los países con IDs: ${countryIds.join(", ")}`)
      return []
    }

    console.log(`Países encontrados para el partner ${partnerId}:`, countriesData)
    return countriesData
  } catch (error) {
    console.error(`Error inesperado al obtener países del partner con ID ${partnerId}:`, error)
    return []
  }
}

// Mejorar la función getScaleUpManager para asegurar que funcione correctamente
export async function getScaleUpManager(techCompanyId: string, partnerId: string): Promise<string | null> {
  try {
    if (!techCompanyId || !partnerId) {
      console.log("No se proporcionaron IDs de tech company o partner")
      return null
    }

    console.log(`Obteniendo ScaleUp Manager para Tech Company ${techCompanyId} y Partner ${partnerId}`)

    const { data, error } = await supabase
      .from("partner_tech_companies")
      .select("scaleup_manager_id")
      .eq("tech_company_id", techCompanyId)
      .eq("partner_id", partnerId)
      .maybeSingle()

    if (error) {
      console.error("Error al obtener ScaleUp Manager:", error)
      return null
    }

    if (!data || !data.scaleup_manager_id) {
      console.log("No se encontró ScaleUp Manager para esta relación")
      return null
    }

    console.log(`ScaleUp Manager encontrado: ${data.scaleup_manager_id}`)
    return data.scaleup_manager_id
  } catch (error) {
    console.error("Error inesperado al obtener ScaleUp Manager:", error)
    return null
  }
}
