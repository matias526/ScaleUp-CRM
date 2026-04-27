import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // Declaramos que es una Promesa
) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient()

    const resolvedParams = await params;
    const techCompanyId = resolvedParams.id;
    const { searchParams } = new URL(request.url)
    const stagesParam = searchParams.get("stages")
    const stages = stagesParam ? stagesParam.split(",") : []

    console.log("[v0] Tech Company ID:", techCompanyId)
    console.log("[v0] Stages requested:", stages)

    const stagesToUse =
      stages.length > 0 ? stages : ["Pre-Lead", "Lead", "Initial Communication", "Engagement", "Quotation"]

    const { data: opportunities, error } = await supabase
      .from("opportunities")
      .select(
        `
        id,
        title,
        created_at,
        updated_at,
        country,
        pipeline_stages!inner (
          code
        )
      `,
      )
      .eq("tech_company_id", techCompanyId)
      .eq("is_new_partner", true)
      .in("pipeline_stages.code", stagesToUse)
      .order("created_at", { ascending: false })

    console.log("[v0] Query completed")
    console.log("[v0] Error:", error)
    console.log("[v0] Opportunities found:", opportunities?.length || 0)

    if (error) {
      console.error("[v0] Supabase error:", error)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch opportunities",
          supabaseError: error,
        },
        { status: 500 },
      )
    }

    const now = new Date()
    const opportunitiesWithDays = (opportunities || []).map((opp: any) => {
      const createdDate = new Date(opp.created_at)
      const updatedDate = new Date(opp.updated_at)
      const daysSinceCreation = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
      const daysSinceLastUpdate = Math.floor((now.getTime() - updatedDate.getTime()) / (1000 * 60 * 60 * 24))

      return {
        id: opp.id,
        title: opp.title,
        daysSinceCreation,
        daysSinceLastUpdate,
        stageCode: opp.pipeline_stages.code,
        country: opp.country,
        isNewPartner: true,
      }
    })

    const sqlQuery = `
SELECT 
  opportunities.id,
  opportunities.title,
  opportunities.created_at,
  opportunities.updated_at,
  opportunities.country,
  pipeline_stages.code as stage_code
FROM opportunities
INNER JOIN pipeline_stages ON opportunities.pipeline_stage_id = pipeline_stages.id
WHERE opportunities.tech_company_id = '${techCompanyId}'
  AND opportunities.is_new_partner = true
  AND pipeline_stages.code IN (${stagesToUse.map((s) => `'${s}'`).join(", ")})
ORDER BY opportunities.created_at DESC
    `.trim()

    console.log("[v0] Returning", opportunitiesWithDays.length, "opportunities")

    return NextResponse.json({
      success: true,
      data: opportunitiesWithDays,
      debug: {
        techCompanyId,
        stagesRequested: stages,
        stagesUsed: stagesToUse,
        sqlQuery,
        opportunitiesCount: opportunitiesWithDays.length,
      },
    })
  } catch (error) {
    console.error("[v0] Error in potential partners API:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        errorMessage: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
