import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    })

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
            console.error(
              "Error fetching potential partner opportunities for company:",
              company.id,
              potentialPartnersError,
            )
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

          if (usersError) {
            console.error("Error fetching involved users for company:", company.id, usersError)
            // Continue with empty users array
          }

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

          if (partnersError) {
            console.error("Error fetching partner relations for company:", company.id, partnersError)
            // Continue with empty partners array
          }

          const { data: tasks, error: tasksError } = await supabase
            .from("tasks")
            .select("*")
            .eq("tech_company_id", company.id)
            .in("status", ["pending", "in_progress"])

          if (tasksError) {
            console.error("Error fetching tasks for company:", company.id, tasksError)
            // Continue with empty tasks array
          }

          // Calculate funnel data
          const funnelData = opportunities?.reduce(
            (acc, opp) => {
              const stage = opp.pipeline_stages.code
              if (!acc[stage]) {
                acc[stage] = { count: 0, value: 0 }
              }
              acc[stage].count += 1
              acc[stage].value += Number.parseFloat(opp.estimated_value || "0")
              return acc
            },
            {} as Record<string, { count: number; value: number }>,
          )

          // Calculate metrics for "Lo Bueno" (Good things)
          const oneWeekAgo = new Date()
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

          const goodMetrics = {
            newOpportunities: opportunities?.filter((opp) => new Date(opp.created_at) >= oneWeekAgo).length || 0,
            wonOpportunities:
              opportunities?.filter(
                (opp) => opp.pipeline_stages.code === "Won" && new Date(opp.updated_at) >= oneWeekAgo,
              ).length || 0,
            movedOpportunities:
              opportunities?.filter(
                (opp) =>
                  new Date(opp.updated_at) >= oneWeekAgo &&
                  opp.pipeline_stages.code !== "Won" &&
                  opp.pipeline_stages.code !== "Lost",
              ).length || 0,
          }

          // Calculate metrics for "Lo Malo" (Bad things)
          const thirtyDaysAgo = new Date()
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

          const badMetrics = {
            stagnantOpportunities:
              opportunities?.filter(
                (opp) =>
                  new Date(opp.updated_at) < thirtyDaysAgo &&
                  opp.pipeline_stages.code !== "Won" &&
                  opp.pipeline_stages.code !== "Lost",
              ).length || 0,
            oldOpportunities:
              opportunities?.filter(
                (opp) =>
                  new Date(opp.created_at) < thirtyDaysAgo &&
                  opp.pipeline_stages.code !== "Won" &&
                  opp.pipeline_stages.code !== "Lost",
              ).length || 0,
            opportunitiesWithoutValue:
              opportunities?.filter(
                (opp) =>
                  !opp.estimated_value && opp.pipeline_stages.code !== "Won" && opp.pipeline_stages.code !== "Lost",
              ).length || 0,
            opportunitiesWithoutCloseDate:
              opportunities?.filter(
                (opp) =>
                  !opp.estimated_close_date &&
                  opp.pipeline_stages.code !== "Won" &&
                  opp.pipeline_stages.code !== "Lost",
              ).length || 0,
            lostOpportunities:
              opportunities?.filter(
                (opp) => opp.pipeline_stages.code === "Lost" && new Date(opp.updated_at) >= oneWeekAgo,
              ).length || 0,
          }

          const involvedUsersWithMetrics = await Promise.all(
            (involvedUsers || []).map(async (user) => {
              let userOpportunitiesQuery = supabase
                .from("opportunities")
                .select(`
                  id, 
                  pipeline_stages!inner(code)
                `)
                .eq("tech_company_id", company.id)
                .eq("assigned_to", user.id)
                .not("pipeline_stages.code", "in", "(Lost,Freeze)")

              if (newPartnerFilter === "true") {
                userOpportunitiesQuery = userOpportunitiesQuery.eq("is_new_partner", true)
              } else if (newPartnerFilter === "false") {
                userOpportunitiesQuery = userOpportunitiesQuery.eq("is_new_partner", false)
              }

              const { data: userOpportunities } = await userOpportunitiesQuery

              const { data: userTasks } = await supabase
                .from("tasks")
                .select("id")
                .eq("tech_company_id", company.id)
                .eq("assigned_to", user.id)
                .in("status", ["pending", "in_progress"])

              // Count unique partners from partner_tech_companies where this user is the scaleup_manager
              const { data: userPartnerRelations } = await supabase
                .from("partner_tech_companies")
                .select("partner_id")
                .eq("tech_company_id", company.id)
                .eq("scaleup_manager_id", user.id)

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
              const partner = relation.partners

              let partnerOpportunitiesQuery = supabase
                .from("opportunities")
                .select(`
                  id, 
                  updated_at,
                  pipeline_stages!inner(code)
                `)
                .eq("tech_company_id", company.id)
                .eq("partner_id", partner.id)
                .not("pipeline_stages.code", "in", "(Lost,Freeze)")

              if (newPartnerFilter === "true") {
                partnerOpportunitiesQuery = partnerOpportunitiesQuery.eq("is_new_partner", true)
              } else if (newPartnerFilter === "false") {
                partnerOpportunitiesQuery = partnerOpportunitiesQuery.eq("is_new_partner", false)
              }

              const { data: partnerOpportunities } = await partnerOpportunitiesQuery

              const { data: partnerTasks } = await supabase
                .from("tasks")
                .select("id, updated_at")
                .eq("tech_company_id", company.id)
                .eq("partner_id", partner.id)
                .in("status", ["pending", "in_progress"])

              // Find last activity date
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
                manager: relation.scaleup_manager_id
                  ? involvedUsers?.find((u) => u.id === relation.scaleup_manager_id)
                  : null,
              }
            }),
          )

          partnersWithActivity.sort((a, b) => (b.opportunityCount || 0) - (a.opportunityCount || 0))

          // Added potential partners metrics calculation
          const potentialPartnersMetrics = {
            lead:
              potentialPartnerOpportunities?.filter(
                (opp) => opp.pipeline_stages.code === "Pre-Lead" || opp.pipeline_stages.code === "Lead",
              ).length || 0,
            initialCommunication:
              potentialPartnerOpportunities?.filter((opp) => opp.pipeline_stages.code === "Initial Communication")
                .length || 0,
            engagement:
              potentialPartnerOpportunities?.filter((opp) => opp.pipeline_stages.code === "Engagement").length || 0,
            quotation:
              potentialPartnerOpportunities?.filter((opp) => opp.pipeline_stages.code === "Quotation").length || 0,
          }

          return {
            company,
            funnel: funnelData || {},
            totalOpportunities: opportunities?.length || 0,
            totalValue:
              opportunities?.reduce((sum, opp) => sum + Number.parseFloat(opp.estimated_value || "0"), 0) || 0,
            involvedUsers: involvedUsersWithMetrics || [],
            partners: partnersWithActivity || [],
            partnerCount: partnersWithActivity?.length || 0,
            taskCount: tasks?.length || 0,
            goodMetrics,
            badMetrics,
            // Added potential partners metrics to return data
            potentialPartnersMetrics,
          }
        } catch (companyError) {
          console.error("Error processing company:", company.id, companyError)
          return {
            company,
            funnel: {},
            totalOpportunities: 0,
            totalValue: 0,
            involvedUsers: [],
            partners: [],
            partnerCount: 0,
            taskCount: 0,
            goodMetrics: {
              newOpportunities: 0,
              wonOpportunities: 0,
              movedOpportunities: 0,
            },
            badMetrics: {
              stagnantOpportunities: 0,
              oldOpportunities: 0,
              opportunitiesWithoutValue: 0,
              opportunitiesWithoutCloseDate: 0,
              lostOpportunities: 0,
            },
            potentialPartnersMetrics: {
              lead: 0,
              initialCommunication: 0,
              engagement: 0,
              quotation: 0,
            },
          }
        }
      }),
    )

    return NextResponse.json({
      success: true,
      data: dashboardData,
    })
  } catch (error) {
    console.error("Error in tech companies dashboard API:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
