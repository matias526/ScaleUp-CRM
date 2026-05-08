import { supabase } from "@/lib/supabase/client"
import type { Tables } from "@/types/supabase"
import { createOpportunityCreationNote, createOpportunityValidationNote } from "@/lib/services/notes-service"

export type OpportunityWithRelations = Tables<"opportunities"> & {
  stage: Tables<"pipeline_stages"> | null
  tech_company: Tables<"tech_companies"> | null
  partner: Tables<"partners"> | null
  end_customer: Tables<"end_customers"> | null
  tasks: Tables<"tasks">[] | null
  notes: Tables<"notes">[] | null
}

// Modificar la función getOpportunities para añadir logs detallados del query
export async function getOpportunities(userInfo?: any): Promise<OpportunityWithRelations[]> {
  try {
    console.log("getOpportunities recibió userInfo:", JSON.stringify(userInfo, null, 2))

    let query = supabase.from("opportunities").select(`
        *,
        stage:pipeline_stages(id, code, display_order),
        tech_company:tech_companies(id, name, logo_url, is_active),
        partner:partners(id, name, logo_url),
        end_customer:end_customers(id, name),
        notes(id, created_at),
        tasks(id, created_at)
      `)

    // Filtrar solo oportunidades de tech_companies activas (is_active = true)
    // Se hace mediante inner join con tech_companies
    query = query.eq("tech_company.is_active", true)

    // Aplicar filtros según el rol del usuario
    if (userInfo) {
      console.log("Rol del usuario:", userInfo.roleCode)
      console.log("ID del usuario:", userInfo.id)
      console.log("Tech Company ID del usuario:", userInfo.tech_company_id)

      // Si es un usuario TechUser o TechLogistic, filtrar por su tech_company
      if ((userInfo.roleCode === "TechUser" || userInfo.roleCode === "TechLogistic") && userInfo.tech_company_id) {
        console.log(`Filtrando oportunidades para la TechCompany: ${userInfo.tech_company_id}`)
        query = query.eq("tech_company_id", userInfo.tech_company_id)
      }
      // Si es un usuario Partner, filtrar por partner_id
      else if (userInfo.partnerId) {
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
          tech_company_id: op.tech_company_id,
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
      tech_company:tech_companies(id, name, logo_url, is_active),
      partner:partners(id, name, logo_url),
      end_customer:end_customers(id, name),
      notes(id, created_at),
      tasks(id, created_at)
    `)

    // Filtrar solo oportunidades de tech_companies activas (is_active = true)
    query = query.eq("tech_company.is_active", true)

    // Aplicar filtros según el rol del usuario
    if (userInfo) {
      console.log("Rol del usuario:", userInfo.roleCode)
      console.log("ID del usuario:", userInfo.id)
      console.log("Tech Company ID del usuario:", userInfo.tech_company_id)

      // Si es un usuario TechUser o TechLogistic, filtrar por su tech_company
      if ((userInfo.roleCode === "TechUser" || userInfo.roleCode === "TechLogistic") && userInfo.tech_company_id) {
        console.log(`Filtrando oportunidades para la TechCompany: ${userInfo.tech_company_id}`)
        query = query.eq("tech_company_id", userInfo.tech_company_id)
      }
      // Si es un usuario Partner, filtrar por partner_id
      else if (userInfo.partnerId) {
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
          tech_company_id: op.tech_company_id,
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

// Modificar la función createOpportunity para manejar todos los campos correctamente
export async function createOpportunity(
  opportunityData: any,
  techValues: Array<{ opportunity_tech_field_id: string; value: any; valueType: string }> = [],
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

    // Eliminar el campo probability si existe (será calculado automáticamente)
    if (opportunityData.hasOwnProperty("probability")) {
      delete opportunityData.probability
    }

    // Asegurar que is_new_partner sea un boolean
    if (opportunityData.hasOwnProperty("is_new_partner")) {
      opportunityData.is_new_partner = Boolean(opportunityData.is_new_partner)
    } else {
      opportunityData.is_new_partner = false
    }

    console.log("🔧 is_new_partner antes del insert:", opportunityData.is_new_partner)
    console.log("🔧 Campos que se van a insertar:", Object.keys(opportunityData))

    const { data, error } = await supabase.from("opportunities").insert(opportunityData).select().single()

    if (error) {
      console.error("Error al crear oportunidad:", error)
      throw error
    }

    console.log("🔧 Oportunidad creada con ID:", data?.id)

    // Crear los valores técnicos si existen
    if (techValues.length > 0 && data) {
      const techValuesCreated = await createOpportunityTechValues(data.id, techValues)
      if (!techValuesCreated) {
        console.warn("Advertencia: No se pudieron crear todos los valores técnicos")
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

    const { data, error } = await supabase.from("users").select("role_id").eq("id", userId).single()

    if (error) {
      console.error(`Error al obtener rol del usuario ${userId}:`, error)
      return null
    }

    return data?.role_id || null
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

// Función para obtener usuarios del partner (PartnerUser role)
export async function getPartnerUsers(partnerId: string): Promise<Array<{ id: string; first_name: string; last_name: string; email: string }>> {
  try {
    if (!partnerId) {
      console.log("No se proporcionó ID de partner")
      return []
    }

    console.log(`Obteniendo usuarios del partner con ID: ${partnerId}`)

    // Primero obtener el role_id para "PartnerUser"
    const { data: roleData, error: roleError } = await supabase
      .from("roles")
      .select("id")
      .eq("code", "PartnerUser")
      .single()

    if (roleError || !roleData) {
      console.error("Error al obtener el role_id para PartnerUser:", roleError)
      return []
    }

    const { data, error } = await supabase
      .from("users")
      .select("id, first_name, last_name, email")
      .eq("partner_id", partnerId)
      .eq("role_id", roleData.id)
      .order("first_name", { ascending: true })

    if (error) {
      console.error(`Error al obtener usuarios del partner ${partnerId}:`, error)
      return []
    }

    console.log(`Se encontraron ${data?.length || 0} usuarios del partner`)
    return data || []
  } catch (error) {
    console.error(`Error inesperado al obtener usuarios del partner:`, error)
    return []
  }
}

// Función para obtener usuarios ScaleUp con roles Admin o BDD
export async function getScaleUpUsers(): Promise<Array<{ id: string; first_name: string; last_name: string; email: string; role_code: string }>> {
  try {
    console.log("Obteniendo usuarios ScaleUp (Admin o BDD, is_active = true)")

    // Primero obtener los role_ids para "Admin" y "BDD"
    const { data: rolesData, error: rolesError } = await supabase
      .from("roles")
      .select("id, code")
      .in("code", ["Admin", "BDD"])

    if (rolesError || !rolesData || rolesData.length === 0) {
      console.error("Error al obtener los roles Admin/BDD:", rolesError)
      return []
    }

    const roleIds = rolesData.map(r => r.id)

    const { data, error } = await supabase
      .from("users")
      .select(`
        id, first_name, last_name, email, role_id, is_active,
        roles:role_id (code)
      `)
      .in("role_id", roleIds)
      .eq("is_active", true)
      .is("partner_id", null)
      .order("first_name", { ascending: true })

    if (error) {
      console.error("Error al obtener usuarios ScaleUp:", error)
      return []
    }

    // Formatear los datos
    const formattedData = (data || []).map((user: any) => ({
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role_code: user.roles?.code || null,
    }))

    console.log(`Se encontraron ${formattedData.length} usuarios ScaleUp activos`)
    return formattedData
  } catch (error) {
    console.error("Error inesperado al obtener usuarios ScaleUp:", error)
    return []
  }
}

// Función para crear los valores técnicos de una oportunidad
export async function createOpportunityTechValues(
  opportunityId: string,
  techValues: Array<{ opportunity_tech_field_id: string; value: any; valueType: string }>,
): Promise<boolean> {
  try {
    if (!opportunityId || techValues.length === 0) {
      console.log("No hay valores técnicos para crear o ID de oportunidad no válido")
      return true
    }

    console.log(`Creando ${techValues.length} valores técnicos para la oportunidad ${opportunityId}`)

    // Preparar los datos para insertar
    const valuesToInsert = techValues.map((item) => {
      const record: any = {
        opportunity_id: opportunityId,
        opportunity_tech_field_id: item.opportunity_tech_field_id,
      }

      // Asignar el valor al campo correcto según el tipo
      switch (item.valueType) {
        case "text":
          record.value_text = item.value
          break
        case "numeric":
          record.value_numeric = parseFloat(item.value)
          break
        case "boolean":
          record.value_boolean = Boolean(item.value)
          break
        case "date":
          record.value_date = item.value
          break
        case "json":
          record.value_json = typeof item.value === "string" ? JSON.parse(item.value) : item.value
          break
      }

      return record
    })

    const { error } = await supabase.from("opportunity_tech_values").insert(valuesToInsert)

    if (error) {
      console.error("Error al crear valores técnicos:", error)
      return false
    }

    console.log(`Valores técnicos creados exitosamente para la oportunidad ${opportunityId}`)
    return true
  } catch (error) {
    console.error("Error inesperado al crear valores técnicos:", error)
    return false
  }
}

// Función para obtener oportunidades tecnicas de una tech company
export async function getOpportunityTechFields(techCompanyId: string): Promise<any[]> {
  try {
    if (!techCompanyId) {
      console.log("No se proporcionó ID de tech company")
      return []
    }

    console.log(`Obteniendo campos técnicos para tech company ${techCompanyId}`)

    const { data, error } = await supabase
      .from("opportunity_tech_fields")
      .select("*")
      .eq("tech_company_id", techCompanyId)
      .order("display_order", { ascending: true })

    if (error) {
      console.error(`Error al obtener campos técnicos:`, error)
      return []
    }

    console.log(`Se encontraron ${data?.length || 0} campos técnicos`)
    return data || []
  } catch (error) {
    console.error("Error inesperado al obtener campos técnicos:", error)
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

// Función para obtener todos los países
export async function getAllCountries(): Promise<{ id: string; name: string; code: string }[]> {
  try {
    console.log("Obteniendo todos los países")

    const { data, error } = await supabase
      .from("countries")
      .select("id, name, code")
      .order("name", { ascending: true })

    if (error) {
      console.error("Error al obtener países:", error)
      return []
    }

    console.log(`Se encontraron ${data?.length || 0} países`)
    return data || []
  } catch (error) {
    console.error("Error inesperado al obtener países:", error)
    return []
  }
}

// Función para obtener clientes finales (filtrados por partner si aplica)
export async function getEndCustomers(partnerId?: string): Promise<Tables<"end_customers">[]> {
  try {
    let query = supabase.from("end_customers").select("*").order("name", { ascending: true })

    if (partnerId) {
      console.log(`Obteniendo clientes finales para el partner: ${partnerId}`)
      query = query.eq("partner_id", partnerId)
    } else {
      console.log("Obteniendo todos los clientes finales")
    }

    const { data, error } = await query

    if (error) {
      console.error("Error al obtener clientes finales:", error)
      return []
    }

    console.log(`Se encontraron ${data?.length || 0} clientes finales`)
    return data || []
  } catch (error) {
    console.error("Error inesperado al obtener clientes finales:", error)
    return []
  }
}

// Función para crear un nuevo cliente final
export async function createEndCustomer(data: {
  name: string
  industry_id?: string
  website?: string
  tax_id?: string
  country_id?: string
}): Promise<Tables<"end_customers"> | null> {
  try {
    console.log("Creando nuevo cliente final:", data)

    const { data: result, error } = await supabase
      .from("end_customers")
      .insert([data])
      .select()
      .single()

    if (error) {
      console.error("Error al crear cliente final:", error)
      return null
    }

    console.log("Cliente final creado exitosamente:", result)
    return result
  } catch (error) {
    console.error("Error inesperado al crear cliente final:", error)
    return null
  }
}
