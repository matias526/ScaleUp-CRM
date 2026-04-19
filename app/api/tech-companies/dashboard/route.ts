import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
console.log("--- ENTROOOOO ---")
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()

    console.log("--- DEBUG CONEXIÓN ---")
    console.log("¿URL presente?:", !!process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log("¿Key presente?:", !!process.env.SUPABASE_SERVICE_ROLE_KEY)

    const { count, error: testError } = await supabase
      .from("tech_companies")
      .select('*', { count: 'exact', head: true })

    console.log("Conteo de empresas:", count)
    console.log("Error de prueba:", testError)

    const { searchParams } = new URL(request.url)
    const newPartnerFilter = searchParams.get("newPartnerFilter") || "all"

    // Get all active tech companies
    const { data: techCompanies, error: techCompaniesError } = await supabase
      .from("tech_companies")
      .select("*")
      .eq("is_active", true)
      .order("name")

    if (techCompaniesError) {
      console.error("Error fetching tech companies:", techCompaniesError)
      return NextResponse.json({ success: false, error: "Failed to fetch tech companies" }, { status: 500 })
    }

    // Get dashboard data for each tech company
    const dashboardData = await Promise.all(
      techCompanies.map(async (company) => {
        try {
          let opportunitiesQuery = supabase
            .from("opportunities")
            .select(`
              id,
              title,
              estimated_value,
              estimated_close_date,
              created_at,
              updated_at,
              pipeline_stage_id,
              assigned_to,
              is_new_partner,
              pipeline_stages!inner(code, display_order)
            `)
            .eq("tech_company_id", company.id)
            .not("pipeline_stages.code", "in", "(Lost,Freeze)")

          if (newPartnerFilter === "true") {
            opportunitiesQuery = opportunitiesQuery.eq("is_new_partner", true)
          } else if (newPartnerFilter === "false") {
            opportunitiesQuery = opportunitiesQuery.eq("is_new_partner", false)
          }

          const { data: opportunities, error: opportunitiesError } = await opportunitiesQuery

          if (opportunitiesError) {
            console.error("Error fetching opportunities for company:", company.id, opportunitiesError)
          }

          // Added query for potential partners opportunities
          const { data: potentialPartnerOpportunities, error: potentialPartnersError } = await supabase
            .from("opportunities")
            .select(`
              id,
              title,
              pipeline_stages!inner(code)
            `)
            .eq("tech_company_id", company.id)
            .eq("is_new_partner", true)
            .not("pipeline_stages.code", "in", "(Won,Lost,Freeze)")

          if (potentialPartnersError) {
            console.error("Error fetching potential partner opportunities for company:", company.id, potentialPartnersError)
          }

          const { data: involvedUsers, error: usersError } = await supabase
            .from("users")
            .select(`
              id,
              first_name,
              last_name,
              email,
              roles!inner(code)
            `)
            .eq("roles.code", "BDD")
            .eq("is_active", true)

          const { data: partnerRelations, error: partnersError } = await supabase
            .from("partner_tech_companies")
            .select(`
              partner_id,
              scaleup_manager_id,
              partners!inner(
                id,
                name,
                code,
                logo_url,
                website,
                is_active,
                main_country_id,
                countries(name)
              )
            `)
            .eq("tech_company_id", company.id)
            .eq("partners.is_active", true)

          const { data: tasks, error: tasksError } = await supabase
            .from("tasks")
            .select("*")
            .eq("tech_company_id", company.id)
            .in("status", ["pending", "in_progress"])

          // Helper para extraer el código del stage de forma segura (maneja array u objeto)
          const getStageCode = (stages: any) => {
            if (Array.isArray(stages)) return stages[0]?.code
            return stages?.code
          }

          // Calculate funnel data
          const funnelData = (opportunities || []).reduce(
            (acc, opp) => {
              const stage = getStageCode(opp.pipeline_stages)
              if (stage) {
                if (!acc[stage]) {
                  acc[stage] = { count: 0, value: 0 }
                }
                acc[stage].count += 1
                acc[stage].value += Number.parseFloat(opp.estimated_value || "0")
              }
              return acc
            },
            {} as Record<string, { count: number; value: number }>,
          )

          const oneWeekAgo = new Date()
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

          // Metrics for "Lo Bueno"
          const goodMetrics = {
            newOpportunities: opportunities?.filter((opp) => new Date(opp.created_at) >= oneWeekAgo).length || 0,
            wonOpportunities:
              opportunities?.filter((opp: any) => {
                return getStageCode(opp.pipeline_stages) === "Won" && new Date(opp.updated_at) >= oneWeekAgo
              }).length || 0,
            movedOpportunities:
              opportunities?.filter((opp: any) => {
                const stage = getStageCode(opp.pipeline_stages)
                return new Date(opp.updated_at) >= oneWeekAgo && stage !== "Won" && stage !== "Lost"
              }).length || 0,
          }

          const thirtyDaysAgo = new Date()
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

          // Metrics for "Lo Malo"
          const badMetrics = {
            stagnantOpportunities:
              opportunities?.filter((opp: any) => {
                const stage = getStageCode(opp.pipeline_stages)
                return new Date(opp.updated_at) < thirtyDaysAgo && stage !== "Won" && stage !== "Lost"
              }).length || 0,
            oldOpportunities:
              opportunities?.filter((opp: any) => {
                const stage = getStageCode(opp.pipeline_stages)
                return new Date(opp.created_at) < thirtyDaysAgo && stage !== "Won" && stage !== "Lost"
              }).length || 0,
            opportunitiesWithoutValue:
              opportunities?.filter((opp: any) => {
                const stage = getStageCode(opp.pipeline_stages)
                return !opp.estimated_value && stage !== "Won" && stage !== "Lost"
              }).length || 0,
            opportunitiesWithoutCloseDate:
              opportunities?.filter((opp: any) => {
                const stage = getStageCode(opp.pipeline_stages)
                return !opp.estimated_close_date && stage !== "Won" && stage !== "Lost"
              }).length || 0,
            lostOpportunities:
              opportunities?.filter((opp: any) => {
                return getStageCode(opp.pipeline_stages) === "Lost" && new Date(opp.updated_at) >= oneWeekAgo
              }).length || 0,
          }

          const involvedUsersWithMetrics = await Promise.all(
            (involvedUsers || []).map(async (user) => {
              let userOpportunitiesQuery = supabase
                .from("opportunities")
                .select("id, pipeline_stages!inner(code)")
                .eq("tech_company_id", company.id)
                .eq("assigned_to", user.id)
                .not("pipeline_stages.code", "in", "(Lost,Freeze)")

              if (newPartnerFilter === "true") userOpportunitiesQuery = userOpportunitiesQuery.eq("is_new_partner", true)
              else if (newPartnerFilter === "false") userOpportunitiesQuery = userOpportunitiesQuery.eq("is_new_partner", false)

              const { data: userOpportunities } = await userOpportunitiesQuery
              const { data: userTasks } = await supabase.from("tasks").select("id").eq("tech_company_id", company.id).eq("assigned_to", user.id).in("status", ["pending", "in_progress"])
              const { data: userPartnerRelations } = await supabase.from("partner_tech_companies").select("partner_id").eq("tech_company_id", company.id).eq("scaleup_manager_id", user.id)

              return {
                ...user,
                opportunityCount: userOpportunities?.length || 0,
                taskCount: userTasks?.length || 0,
                partnerCount: userPartnerRelations?.length || 0,
              }
            }),
          )

          const partnersWithActivity = await Promise.all(
            (partnerRelations || []).map(async (relation) => {
              const partner: any = relation.partners
              let partnerOpportunitiesQuery = supabase
                .from("opportunities")
                .select("id, updated_at, pipeline_stages!inner(code)")
                .eq("tech_company_id", company.id)
                .eq("partner_id", partner.id)
                .not("pipeline_stages.code", "in", "(Lost,Freeze)")

              if (newPartnerFilter === "true") partnerOpportunitiesQuery = partnerOpportunitiesQuery.eq("is_new_partner", true)
              else if (newPartnerFilter === "false") partnerOpportunitiesQuery = partnerOpportunitiesQuery.eq("is_new_partner", false)

              const { data: partnerOpportunities } = await partnerOpportunitiesQuery
              const { data: partnerTasks } = await supabase.from("tasks").select("id, updated_at").eq("tech_company_id", company.id).eq("partner_id", partner.id).in("status", ["pending", "in_progress"])

              const allActivities = [
                ...(partnerOpportunities || []).map((opp) => opp.updated_at),
                ...(partnerTasks || []).map((task) => task.updated_at),
              ]
              const lastActivity = allActivities.length > 0 ? allActivities.sort().reverse()[0] : null

              return {
                id: partner.id,
                name: partner.name,
                code: partner.code,
                logo_url: partner.logo_url,
                website: partner.website,
                country: partner.countries?.name || "Sin país",
                opportunityCount: partnerOpportunities?.length || 0,
                taskCount: partnerTasks?.length || 0,
                lastActivity,
                manager: relation.scaleup_manager_id ? involvedUsers?.find((u) => u.id === relation.scaleup_manager_id) : null,
              }
            }),
          )

          partnersWithActivity.sort((a, b) => (b.opportunityCount || 0) - (a.opportunityCount || 0))

          const potentialPartnersMetrics = {
            lead: potentialPartnerOpportunities?.filter((opp: any) => {
              const code = getStageCode(opp.pipeline_stages)
              return code === "Pre-Lead" || code === "Lead"
            }).length || 0,
            initialCommunication: potentialPartnerOpportunities?.filter((opp: any) => getStageCode(opp.pipeline_stages) === "Initial Communication").length || 0,
            engagement: potentialPartnerOpportunities?.filter((opp: any) => getStageCode(opp.pipeline_stages) === "Engagement").length || 0,
            quotation: potentialPartnerOpportunities?.filter((opp: any) => getStageCode(opp.pipeline_stages) === "Quotation").length || 0,
          }

          return {
            company,
            funnel: funnelData || {},
            totalOpportunities: opportunities?.length || 0,
            totalValue: opportunities?.reduce((sum, opp) => sum + Number.parseFloat(opp.estimated_value || "0"), 0) || 0,
            involvedUsers: involvedUsersWithMetrics || [],
            partners: partnersWithActivity || [],
            partnerCount: partnersWithActivity?.length || 0,
            taskCount: tasks?.length || 0,
            goodMetrics,
            badMetrics,
            potentialPartnersMetrics,
          }
        } catch (companyError) {
          console.error("Error processing company:", company.id, companyError)
          return null
        }
      }),
    )

    return NextResponse.json({
      success: true,
      companies: dashboardData.filter(Boolean),
    })
  } catch (error) {
    console.error("Error in tech companies dashboard API:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}