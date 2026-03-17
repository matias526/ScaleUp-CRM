import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const searchParams = request.nextUrl.searchParams
    const meetingId = searchParams.get("meetingId")
    const newPartnerFilter = searchParams.get("newPartnerFilter") || "all"

    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, first_name, last_name, email, role_id, profile_image, roles!inner(code)")
      .eq("roles.code", "BDD")
      .eq("is_active", true)

    if (usersError) {
      console.error("[v0] Error fetching users:", usersError)
      return NextResponse.json({ success: false, error: usersError.message }, { status: 500 })
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ success: true, data: [] })
    }

    let previousMeetingId = null
    if (meetingId) {
      const { data: currentMeeting } = await supabase
        .from("internal_weekly_meetings")
        .select("previous_meeting_id")
        .eq("id", meetingId)
        .single()

      previousMeetingId = currentMeeting?.previous_meeting_id
    }

    const { data: pipelineStages } = await supabase.from("pipeline_stages").select("*").order("display_order")

    const userData = await Promise.all(
      users.map(async (user) => {
        let opportunitiesQuery = supabase
          .from("opportunities")
          .select(
            `
            id,
            estimated_value,
            estimated_close_date,
            pipeline_stage_id,
            created_at,
            updated_at,
            is_new_partner,
            pipeline_stages!inner(code, display_order)
          `,
          )
          .eq("assigned_to", user.id)
          .neq("pipeline_stages.code", "Lost")
          .neq("pipeline_stages.code", "Freeze")

        if (newPartnerFilter === "true") {
          opportunitiesQuery = opportunitiesQuery.eq("is_new_partner", true)
        } else if (newPartnerFilter === "false") {
          opportunitiesQuery = opportunitiesQuery.eq("is_new_partner", false)
        }

        const { data: opportunities } = await opportunitiesQuery

        const funnel: Record<string, { count: number; value: number }> = {}
        const totalOpportunities = opportunities?.length || 0
        let totalValue = 0

        pipelineStages?.forEach((stage) => {
          funnel[stage.code] = { count: 0, value: 0 }
        })

        opportunities?.forEach((opp: any) => {
          const stageCode = opp.pipeline_stages?.code
          if (stageCode && funnel[stageCode]) {
            funnel[stageCode].count++
            funnel[stageCode].value += opp.estimated_value || 0
          }
          totalValue += opp.estimated_value || 0
        })

        const now = new Date()
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

        const opportunitiesWithRecentActivity =
          opportunities?.filter((opp: any) => new Date(opp.updated_at) >= sevenDaysAgo).length || 0

        const opportunitiesWithoutCloseDate = opportunities?.filter((opp: any) => !opp.estimated_close_date).length || 0

        const opportunitiesWithoutValue = opportunities?.filter((opp: any) => !opp.estimated_value).length || 0

        const opportunitiesStagnant =
          opportunities?.filter((opp: any) => new Date(opp.updated_at) < thirtyDaysAgo).length || 0

        const opportunitiesOld =
          opportunities?.filter(
            (opp: any) => new Date(opp.created_at) < thirtyDaysAgo && opp.pipeline_stages?.code !== "Won",
          ).length || 0

        const opportunitiesWithCompleteData =
          opportunities?.filter((opp: any) => opp.estimated_value && opp.estimated_close_date).length || 0

        const { data: partnerRelations } = await supabase
          .from("partner_tech_companies")
          .select(
            `
            partner_id,
            tech_company_id,
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
            ),
            tech_companies!inner(
              id,
              name
            )
          `,
          )
          .eq("scaleup_manager_id", user.id)
          .eq("partners.is_active", true)

        const partnersWithActivity = await Promise.all(
          (partnerRelations || []).map(async (relation: any) => {
            const partner = relation.partners
            const techCompany = relation.tech_companies

            console.log("[v0] Querying opportunities for partner:", {
              partnerId: partner.id,
              partnerName: partner.name,
              techCompanyId: relation.tech_company_id,
              techCompanyName: techCompany.name,
              userId: user.id,
              newPartnerFilter,
            })

            let partnerOpportunitiesQuery = supabase
              .from("opportunities")
              .select(
                `
                id, 
                updated_at,
                is_new_partner,
                pipeline_stages!inner(code)
              `,
              )
              .eq("partner_id", partner.id)
              .eq("tech_company_id", relation.tech_company_id)
              .neq("pipeline_stages.code", "Lost")
              .neq("pipeline_stages.code", "Freeze")

            if (newPartnerFilter === "true") {
              partnerOpportunitiesQuery = partnerOpportunitiesQuery.eq("is_new_partner", true)
            } else if (newPartnerFilter === "false") {
              partnerOpportunitiesQuery = partnerOpportunitiesQuery.eq("is_new_partner", false)
            }

            const { data: partnerOpportunities, error: partnerOppsError } = await partnerOpportunitiesQuery

            console.log("[v0] Partner opportunities result:", {
              partnerName: partner.name,
              count: partnerOpportunities?.length || 0,
              error: partnerOppsError,
              sampleOpportunity: partnerOpportunities?.[0],
            })

            const { data: partnerTasks } = await supabase
              .from("tasks")
              .select("id, updated_at")
              .eq("partner_id", partner.id)
              .eq("tech_company_id", relation.tech_company_id)
              .in("status", ["pending", "in_progress"])

            const allActivities = [
              ...(partnerOpportunities || []).map((opp: any) => opp.updated_at),
              ...(partnerTasks || []).map((task: any) => task.updated_at),
            ]
            const lastActivity = allActivities.length > 0 ? allActivities.sort().reverse()[0] : null

            const hasRecentActivity = lastActivity ? new Date(lastActivity) >= thirtyDaysAgo : false

            return {
              id: partner.id,
              name: partner.name,
              country: partner.countries?.name || "Sin país",
              techCompanyId: techCompany.id,
              techCompanyName: techCompany.name,
              opportunityCount: partnerOpportunities?.length || 0,
              taskCount: partnerTasks?.length || 0,
              lastActivity,
              hasRecentActivity,
            }
          }),
        )

        partnersWithActivity.sort((a, b) => {
          if (a.techCompanyName !== b.techCompanyName) {
            return a.techCompanyName.localeCompare(b.techCompanyName)
          }
          return (b.opportunityCount || 0) - (a.opportunityCount || 0)
        })

        const activePartners = partnersWithActivity.filter((p) => p.hasRecentActivity).length
        const inactivePartners = partnersWithActivity.filter((p) => !p.hasRecentActivity).length

        let previousWeekCommitments: any[] = []
        if (previousMeetingId) {
          const { data: commitments } = await supabase
            .from("tasks")
            .select(
              `
              id,
              title,
              description,
              due_date,
              commitment_status,
              comments,
              tech_company_id,
              tech_companies(name)
            `,
            )
            .eq("assigned_to", user.id)
            .eq("is_commitment", true)
            .eq("meeting_id", previousMeetingId)

          previousWeekCommitments =
            commitments?.map((c: any) => ({
              id: c.id,
              title: c.title,
              description: c.description,
              due_date: c.due_date,
              commitment_status: c.commitment_status,
              comments: c.comments,
              tech_company_id: c.tech_company_id,
              tech_company_name: c.tech_companies?.name || null,
            })) || []
        }

        let currentWeekCommitments: any[] = []
        if (meetingId) {
          const { data: commitments } = await supabase
            .from("tasks")
            .select(
              `
              id,
              title,
              description,
              due_date,
              tech_company_id,
              tech_companies(name)
            `,
            )
            .eq("assigned_to", user.id)
            .eq("is_commitment", true)
            .eq("meeting_id", meetingId)

          currentWeekCommitments =
            commitments?.map((c: any) => ({
              id: c.id,
              title: c.title,
              description: c.description,
              due_date: c.due_date,
              tech_company_id: c.tech_company_id,
              tech_company_name: c.tech_companies?.name || null,
            })) || []
        }

        const wonOpportunities = opportunities?.filter((o: any) => o.pipeline_stages?.code === "Won").length || 0
        const conversionRate = totalOpportunities > 0 ? (wonOpportunities / totalOpportunities) * 100 : 0

        const recentActivity: any[] = []

        return {
          user: {
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            profile_image: user.profile_image,
          },
          funnel,
          totalOpportunities,
          totalValue,
          partners: partnersWithActivity,
          previousWeekCommitments,
          currentWeekCommitments, // Added currentWeekCommitments to response
          conversionRate,
          recentActivity,
          kpis: {
            opportunitiesWithRecentActivity,
            opportunitiesWithoutCloseDate,
            opportunitiesWithoutValue,
            opportunitiesStagnant,
            opportunitiesOld,
            opportunitiesWithCompleteData,
            activePartners,
            inactivePartners,
            completedCommitments:
              previousWeekCommitments.filter((c) => c.commitment_status === "completed").length || 0,
            notCompletedCommitments:
              previousWeekCommitments.filter((c) => c.commitment_status === "not_completed").length || 0,
            totalPreviousCommitments: previousWeekCommitments.length || 0,
          },
        }
      }),
    )

    return NextResponse.json({ success: true, data: userData })
  } catch (error) {
    console.error("[v0] Error in user-status API:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
