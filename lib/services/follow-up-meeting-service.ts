import { supabase } from "@/lib/supabase/client"
import { addDays, format, parseISO } from "date-fns"
import { es } from "date-fns/locale"

// Nueva función para obtener las Tech Companies relacionadas con un Partner específico
export async function getTechCompaniesForPartner(partnerId: string) {
  try {
    console.log("Fetching tech companies for partner:", partnerId)

    const { data, error } = await supabase
      .from("partner_tech_companies")
      .select(`
        tech_company_id,
        tech_companies(*)
      `)
      .eq("partner_id", partnerId)

    if (error) {
      console.error("Error al obtener tech companies para partner:", error)
      return []
    }

    // Extraer los datos de tech companies
    const techCompanies = data?.map((item) => item.tech_companies) || []

    // Ordenar alfabéticamente por nombre
    techCompanies.sort((a, b) => a.name.localeCompare(b.name))

    console.log("Fetched tech companies for partner:", techCompanies.length)
    return techCompanies
  } catch (error) {
    console.error("Error inesperado al obtener tech companies para partner:", error)
    return []
  }
}

// Nueva función para obtener oportunidades para un partner específico
export async function getOpportunitiesForPartner(partnerId: string) {
  try {
    console.log("Fetching opportunities for partner:", partnerId)

    // Definir las etapas de pipeline permitidas
    const allowedStages = ["Lead", "Engagement", "Initial Communication", "Quotation"]

    const { data, error } = await supabase
      .from("opportunities")
      .select(`
        *,
        tech_company:tech_companies(*),
        partner:partners(*),
        end_customer:end_customers(*),
        pipeline_stage:pipeline_stages(*)
      `)
      .eq("partner_id", partnerId)
      .order("updated_at", { ascending: false })

    if (error) {
      console.error("Error al obtener oportunidades para partner:", error)
      return []
    }

    // Filtrar oportunidades por las etapas de pipeline permitidas
    const filteredData =
      data?.filter((opp) => opp.pipeline_stage && allowedStages.includes(opp.pipeline_stage.code)) || []

    console.log("Fetched opportunities for partner:", data?.length || 0)
    console.log("Filtered opportunities by pipeline stage:", filteredData.length)
    return filteredData
  } catch (error) {
    console.error("Error inesperado al obtener oportunidades para partner:", error)
    return []
  }
}

// Corregir la función getPartnersForTechCompany para que acepte el techCompanyId como primer parámetro
// y el userId como segundo parámetro opcional

// Reemplazar la función getPartnersForTechCompany actual con esta versión corregida:
export async function getPartnersForTechCompany(techCompanyId: string, userId?: string) {
  try {
    console.log("Fetching partners for tech company:", techCompanyId, "and user:", userId)

    let query = supabase
      .from("partner_tech_companies")
      .select(`
        partner_id,
        partners(*),
        scaleup_manager_id
      `)
      .eq("tech_company_id", techCompanyId)

    // Si se proporciona un userId, filtrar por el scaleup_manager_id
    if (userId) {
      console.log("Filtering by scaleup_manager_id:", userId)
      query = query.eq("scaleup_manager_id", userId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error al obtener partners para tech company:", error)
      return []
    }

    console.log("Raw data from partner_tech_companies:", data)

    // Extraer los datos de partners
    const partners = data?.map((item) => item.partners) || []

    // Sort partners alphabetically by name
    partners.sort((a, b) => a.name.localeCompare(b.name))

    console.log("Fetched partners for tech company:", partners.length)
    return partners
  } catch (error) {
    console.error("Error inesperado al obtener partners para tech company:", error)
    return []
  }
}

// Obtener oportunidades para la reunión de seguimiento con todos los datos relacionados
export async function getOpportunitiesForMeeting(techCompanyId: string, partnerId: string) {
  try {
    console.log("Fetching opportunities for tech company:", techCompanyId, "and partner:", partnerId)

    // Definir las etapas de pipeline permitidas
    const allowedStages = ["Lead", "Engagement", "Initial Communication", "Quotation"]

    // AQUÍ ESTÁ EL QUERY PRINCIPAL - ESTE ES EL PROBLEMA
    const { data, error } = await supabase
      .from("opportunities")
      .select(`
        *,
        tech_company:tech_companies(*),
        partner:partners(*),
        end_customer:end_customers(*),
        pipeline_stage:pipeline_stages(*),
        partner_responsible:users!partner_responsible_id(id, first_name, last_name, email)
      `)
      .eq("tech_company_id", techCompanyId)
      .eq("partner_id", partnerId)
      .order("updated_at", { ascending: false })

    console.log(
      "Query executed with select:",
      `
      *,
      tech_company:tech_companies(*),
      partner:partners(*),
      end_customer:end_customers(*),
      pipeline_stage:pipeline_stages(*),
      partner_responsible:users!partner_responsible_id(id, first_name, last_name, email)
    `,
    )

    if (error) {
      console.error("Error al obtener oportunidades para reunión:", error)
      return []
    }

    console.log("Raw opportunities data:", data)
    console.log("First opportunity partner_responsible_id:", data?.[0]?.partner_responsible_id)
    console.log("First opportunity partner_responsible:", data?.[0]?.partner_responsible)

    // Filtrar oportunidades por las etapas de pipeline permitidas
    const filteredData =
      data?.filter((opp) => opp.pipeline_stage && allowedStages.includes(opp.pipeline_stage.code)) || []

    console.log("Total opportunities:", data?.length || 0)
    console.log("Filtered opportunities by pipeline stage:", filteredData.length)

    // Si tenemos oportunidades, obtenemos las notas y tareas para cada una
    if (filteredData && filteredData.length > 0) {
      // Obtener IDs de oportunidades
      const opportunityIds = filteredData.map((opp) => opp.id)

      // Obtener notas para estas oportunidades - FILTRAR notas privadas
      const { data: notesData, error: notesError } = await supabase
        .from("notes")
        .select(`
          *,
          user:users(id, first_name, last_name, email)
        `)
        .in("opportunity_id", opportunityIds)
        .eq("is_private", false) // Solo notas no privadas
        .order("created_at", { ascending: false })

      if (notesError) {
        console.error("Error al obtener notas:", notesError)
      } else if (notesData) {
        // Agrupar notas por opportunity_id
        const notesByOpportunity: Record<string, any[]> = {}
        notesData.forEach((note) => {
          if (!notesByOpportunity[note.opportunity_id]) {
            notesByOpportunity[note.opportunity_id] = []
          }
          notesByOpportunity[note.opportunity_id].push(note)
        })

        // Añadir notas a las oportunidades
        filteredData.forEach((opp) => {
          opp.notes = notesByOpportunity[opp.id] || []
        })
      }

      // Obtener tareas para estas oportunidades
      const { data: tasksData, error: tasksError } = await supabase
        .from("tasks")
        .select(`
          *,
          assigned_to_user:users!assigned_to(id, first_name, last_name, email),
          assigned_by_user:users!assigned_by(id, first_name, last_name, email)
        `)
        .in("opportunity_id", opportunityIds)
        .order("due_date", { ascending: true })

      if (tasksError) {
        console.error("Error al obtener tareas:", tasksError)
      } else if (tasksData) {
        // Agrupar tareas por opportunity_id
        const tasksByOpportunity: Record<string, any[]> = {}
        tasksData.forEach((task) => {
          if (!tasksByOpportunity[task.opportunity_id]) {
            tasksByOpportunity[task.opportunity_id] = []
          }
          tasksByOpportunity[task.opportunity_id].push(task)
        })

        // Añadir tareas a las oportunidades
        filteredData.forEach((opp) => {
          opp.tasks = tasksByOpportunity[opp.id] || []
        })
      }

      // Obtener campos técnicos para estas oportunidades
      try {
        // Primero obtenemos todos los campos técnicos disponibles
        const { data: allTechFields, error: allTechFieldsError } = await supabase
          .from("opportunity_tech_fields")
          .select("*")
          .order("display_order", { ascending: true })

        if (allTechFieldsError) {
          console.error("Error al obtener todos los campos técnicos:", allTechFieldsError)
        } else {
          console.log("Campos técnicos obtenidos:", allTechFields?.length || 0)
          console.log("Muestra de campos técnicos:", allTechFields?.[0])

          // Crear un mapa de ID a campo técnico para acceso rápido
          const techFieldsMap = new Map()
          allTechFields?.forEach((field) => {
            techFieldsMap.set(field.id, field)
          })

          // Ahora obtenemos los valores de los campos técnicos para estas oportunidades
          const { data: techFieldsData, error: techFieldsError } = await supabase
            .from("opportunity_tech_values")
            .select("*")
            .in("opportunity_id", opportunityIds)

          if (techFieldsError) {
            console.error("Error al obtener valores de campos técnicos:", techFieldsError)
          } else if (techFieldsData) {
            console.log("Valores de campos técnicos cargados:", techFieldsData?.length || 0)
            console.log("Muestra de valores de campos técnicos:", techFieldsData?.[0])

            // Enriquecer los valores con la información del campo técnico
            const enrichedTechFieldsData = techFieldsData.map((value) => {
              const fieldInfo = techFieldsMap.get(value.opportunity_tech_field_id)

              // Registrar para depuración
              console.log(
                `Campo ${value.opportunity_tech_field_id} (${fieldInfo?.field_type || "desconocido"}): valor cargado = ${
                  value.value_text ||
                  value.value_numeric ||
                  (value.value_boolean !== null ? (value.value_boolean ? "Sí" : "No") : "") ||
                  value.value_date ||
                  value.value_json ||
                  "null"
                }`,
              )

              return {
                ...value,
                field_info: fieldInfo,
              }
            })

            // Agrupar campos técnicos por opportunity_id
            const techFieldsByOpportunity: Record<string, any[]> = {}
            enrichedTechFieldsData.forEach((field) => {
              if (!techFieldsByOpportunity[field.opportunity_id]) {
                techFieldsByOpportunity[field.opportunity_id] = []
              }
              techFieldsByOpportunity[field.opportunity_id].push(field)
            })

            // Añadir campos técnicos a las oportunidades
            filteredData.forEach((opp) => {
              opp.tech_fields = techFieldsByOpportunity[opp.id] || []
            })
          }
        }
      } catch (techFieldsError) {
        console.error("Error inesperado al obtener campos técnicos:", techFieldsError)
      }
    }

    console.log("Final opportunities data with partner_responsible:")
    filteredData.forEach((opp, index) => {
      console.log(`Opportunity ${index + 1}:`)
      console.log(`  ID: ${opp.id}`)
      console.log(`  Title: ${opp.title}`)
      console.log(`  partner_responsible_id: ${opp.partner_responsible_id}`)
      console.log(`  partner_responsible:`, opp.partner_responsible)
    })

    console.log("Fetched opportunities with related data:", filteredData.length)
    return filteredData
  } catch (error) {
    console.error("Error inesperado al obtener oportunidades para reunión:", error)
    return []
  }
}

// Obtener tech companies con datos completos
export async function getTechCompanies() {
  try {
    console.log("Fetching tech companies")

    const { data, error } = await supabase.from("tech_companies").select("*").order("name")

    if (error) {
      console.error("Error al obtener tech companies:", error)
      return []
    }

    console.log("Fetched tech companies:", data?.length || 0)
    return data || []
  } catch (error) {
    console.error("Error inesperado al obtener tech companies:", error)
    return []
  }
}

// Obtener partners con datos completos
export async function getPartners() {
  try {
    console.log("Fetching partners")

    const { data, error } = await supabase.from("partners").select("*").order("name")

    if (error) {
      console.error("Error al obtener partners:", error)
      return []
    }

    console.log("Fetched partners:", data?.length || 0)
    return data || []
  } catch (error) {
    console.error("Error inesperado al obtener partners:", error)
    return []
  }
}

// Añadir nota a una oportunidad
export async function addNoteToOpportunity(noteData: {
  opportunity_id: string
  user_id: string
  content: string
  is_private: boolean
}) {
  try {
    const { data, error } = await supabase
      .from("notes")
      .insert(noteData)
      .select(`
        *,
        user:users(id, first_name, last_name, email)
      `)

    if (error) {
      console.error("Error al añadir nota:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("Error inesperado al añadir nota:", error)
    throw error
  }
}

// Añadir tarea relacionada con una oportunidad
export async function addTaskToOpportunity(taskData: {
  title: string
  description: string
  opportunity_id: string
  assigned_to: string
  assigned_by: string
  due_date: string
  status: string
  tech_company_id?: string
  partner_id?: string
}) {
  try {
    const { data, error } = await supabase
      .from("tasks")
      .insert(taskData)
      .select(`
        *,
        assigned_to_user:users!assigned_to(id, first_name, last_name, email),
        assigned_by_user:users!assigned_by(id, first_name, last_name, email)
      `)

    if (error) {
      console.error("Error al añadir tarea:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("Error inesperado al añadir tarea:", error)
    throw error
  }
}

// Actualizar la función updateOpportunity para validar el valor de partner_responsible
// y solo incluirlo en el updateData si es un UUID válido

// Reemplazar la función updateOpportunity actual con esta versión mejorada:
export async function updateOpportunity(opportunityData: {
  id: string
  estimated_close_date: string | null
  partner_responsible: string
  description?: string
}) {
  try {
    // Inicializar el objeto de actualización con los campos seguros
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    // Añadir fecha de cierre estimada si está presente
    if (opportunityData.estimated_close_date !== undefined) {
      updateData.estimated_close_date = opportunityData.estimated_close_date
    }

    // Validar y añadir partner_responsible_id solo si es un UUID válido y no está vacío
    if (
      opportunityData.partner_responsible &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        opportunityData.partner_responsible,
      )
    ) {
      updateData.partner_responsible_id = opportunityData.partner_responsible
      console.log("Partner responsible ID válido:", opportunityData.partner_responsible)
    } else if (opportunityData.partner_responsible === "") {
      // Si está vacío, establecer a null explícitamente
      updateData.partner_responsible_id = null
      console.log("Partner responsible ID vacío, estableciendo a null")
    } else {
      console.warn("Partner responsible ID no válido, omitiendo del update:", opportunityData.partner_responsible)
    }

    // Añadir descripción si está presente
    if (opportunityData.description !== undefined) {
      updateData.description = opportunityData.description
    }

    console.log("Datos de actualización:", updateData)

    const { data, error } = await supabase
      .from("opportunities")
      .update(updateData)
      .eq("id", opportunityData.id)
      .select()

    if (error) {
      console.error("Error al actualizar oportunidad:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("Error inesperado al actualizar oportunidad:", error)
    return []
  }
}

// Obtener campos técnicos para oportunidades
export async function getTechFieldsForOpportunity(opportunityId: string) {
  try {
    // Primero obtenemos todos los campos técnicos disponibles
    const { data: allTechFields, error: allTechFieldsError } = await supabase
      .from("opportunity_tech_fields")
      .select("*")
      .order("display_order", { ascending: true })

    if (allTechFieldsError) {
      console.error("Error al obtener todos los campos técnicos:", allTechFieldsError)
      return []
    }

    console.log("Campos técnicos obtenidos:", allTechFields?.length || 0)
    console.log("Muestra de campos técnicos:", allTechFields?.[0])

    // Crear un mapa de ID a campo técnico para acceso rápido
    const techFieldsMap = new Map()
    allTechFields?.forEach((field) => {
      techFieldsMap.set(field.id, field)
    })

    // Ahora obtenemos los valores de los campos técnicos para esta oportunidad
    const { data: techFieldsData, error: techFieldsError } = await supabase
      .from("opportunity_tech_values")
      .select("*")
      .eq("opportunity_id", opportunityId)

    if (techFieldsError) {
      console.error("Error al obtener valores de campos técnicos:", techFieldsError)
      return []
    }

    console.log("Valores de campos técnicos cargados:", techFieldsData?.length || 0)
    console.log("Muestra de valores de campos técnicos:", techFieldsData?.[0])

    // Enriquecer los valores con la información del campo técnico
    const enrichedTechFieldsData =
      techFieldsData?.map((value) => {
        const fieldInfo = techFieldsMap.get(value.opportunity_tech_field_id)

        // Registrar para depuración
        console.log(
          `Campo ${value.opportunity_tech_field_id} (${fieldInfo?.field_type || "desconocido"}): valor cargado = ${
            value.value_text ||
            value.value_numeric ||
            (value.value_boolean !== null ? (value.value_boolean ? "Sí" : "No") : "") ||
            value.value_date ||
            value.value_json ||
            "null"
          }`,
        )

        return {
          ...value,
          field_info: fieldInfo,
        }
      }) || []

    return enrichedTechFieldsData
  } catch (error) {
    console.error("Error inesperado al obtener campos técnicos:", error)
    return []
  }
}

// Generar resumen de la reunión
export async function generateMeetingSummary(meetingData: {
  tech_company_id: string
  partner_id: string
  reviewed_opportunities: string[]
  all_opportunities: string[]
  tasks: any[]
}) {
  // Esta función generaría un resumen de la reunión
  // En una implementación real, podría guardar el resumen en la base de datos
  // y/o enviarlo por correo electrónico

  return {
    date: new Date().toISOString(),
    tech_company_id: meetingData.tech_company_id,
    partner_id: meetingData.partner_id,
    reviewed_count: meetingData.reviewed_opportunities.length,
    total_count: meetingData.all_opportunities.length,
    tasks_count: meetingData.tasks.length,
  }
}

// Obtener usuarios
export async function getUsers() {
  try {
    console.log("Fetching users")

    const { data, error } = await supabase
      .from("users")
      .select("id, email, first_name, last_name, role_id")
      .order("first_name")

    if (error) {
      console.error("Error al obtener usuarios:", error)
      return []
    }

    console.log("Fetched users:", data?.length || 0)
    return data || []
  } catch (error) {
    console.error("Error inesperado al obtener usuarios:", error)
    return []
  }
}

// Obtener usuarios de un partner específico
export async function getUsersByPartner(partnerId: string): Promise<any[]> {
  try {
    console.log("Fetching users for partner:", partnerId)

    const { data, error } = await supabase
      .from("users")
      .select("id, email, first_name, last_name, partner_id, role_id")
      .eq("partner_id", partnerId)
      .order("first_name", { ascending: true })

    if (error) {
      console.error("Error al obtener usuarios del partner:", error)
      return []
    }

    console.log("Partner users found:", data?.length || 0)
    return data || []
  } catch (error) {
    console.error("Error al obtener usuarios del partner:", error)
    return []
  }
}

// Obtener usuarios de una tech company específica
export async function getUsersByTechCompany(techCompanyId: string) {
  try {
    console.log("Fetching users for tech company:", techCompanyId)

    const { data, error } = await supabase
      .from("users")
      .select("id, email, first_name, last_name, role_id")
      .eq("tech_company_id", techCompanyId)
      .order("first_name")

    if (error) {
      console.error("Error al obtener usuarios de la tech company:", error)
      return []
    }

    console.log("Fetched tech company users:", data?.length || 0)
    return data || []
  } catch (error) {
    console.error("Error inesperado al obtener usuarios de la tech company:", error)
    return []
  }
}

// Obtener el BDD responsable de la relación TechCompany-Partner
export async function getResponsibleBDD(techCompanyId: string, partnerId: string): Promise<any[]> {
  try {
    console.log("Fetching responsible BDD for tech company:", techCompanyId, "and partner:", partnerId)

    // Primero, obtenemos el ID del rol BDD
    const { data: roleData, error: roleError } = await supabase.from("roles").select("id").eq("code", "BDD").single()

    if (roleError) {
      console.error("Error al obtener el rol BDD:", roleError)
      return []
    }

    if (!roleData) {
      console.error("No se encontró el rol BDD")
      return []
    }

    const bddRoleId = roleData.id
    console.log("BDD role ID:", bddRoleId)

    // Intentamos obtener el BDD responsable de la relación específica
    // Primero verificamos si hay un campo scaleup_manager_id en la tabla partner_tech_companies
    const { data: relationData, error: relationError } = await supabase
      .from("partner_tech_companies")
      .select("scaleup_manager_id") // Cambiado de manager_id a scaleup_manager_id
      .eq("tech_company_id", techCompanyId)
      .eq("partner_id", partnerId)
      .single()

    console.log("Relation data:", relationData, "Error:", relationError)

    if (!relationError && relationData && relationData.scaleup_manager_id) {
      // Cambiado de manager_id a scaleup_manager_id
      // Si encontramos un scaleup_manager_id, obtenemos ese usuario específico
      const { data: managerData, error: managerError } = await supabase
        .from("users")
        .select("id, email, first_name, last_name, role_id")
        .eq("id", relationData.scaleup_manager_id) // Cambiado de manager_id a scaleup_manager_id

      console.log("Manager data:", managerData, "Error:", managerError)

      if (!managerError && managerData && managerData.length > 0) {
        console.log("Found specific manager for this relationship:", managerData)
        return managerData
      }
    }

    // Si no encontramos un manager específico, buscamos un BDD que esté asignado a este partner
    const { data: partnerBDDs, error: partnerBDDsError } = await supabase
      .from("users")
      .select("id, email, first_name, last_name, role_id")
      .eq("role_id", bddRoleId)
      .eq("partner_id", partnerId)
      .order("first_name")

    console.log("Partner BDDs:", partnerBDDs, "Error:", partnerBDDsError)

    if (!partnerBDDsError && partnerBDDs && partnerBDDs.length > 0) {
      console.log("Found BDDs assigned to this partner:", partnerBDDs)
      return partnerBDDs
    }

    // Si tampoco encontramos BDDs asignados al partner, buscamos BDDs asignados a la tech company
    const { data: techBDDs, error: techBDDsError } = await supabase
      .from("users")
      .select("id, email, first_name, last_name, role_id")
      .eq("role_id", bddRoleId)
      .eq("tech_company_id", techCompanyId)
      .order("first_name")

    console.log("Tech company BDDs:", techBDDs, "Error:", techBDDsError)

    if (!techBDDsError && techBDDs && techBDDs.length > 0) {
      console.log("Found BDDs assigned to this tech company:", techBDDs)
      return techBDDs
    }

    // Si no encontramos ningún BDD específico, obtenemos al menos un BDD
    console.log("No specific BDD found, getting any BDD")
    const { data: anyBDD, error: anyBDDError } = await supabase
      .from("users")
      .select("id, email, first_name, last_name, role_id")
      .eq("role_id", bddRoleId)
      .limit(1)

    console.log("Any BDD:", anyBDD, "Error:", anyBDDError)

    if (!anyBDDError && anyBDD && anyBDD.length > 0) {
      console.log("Found at least one BDD:", anyBDD)
      return anyBDD
    }

    console.log("No BDD found at all, returning empty array")
    return []
  } catch (error) {
    console.error("Error al obtener el BDD responsable:", error)
    return []
  }
}

// Obtener usuarios para asignar tareas (Partner + BDD responsable)
export async function getUsersForTaskAssignment(partnerId: string, techCompanyId: string): Promise<any[]> {
  try {
    console.log("Getting users for task assignment - Partner:", partnerId, "Tech Company:", techCompanyId)

    // Obtener usuarios del partner
    const partnerUsers = await getUsersByPartner(partnerId)
    console.log("Partner users:", partnerUsers.length)

    // Obtener el BDD responsable de esta relación específica
    const responsibleBDDs = await getResponsibleBDD(techCompanyId, partnerId)
    console.log("Responsible BDDs:", responsibleBDDs.length)

    // Combinar ambos conjuntos de usuarios
    const allUsers = [...partnerUsers, ...responsibleBDDs]
    console.log("Combined users before deduplication:", allUsers.length)

    // Eliminar duplicados por ID
    const uniqueUsers = allUsers.filter((user, index, self) => index === self.findIndex((u) => u.id === user.id))
    console.log("Unique users after deduplication:", uniqueUsers.length)

    // Ordenar alfabéticamente por nombre
    uniqueUsers.sort((a, b) => {
      const nameA = `${a.first_name || ""} ${a.last_name || ""}`.trim()
      const nameB = `${b.first_name || ""} ${b.last_name || ""}`.trim()
      return nameA.localeCompare(nameB)
    })

    console.log("Final users for task assignment:", uniqueUsers)
    return uniqueUsers
  } catch (error) {
    console.error("Error al obtener usuarios para asignar tareas:", error)
    return []
  }
}

// Esta función ya no se usa para asignar tareas, pero la mantenemos por compatibilidad
export async function getRelevantUsersForOpportunity(partnerId: string, techCompanyId: string): Promise<any[]> {
  // Redirigimos a la función correcta
  return getUsersForTaskAssignment(partnerId, techCompanyId)
}

// Enviar email con el resumen de la reunión
export async function sendMeetingSummaryEmail(emailData: {
  to: string[]
  subject: string
  html: string
  from: string
  replyTo?: string
  partnerName: string
  techCompanyName: string
}): Promise<{ success: boolean; message?: string }> {
  try {
    console.log("Preparando envío de email a:", emailData.to)
    console.log("Asunto:", emailData.subject)
    console.log("De:", emailData.from)

    // Enviar el email usando la API route
    const response = await fetch("/api/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailData),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error("Error en la respuesta de la API:", result)
      throw new Error(result.message || "Error al enviar el email")
    }

    console.log("Email enviado correctamente:", result)
    return { success: true }
  } catch (error: any) {
    console.error("Error sending email:", error)
    return {
      success: false,
      message: error.message || "Error al enviar el email",
    }
  }
}

// Preparar datos para el resumen de la reunión
export function prepareMeetingSummaryData(data: {
  partnerName: string
  techCompanyName: string
  opportunities: any[]
  reviewedOpportunityIds: string[]
  meetingStartTime: Date
}) {
  const { partnerName, techCompanyName, opportunities, reviewedOpportunityIds, meetingStartTime } = data

  // Separar oportunidades revisadas y no revisadas
  const reviewedOpportunities = opportunities.filter((opp) => reviewedOpportunityIds.includes(opp.id))
  const unReviewedOpportunities = opportunities.filter((opp) => !reviewedOpportunityIds.includes(opp.id))

  // Fecha límite para tareas próximas (7 días desde hoy)
  const upcomingTasksLimit = addDays(new Date(), 7)

  // Preparar datos de oportunidades revisadas
  const reviewedOpportunitiesData = reviewedOpportunities.map((opp) => {
    // Filtrar tareas próximas (vencen en los próximos 7 días)
    const upcomingTasks = (opp.tasks || [])
      .filter((task: any) => {
        const dueDate = parseISO(task.due_date)
        return dueDate <= upcomingTasksLimit
      })
      .map((task: any) => ({
        title: task.title,
        dueDate: format(parseISO(task.due_date), "dd/MM/yyyy", { locale: es }),
        responsible: task.assigned_to_user
          ? `${task.assigned_to_user.first_name || ""} ${task.assigned_to_user.last_name || ""}`.trim()
          : "Sin asignar",
      }))

    // Filtrar tareas creadas durante la reunión
    const newTasks = (opp.tasks || [])
      .filter((task: any) => {
        const createdAt = parseISO(task.created_at)
        return createdAt >= meetingStartTime
      })
      .map((task: any) => ({
        title: task.title,
        dueDate: format(parseISO(task.due_date), "dd/MM/yyyy", { locale: es }),
        responsible: task.assigned_to_user
          ? `${task.assigned_to_user.first_name || ""} ${task.assigned_to_user.last_name || ""}`.trim()
          : "Sin asignar",
      }))

    return {
      title: opp.name || "Sin título",
      endCustomer: opp.end_customer?.name || "Sin cliente final",
      upcomingTasks,
      newTasks,
    }
  })

  // Preparar datos de oportunidades no revisadas
  const unReviewedOpportunitiesData = unReviewedOpportunities.map((opp) => {
    // Filtrar tareas próximas (vencen en los próximos 7 días)
    const upcomingTasks = (opp.tasks || [])
      .filter((task: any) => {
        const dueDate = parseISO(task.due_date)
        return dueDate <= upcomingTasksLimit
      })
      .map((task: any) => ({
        title: task.title,
        dueDate: format(parseISO(task.due_date), "dd/MM/yyyy", { locale: es }),
        responsible: task.assigned_to_user
          ? `${task.assigned_to_user.first_name || ""} ${task.assigned_to_user.last_name || ""}`.trim()
          : "Sin asignar",
      }))

    return {
      title: opp.name || "Sin título",
      endCustomer: opp.end_customer?.name || "Sin cliente final",
      upcomingTasks,
    }
  })

  // Calcular estadísticas
  const totalCount = opportunities.length
  const reviewedCount = reviewedOpportunities.length
  const reviewedPercentage = totalCount > 0 ? Math.round((reviewedCount / totalCount) * 100) : 0

  // Contar tareas próximas
  const upcomingTasksCount = [...reviewedOpportunitiesData, ...unReviewedOpportunitiesData].reduce(
    (count, opp) => count + (opp.upcomingTasks?.length || 0),
    0,
  )

  // Contar tareas nuevas
  const newTasksCount = reviewedOpportunitiesData.reduce((count, opp) => count + (opp.newTasks?.length || 0), 0)

  return {
    partnerName,
    techCompanyName,
    date: format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es }),
    reviewedOpportunities: reviewedOpportunitiesData,
    unReviewedOpportunities: unReviewedOpportunitiesData,
    stats: {
      reviewedCount,
      totalCount,
      reviewedPercentage,
      upcomingTasksCount,
      newTasksCount,
    },
  }
}
