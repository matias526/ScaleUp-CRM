//import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { supabase } from "@/lib/supabase/client"
import type { Database } from "@/types/supabase"

export type BddKpiData = {
  pipelineValue: number
  conversionRate: number
  totalOpportunities: number
  activeOpportunities: number
  activeOpportunitiesChange: number
  closedOpportunities: number
  closedOpportunitiesChange: number
}

export type PipelineStage = {
  code: string
  count: number
  value: number
  color: string
}

export type PipelineData = {
  stages: PipelineStage[]
  totalCount: number
  totalValue: number
}

export type ActivityItem = {
  id: string
  type: "task" | "meeting" | "followup" | "note"
  title: string
  description: string
  dueDate: string
  isPastDue: boolean
  priority: "high" | "medium" | "low"
  relatedTo?: {
    id: string
    name: string
    type: string
  }
}

export type BddPartnerData = {
  id: string
  name: string
  logo: string | null
  opportunities: number
  pipelineValue: number
  techCompanies: number
  countries: string[]
  lastActivity?: string
  lastActivityType?: string
}

// Estados que indican que una oportunidad no está activa
const INACTIVE_VALIDATION_STATUSES = ["Won", "Lost", "Freeze"]
// Etapas que no queremos mostrar en el pipeline
const EXCLUDED_STAGES = ["Won", "Lost", "Freeze"]

export async function fetchBddKpis(): Promise<{ data: BddKpiData | null; error: any }> {
  //const supabase = createClientComponentClient<Database>()

  try {
    // Obtener el usuario actual
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError

    const userId = userData.user?.id
    if (!userId) {
      return { data: null, error: new Error("Usuario no autenticado") }
    }

    // Obtener todas las oportunidades asignadas a este BDD
    const { data: allOpportunities, error: allOppsError } = await supabase
      .from("opportunities")
      .select("id, estimated_value, validation_status, created_at, updated_at, pipeline_stage_id")
      .eq("assigned_to", userId)

    if (allOppsError) throw allOppsError

    // Obtener etapas del pipeline para filtrar por código
    const { data: stagesData, error: stagesError } = await supabase.from("pipeline_stages").select("id, code")

    if (stagesError) throw stagesError

    // Crear un mapa de id de etapa a código para facilitar el filtrado
    const stageCodeMap = new Map(stagesData.map((stage) => [stage.id, stage.code]))

    // Filtrar oportunidades activas (excluyendo Won, Lost, Freeze)
    const activeOpps = allOpportunities.filter((opp) => {
      const stageCode = stageCodeMap.get(opp.pipeline_stage_id)
      return stageCode && !EXCLUDED_STAGES.includes(stageCode)
    })

    const inactiveOpps = allOpportunities.filter((opp) => {
      const stageCode = stageCodeMap.get(opp.pipeline_stage_id)
      return stageCode && EXCLUDED_STAGES.includes(stageCode)
    })

    // Calcular métricas
    const totalOpportunities = allOpportunities.length
    const activeOpportunities = activeOpps.length
    const closedOpportunities = inactiveOpps.length
    const pipelineValue = activeOpps.reduce((sum, opp) => sum + (opp.estimated_value || 0), 0)
    const conversionRate = totalOpportunities > 0 ? (closedOpportunities / totalOpportunities) * 100 : 0

    // Calcular cambios en oportunidades activas (comparado con el mes anterior)
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

    const prevMonthActiveOpps = activeOpps.filter((opp) => new Date(opp.created_at) < oneMonthAgo).length

    const activeOpportunitiesChange =
      prevMonthActiveOpps > 0 ? ((activeOpportunities - prevMonthActiveOpps) / prevMonthActiveOpps) * 100 : 0

    // Calcular cambios en oportunidades cerradas (comparado con el mes anterior)
    const recentClosedOpps = inactiveOpps.filter((opp) => new Date(opp.updated_at) >= oneMonthAgo).length

    const twoMonthsAgo = new Date()
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2)

    const prevClosedOpps = inactiveOpps.filter(
      (opp) => new Date(opp.updated_at) >= twoMonthsAgo && new Date(opp.updated_at) < oneMonthAgo,
    ).length

    const closedOpportunitiesChange =
      prevClosedOpps > 0 ? ((recentClosedOpps - prevClosedOpps) / prevClosedOpps) * 100 : 0

    return {
      data: {
        pipelineValue,
        conversionRate: Number.parseFloat(conversionRate.toFixed(1)),
        totalOpportunities,
        activeOpportunities,
        activeOpportunitiesChange: Number.parseFloat(activeOpportunitiesChange.toFixed(1)),
        closedOpportunities: recentClosedOpps,
        closedOpportunitiesChange: Number.parseFloat(closedOpportunitiesChange.toFixed(1)),
      },
      error: null,
    }
  } catch (error) {
    console.error("Error fetching BDD KPI data:", error)
    return { data: null, error }
  }
}

export async function fetchBddPipelineData(): Promise<{ data: PipelineData | null; error: any }> {
  //const supabase = createClientComponentClient<Database>()

  try {
    // Obtener el usuario actual
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError

    const userId = userData.user?.id
    if (!userId) {
      return { data: null, error: new Error("Usuario no autenticado") }
    }

    // Obtener etapas del pipeline - incluimos display_order para ordenar correctamente
    const { data: stagesData, error: stagesError } = await supabase
      .from("pipeline_stages")
      .select("id, code, display_order")
      .not("code", "in", `(${EXCLUDED_STAGES.join(",")})`) // Excluir etapas Won, Lost y Freeze
      .order("display_order", { ascending: true })

    if (stagesError) throw stagesError

    if (!stagesData || stagesData.length === 0) {
      return { data: null, error: new Error("No pipeline stages found") }
    }

    // Colores para las etapas
    const colors = ["bg-blue-500", "bg-green-500", "bg-yellow-500", "bg-purple-500", "bg-pink-500"]

    // Obtener oportunidades por etapa para este BDD
    const stages = await Promise.all(
      stagesData.map(async (stage, index) => {
        const { data: oppsData, error: oppsError } = await supabase
          .from("opportunities")
          .select("id, estimated_value")
          .eq("pipeline_stage_id", stage.id)
          .eq("assigned_to", userId)

        if (oppsError) throw oppsError

        const count = oppsData?.length || 0
        const value = oppsData?.reduce((sum, opp) => sum + (opp.estimated_value || 0), 0) || 0

        return {
          code: stage.code || `S${stage.id}`,
          count,
          value,
          color: colors[index % colors.length],
        }
      }),
    )

    // Calcular totales
    const totalCount = stages.reduce((sum, stage) => sum + stage.count, 0)
    const totalValue = stages.reduce((sum, stage) => sum + stage.value, 0)

    return {
      data: {
        stages,
        totalCount,
        totalValue,
      },
      error: null,
    }
  } catch (error) {
    console.error("Error fetching BDD pipeline data:", error)
    return { data: null, error }
  }
}

export async function fetchBddUpcomingActivities(): Promise<{ data: ActivityItem[] | null; error: any }> {
  //const supabase = createClientComponentClient<Database>()

  try {
    // Obtener el usuario actual
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError

    const userId = userData.user?.id
    if (!userId) {
      return { data: null, error: new Error("Usuario no autenticado") }
    }

    // Obtener tareas pendientes asignadas a este BDD
    const { data: tasksData, error: tasksError } = await supabase
      .from("tasks")
      .select(
        `
        id, 
        title, 
        description, 
        due_date, 
        opportunity_id,
        opportunities (
          id,
          title
        ),
        partner_id,
        partners (
          id,
          name
        )
      `,
      )
      .eq("assigned_to", userId)
      .eq("status", "pending")
      .order("due_date")
      .limit(10)

    if (tasksError) throw tasksError

    const today = new Date()

    // Transformar los datos de tareas al formato requerido
    const activities: ActivityItem[] = tasksData.map((task) => {
      let relatedTo = undefined

      if (task.opportunity_id && task.opportunities) {
        relatedTo = {
          id: task.opportunity_id,
          name: task.opportunities.title,
          type: "Oportunidad",
        }
      } else if (task.partner_id && task.partners) {
        relatedTo = {
          id: task.partner_id,
          name: task.partners.name,
          type: "Partner",
        }
      }

      const dueDate = task.due_date ? new Date(task.due_date) : null
      const isPastDue = dueDate ? dueDate < today : false

      // Como no tenemos campo priority, asignamos un valor por defecto
      const priority = "medium" as "high" | "medium" | "low"

      return {
        id: task.id,
        type: "task",
        title: task.title,
        description: task.description || "",
        dueDate: task.due_date || "",
        isPastDue,
        priority,
        relatedTo,
      }
    })

    // Ordenar por fecha
    activities.sort((a, b) => {
      // Primero por fecha vencida
      if (a.isPastDue && !b.isPastDue) return -1
      if (!a.isPastDue && b.isPastDue) return 1

      // Finalmente por fecha
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    })

    return { data: activities, error: null }
  } catch (error) {
    console.error("Error fetching BDD upcoming activities:", error)
    return { data: null, error }
  }
}

export async function fetchBddPartnersData(): Promise<{ data: BddPartnerData[] | null; error: any }> {
  //const supabase = createClientComponentClient<Database>()

  try {
    // Obtener el usuario actual
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError

    const userId = userData.user?.id
    if (!userId) {
      return { data: null, error: new Error("Usuario no autenticado") }
    }

    console.log("BDD User ID:", userId)

    // Intentar obtener partners directamente de las oportunidades asignadas al BDD
    console.log("Consultando oportunidades asignadas al BDD para obtener partners...")
    const { data: opportunitiesData, error: opportunitiesError } = await supabase
      .from("opportunities")
      .select("partner_id")
      .eq("assigned_to", userId)
      .not("partner_id", "is", null)

    if (opportunitiesError) {
      console.error("Error al consultar oportunidades:", opportunitiesError)
      throw opportunitiesError
    }

    console.log("Oportunidades encontradas:", opportunitiesData?.length || 0)
    console.log("Datos de oportunidades:", opportunitiesData)

    // Si no hay oportunidades, intentar con otra estrategia
    if (!opportunitiesData || opportunitiesData.length === 0) {
      console.log("No se encontraron oportunidades. Intentando con partner_tech_companies...")

      // Verificar si la tabla partner_tech_companies existe
      try {
        const { data: tableInfo, error: tableError } = await supabase
          .from("partner_tech_companies")
          .select("*")
          .limit(1)

        if (tableError) {
          console.error("Error al verificar tabla partner_tech_companies:", tableError)
          console.log("La tabla partner_tech_companies parece no existir o no es accesible")
        } else {
          console.log("La tabla partner_tech_companies existe:", tableInfo)

          // Intentar consultar partner_tech_companies
          const { data: ptcData, error: ptcError } = await supabase
            .from("partner_tech_companies")
            .select("partner_id, scaleup_manager_id")
            .eq("scaleup_manager_id", userId)

          if (ptcError) {
            console.error("Error al consultar partner_tech_companies:", ptcError)
          } else {
            console.log("Datos de partner_tech_companies:", ptcData)

            if (ptcData && ptcData.length > 0) {
              const partnerIds = [...new Set(ptcData.map((item) => item.partner_id))]
              console.log("Partner IDs encontrados en partner_tech_companies:", partnerIds)

              // Continuar con estos partner IDs
              return await processPartnerIds(supabase, userId, partnerIds)
            }
          }
        }
      } catch (e) {
        console.error("Error al verificar tabla partner_tech_companies:", e)
      }

      // Si llegamos aquí, no se encontraron partners
      return { data: [], error: null }
    }

    // Extraer IDs de partners únicos de las oportunidades
    const partnerIds = [...new Set(opportunitiesData.map((opp) => opp.partner_id))]
    console.log("Partner IDs encontrados en oportunidades:", partnerIds)

    return await processPartnerIds(supabase, userId, partnerIds)
  } catch (error) {
    console.error("Error fetching BDD partners data:", error)
    return { data: null, error }
  }
}

// Función auxiliar para procesar los IDs de partners
async function processPartnerIds(supabase: any, userId: string, partnerIds: string[]) {
  if (!partnerIds || partnerIds.length === 0) {
    return { data: [], error: null }
  }

  // Obtener detalles de los partners
  console.log("Consultando detalles de partners...")
  const { data: partnersData, error: partnersError } = await supabase
    .from("partners")
    .select("id, name, logo_url, city")
    .in("id", partnerIds)

  if (partnersError) {
    console.error("Error al consultar detalles de partners:", partnersError)
    throw partnersError
  }

  console.log("Partners encontrados:", partnersData?.length || 0)
  console.log("Datos de partners:", partnersData)

  if (!partnersData || partnersData.length === 0) {
    return { data: [], error: null }
  }

  // Obtener métricas para cada partner
  const partners = await Promise.all(
    partnersData.map(async (partner) => {
      console.log(`Procesando partner ${partner.id}: ${partner.name}`)

      // Oportunidades relacionadas con este partner
      const { data: oppsData, error: oppsError } = await supabase
        .from("opportunities")
        .select("id, estimated_value, validation_status")
        .eq("partner_id", partner.id)
        .eq("assigned_to", userId)

      if (oppsError) {
        console.error(`Error al consultar oportunidades para partner ${partner.id}:`, oppsError)
        throw oppsError
      }

      // Filtrar solo oportunidades activas
      const activeOpps =
        oppsData?.filter((opp) => !INACTIVE_VALIDATION_STATUSES.includes(opp.validation_status || "")) || []

      const opportunities = activeOpps.length
      const pipelineValue = activeOpps.reduce((sum, opp) => sum + (opp.estimated_value || 0), 0)

      console.log(`Partner ${partner.id}: ${opportunities} oportunidades activas, valor pipeline: ${pipelineValue}`)

      // Tech companies asociadas a este partner
      let techCompanies = 0
      try {
        const { data: techCompaniesData, error: techCompaniesError } = await supabase
          .from("partner_tech_companies")
          .select("tech_company_id")
          .eq("partner_id", partner.id)

        if (techCompaniesError) {
          console.error(`Error al consultar tech companies para partner ${partner.id}:`, techCompaniesError)
        } else {
          techCompanies = techCompaniesData?.length || 0
          console.log(`Partner ${partner.id}: ${techCompanies} tech companies`)
        }
      } catch (e) {
        console.error(`Error al consultar tech companies para partner ${partner.id}:`, e)
      }

      // Países donde opera el partner
      let countries: string[] = []
      try {
        const { data: countriesData, error: countriesError } = await supabase
          .from("partner_countries")
          .select("country")
          .eq("partner_id", partner.id)

        if (countriesError) {
          console.error(`Error al consultar países para partner ${partner.id}:`, countriesError)
        } else {
          countries = countriesData?.map((c) => c.country) || []
          console.log(`Partner ${partner.id}: países: ${countries.join(", ")}`)
        }
      } catch (e) {
        console.error(`Error al consultar países para partner ${partner.id}:`, e)
      }

      // Última actividad con este partner
      let lastActivity: string | undefined = undefined
      let lastActivityType: string | undefined = undefined

      try {
        const { data: lastActivityData, error: lastActivityError } = await supabase
          .from("tasks")
          .select("created_at, title")
          .eq("partner_id", partner.id)
          .eq("assigned_to", userId)
          .order("created_at", { ascending: false })
          .limit(1)

        if (lastActivityError) {
          console.error(`Error al consultar última actividad para partner ${partner.id}:`, lastActivityError)
        } else if (lastActivityData && lastActivityData.length > 0) {
          lastActivity = lastActivityData[0].created_at
          lastActivityType = lastActivityData[0].title.substring(0, 20) + "..."
          console.log(`Partner ${partner.id}: última actividad: ${lastActivity}, tipo: ${lastActivityType}`)
        }
      } catch (e) {
        console.error(`Error al consultar última actividad para partner ${partner.id}:`, e)
      }

      return {
        id: partner.id,
        name: partner.name,
        logo: partner.logo_url,
        opportunities,
        pipelineValue,
        techCompanies,
        countries,
        lastActivity,
        lastActivityType,
      }
    }),
  )

  // Ordenar por valor del pipeline (descendente)
  partners.sort((a, b) => b.pipelineValue - a.pipelineValue)
  console.log(`Total de partners procesados: ${partners.length}`)

  return { data: partners, error: null }
}
