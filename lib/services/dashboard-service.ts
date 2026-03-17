import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/supabase"

export type KpiData = {
  pipelineValue: number
  conversionRate: number
  avgCycleTime: number
  newOpportunities: number
  newOpportunitiesChange: number
  closedOpportunities: number
  closedOpportunitiesChange: number
}

export type PipelineStage = {
  name: string
  count: number
  value: number
  color: string
}

export type PipelineData = {
  stages: PipelineStage[]
  totalCount: number
  totalValue: number
}

export type BddData = {
  id: string
  name: string
  avatar: string | null
  opportunities: number
  pipelineValue: number
  conversionRate: number
  avgCycleTime: number
  trend: number
}

export type PartnerData = {
  id: string
  name: string
  logo: string | null
  opportunities: number
  pipelineValue: number
  techCompanies: number
  countries: string[]
}

export type TechCompanyData = {
  id: string
  name: string
  logo: string | null
  opportunities: number
  pipelineValue: number
  partners: number
  category: string
}

export type ActionItem = {
  id: string
  type: "validation" | "risk" | "assignment" | "task"
  title: string
  description: string
  priority: "high" | "medium" | "low"
  dueDate?: string
}

export async function fetchDashboardKpis(): Promise<{ data: KpiData | null; error: any }> {
  const supabase = createClientComponentClient<Database>()

  try {
    // Obtener el valor total del pipeline (suma de los valores de todas las oportunidades)
    const { data: pipelineData, error: pipelineError } = await supabase.from("opportunities").select("estimated_value")

    if (pipelineError) throw pipelineError

    const pipelineValue = pipelineData.reduce((sum, opp) => sum + (opp.estimated_value || 0), 0)

    // Obtener tasa de conversión (oportunidades cerradas / total de oportunidades)
    const { data: closedData, error: closedError } = await supabase
      .from("opportunities")
      .select("count")
      .eq("validation_status", "closed")
      .single()

    if (closedError && closedError.code !== "PGRST116") throw closedError

    const { data: totalData, error: totalError } = await supabase.from("opportunities").select("count").single()

    if (totalError) throw totalError

    const closedCount = closedData?.count || 0
    const totalCount = totalData?.count || 1 // Evitar división por cero
    const conversionRate = (closedCount / totalCount) * 100

    // Obtener tiempo promedio de ciclo (días desde creación hasta cierre estimado)
    const { data: cycleData, error: cycleError } = await supabase
      .from("opportunities")
      .select("created_at, estimated_close_date")
      .not("estimated_close_date", "is", null)

    if (cycleError) throw cycleError

    let totalDays = 0
    cycleData.forEach((opp) => {
      if (opp.created_at && opp.estimated_close_date) {
        const created = new Date(opp.created_at)
        const closed = new Date(opp.estimated_close_date)
        const diffTime = Math.abs(closed.getTime() - created.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        totalDays += diffDays
      }
    })

    const avgCycleTime = cycleData.length > 0 ? Math.round(totalDays / cycleData.length) : 0

    // Obtener nuevas oportunidades (creadas en el último mes)
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

    const { data: newOppsData, error: newOppsError } = await supabase
      .from("opportunities")
      .select("count")
      .gte("created_at", oneMonthAgo.toISOString())
      .single()

    if (newOppsError && newOppsError.code !== "PGRST116") throw newOppsError

    const newOpportunities = newOppsData?.count || 0

    // Obtener cambio en nuevas oportunidades (comparado con el mes anterior)
    const twoMonthsAgo = new Date()
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2)

    const { data: prevMonthData, error: prevMonthError } = await supabase
      .from("opportunities")
      .select("count")
      .gte("created_at", twoMonthsAgo.toISOString())
      .lt("created_at", oneMonthAgo.toISOString())
      .single()

    if (prevMonthError && prevMonthError.code !== "PGRST116") throw prevMonthError

    const prevMonthCount = prevMonthData?.count || 1 // Evitar división por cero
    const newOpportunitiesChange = ((newOpportunities - prevMonthCount) / prevMonthCount) * 100

    // Obtener oportunidades cerradas (en el último mes)
    const { data: closedOppsData, error: closedOppsError } = await supabase
      .from("opportunities")
      .select("count")
      .eq("validation_status", "closed")
      .gte("estimated_close_date", oneMonthAgo.toISOString())
      .single()

    if (closedOppsError && closedOppsError.code !== "PGRST116") throw closedOppsError

    const closedOpportunities = closedOppsData?.count || 0

    // Obtener cambio en oportunidades cerradas (comparado con el mes anterior)
    const { data: prevClosedData, error: prevClosedError } = await supabase
      .from("opportunities")
      .select("count")
      .eq("validation_status", "closed")
      .gte("estimated_close_date", twoMonthsAgo.toISOString())
      .lt("estimated_close_date", oneMonthAgo.toISOString())
      .single()

    if (prevClosedError && prevClosedError.code !== "PGRST116") throw prevClosedError

    const prevClosedCount = prevClosedData?.count || 1 // Evitar división por cero
    const closedOpportunitiesChange = ((closedOpportunities - prevClosedCount) / prevClosedCount) * 100

    return {
      data: {
        pipelineValue,
        conversionRate: Number.parseFloat(conversionRate.toFixed(1)),
        avgCycleTime,
        newOpportunities,
        newOpportunitiesChange: Number.parseFloat(newOpportunitiesChange.toFixed(1)),
        closedOpportunities,
        closedOpportunitiesChange: Number.parseFloat(closedOpportunitiesChange.toFixed(1)),
      },
      error: null,
    }
  } catch (error) {
    console.error("Error fetching KPI data:", error)
    return { data: null, error }
  }
}

export async function fetchPipelineData(): Promise<{ data: PipelineData | null; error: any }> {
  const supabase = createClientComponentClient<Database>()

  try {
    // Obtener etapas del pipeline
    const { data: stagesData, error: stagesError } = await supabase
      .from("pipeline_stages")
      .select("*")
      .order("display_order")

    if (stagesError) throw stagesError

    if (!stagesData || stagesData.length === 0) {
      return { data: null, error: new Error("No pipeline stages found") }
    }

    // Colores para las etapas
    const colors = ["bg-primary/20", "bg-primary/40", "bg-primary/60", "bg-primary/80", "bg-primary"]

    // Obtener oportunidades por etapa
    const stages = await Promise.all(
      stagesData.map(async (stage, index) => {
        const { data: oppsData, error: oppsError } = await supabase
          .from("opportunities")
          .select("id, estimated_value")
          .eq("pipeline_stage_id", stage.id)

        if (oppsError) throw oppsError

        const count = oppsData?.length || 0
        const value = oppsData?.reduce((sum, opp) => sum + (opp.estimated_value || 0), 0) || 0

        return {
          name: stage.code || `Stage ${stage.id}`,
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
    console.error("Error fetching pipeline data:", error)
    return { data: null, error }
  }
}

export async function fetchBddPerformanceData(): Promise<{ data: BddData[] | null; error: any }> {
  const supabase = createClientComponentClient<Database>()

  try {
    // Obtener usuarios con rol de BDD
    const { data: bddsData, error: bddsError } = await supabase
      .from("users")
      .select("id, first_name, last_name, profile_image")
      .eq("role", "bdd")

    if (bddsError) throw bddsError

    if (!bddsData || bddsData.length === 0) {
      return { data: [], error: null }
    }

    // Obtener métricas para cada BDD
    const bdds = await Promise.all(
      bddsData.map(async (bdd) => {
        // Oportunidades asignadas a este BDD
        const { data: oppsData, error: oppsError } = await supabase
          .from("opportunities")
          .select("id, estimated_value, created_at, estimated_close_date, validation_status")
          .eq("responsible_id", bdd.id)

        if (oppsError) throw oppsError

        const opportunities = oppsData?.length || 0
        const pipelineValue = oppsData?.reduce((sum, opp) => sum + (opp.estimated_value || 0), 0) || 0

        // Calcular tasa de conversión
        const closedOpps = oppsData?.filter((opp) => opp.validation_status === "closed") || []
        const conversionRate = opportunities > 0 ? (closedOpps.length / opportunities) * 100 : 0

        // Calcular tiempo promedio de ciclo
        let totalDays = 0
        closedOpps.forEach((opp) => {
          if (opp.created_at && opp.estimated_close_date) {
            const created = new Date(opp.created_at)
            const closed = new Date(opp.estimated_close_date)
            const diffTime = Math.abs(closed.getTime() - created.getTime())
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
            totalDays += diffDays
          }
        })

        const avgCycleTime = closedOpps.length > 0 ? Math.round(totalDays / closedOpps.length) : 0

        // Calcular tendencia (simulada para este ejemplo)
        // En una implementación real, compararías con datos históricos
        const trend = Math.random() * 10 - 5 // Valor aleatorio entre -5 y 5

        return {
          id: bdd.id,
          name: `${bdd.first_name} ${bdd.last_name}`,
          avatar: bdd.profile_image,
          opportunities,
          pipelineValue,
          conversionRate: Number.parseFloat(conversionRate.toFixed(1)),
          avgCycleTime,
          trend: Number.parseFloat(trend.toFixed(1)),
        }
      }),
    )

    // Ordenar por número de oportunidades (descendente)
    bdds.sort((a, b) => b.opportunities - a.opportunities)

    return { data: bdds, error: null }
  } catch (error) {
    console.error("Error fetching BDD performance data:", error)
    return { data: null, error }
  }
}

export async function fetchPartnersData(): Promise<{ data: PartnerData[] | null; error: any }> {
  const supabase = createClientComponentClient<Database>()

  try {
    // Obtener partners
    const { data: partnersData, error: partnersError } = await supabase.from("partners").select("id, name, logo")

    if (partnersError) throw partnersError

    if (!partnersData || partnersData.length === 0) {
      return { data: [], error: null }
    }

    // Obtener métricas para cada partner
    const partners = await Promise.all(
      partnersData.map(async (partner) => {
        // Oportunidades relacionadas con este partner
        const { data: oppsData, error: oppsError } = await supabase
          .from("opportunities")
          .select("id, estimated_value")
          .eq("partner_id", partner.id)

        if (oppsError) throw oppsError

        const opportunities = oppsData?.length || 0
        const pipelineValue = oppsData?.reduce((sum, opp) => sum + (opp.estimated_value || 0), 0) || 0

        // Tech companies asociadas a este partner
        const { data: techCompaniesData, error: techCompaniesError } = await supabase
          .from("partner_tech_companies")
          .select("tech_company_id")
          .eq("partner_id", partner.id)

        if (techCompaniesError) throw techCompaniesError

        const techCompanies = techCompaniesData?.length || 0

        // Países donde opera el partner
        const { data: countriesData, error: countriesError } = await supabase
          .from("partner_countries")
          .select("country")
          .eq("partner_id", partner.id)

        if (countriesError) throw countriesError

        const countries = countriesData?.map((c) => c.country) || []

        return {
          id: partner.id,
          name: partner.name,
          logo: partner.logo,
          opportunities,
          pipelineValue,
          techCompanies,
          countries,
        }
      }),
    )

    // Ordenar por valor del pipeline (descendente)
    partners.sort((a, b) => b.pipelineValue - a.pipelineValue)

    // Limitar a los 5 principales partners
    return { data: partners.slice(0, 5), error: null }
  } catch (error) {
    console.error("Error fetching partners data:", error)
    return { data: null, error }
  }
}

export async function fetchTechCompaniesData(): Promise<{ data: TechCompanyData[] | null; error: any }> {
  const supabase = createClientComponentClient<Database>()

  try {
    // Obtener tech companies
    const { data: techCompaniesData, error: techCompaniesError } = await supabase
      .from("tech_companies")
      .select("id, name, logo, category")

    if (techCompaniesError) throw techCompaniesError

    if (!techCompaniesData || techCompaniesData.length === 0) {
      return { data: [], error: null }
    }

    // Obtener métricas para cada tech company
    const techCompanies = await Promise.all(
      techCompaniesData.map(async (company) => {
        // Oportunidades relacionadas con esta tech company
        const { data: oppsData, error: oppsError } = await supabase
          .from("opportunities")
          .select("id, estimated_value")
          .eq("tech_company_id", company.id)

        if (oppsError) throw oppsError

        const opportunities = oppsData?.length || 0
        const pipelineValue = oppsData?.reduce((sum, opp) => sum + (opp.estimated_value || 0), 0) || 0

        // Partners asociados a esta tech company
        const { data: partnersData, error: partnersError } = await supabase
          .from("partner_tech_companies")
          .select("partner_id")
          .eq("tech_company_id", company.id)

        if (partnersError) throw partnersError

        const partners = partnersData?.length || 0

        return {
          id: company.id,
          name: company.name,
          logo: company.logo,
          opportunities,
          pipelineValue,
          partners,
          category: company.category || "Sin categoría",
        }
      }),
    )

    // Ordenar por valor del pipeline (descendente)
    techCompanies.sort((a, b) => b.pipelineValue - a.pipelineValue)

    // Limitar a las 5 principales tech companies
    return { data: techCompanies.slice(0, 5), error: null }
  } catch (error) {
    console.error("Error fetching tech companies data:", error)
    return { data: null, error }
  }
}

export async function fetchActionItems(): Promise<{ data: ActionItem[] | null; error: any }> {
  const supabase = createClientComponentClient<Database>()

  try {
    // Obtener oportunidades que requieren validación (ejemplo: oportunidades nuevas)
    const { data: validationData, error: validationError } = await supabase
      .from("opportunities")
      .select("id, name, tech_company_id, tech_companies(name)")
      .is("validated", false)
      .order("created_at", { ascending: false })
      .limit(2)

    if (validationError) throw validationError

    // Obtener oportunidades en riesgo (ejemplo: sin actividad reciente)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: riskData, error: riskError } = await supabase
      .from("opportunities")
      .select("id, name, tech_company_id, tech_companies(name)")
      .lt("last_activity", thirtyDaysAgo.toISOString())
      .not("validation_status", "eq", "closed")
      .order("last_activity")
      .limit(2)

    if (riskError) throw riskError

    // Obtener oportunidades sin BDD asignado
    const { data: assignmentData, error: assignmentError } = await supabase
      .from("opportunities")
      .select("id, name, tech_company_id, tech_companies(name)")
      .is("responsible_id", null)
      .order("created_at", { ascending: false })
      .limit(2)

    if (assignmentError) throw assignmentError

    // Obtener tareas vencidas
    const today = new Date()

    const { data: tasksData, error: tasksError } = await supabase
      .from("tasks")
      .select("id, title, description, due_date")
      .lt("due_date", today.toISOString())
      .eq("status", "pending")
      .order("due_date")
      .limit(2)

    if (tasksError) throw tasksError

    // Combinar todos los elementos de acción
    const actionItems: ActionItem[] = [
      ...(validationData || []).map((opp) => ({
        id: `validation-${opp.id}`,
        type: "validation" as const,
        title: `Validar oportunidad: ${opp.tech_companies?.name || "Desconocido"} - ${opp.name}`,
        description: "Oportunidad que requiere validación",
        priority: "high" as const,
      })),
      ...(riskData || []).map((opp) => ({
        id: `risk-${opp.id}`,
        type: "risk" as const,
        title: `Riesgo: ${opp.tech_companies?.name || "Desconocido"} - ${opp.name}`,
        description: "Sin actividad en los últimos 30 días",
        priority: "high" as const,
      })),
      ...(assignmentData || []).map((opp) => ({
        id: `assignment-${opp.id}`,
        type: "assignment" as const,
        title: `Asignar BDD: ${opp.tech_companies?.name || "Desconocido"} - ${opp.name}`,
        description: "Oportunidad sin BDD asignado",
        priority: "medium" as const,
      })),
      ...(tasksData || []).map((task) => ({
        id: `task-${task.id}`,
        type: "task" as const,
        title: `Tarea vencida: ${task.title}`,
        description: task.description || "Tarea pendiente vencida",
        priority: "medium" as const,
        dueDate: task.due_date,
      })),
    ]

    return { data: actionItems, error: null }
  } catch (error) {
    console.error("Error fetching action items:", error)
    return { data: null, error }
  }
}
