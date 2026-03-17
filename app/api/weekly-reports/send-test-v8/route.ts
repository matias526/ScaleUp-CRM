import { type NextRequest, NextResponse } from "next/server"
import { WeeklyReportServiceV8 } from "@/lib/services/weekly-report-service-v8"

export async function POST(request: NextRequest) {
  console.log("[WeeklyReportTestV8] === INICIO TEST ===")

  try {
    const body = await request.json()
    const { tech_company_id } = body

    if (!tech_company_id) {
      return NextResponse.json(
        {
          success: false,
          error: "tech_company_id is required",
        },
        { status: 400 },
      )
    }

    console.log(`[WeeklyReportTestV8] Testing for tech company: ${tech_company_id}`)

    const result = await WeeklyReportServiceV8.sendWeeklyReport(tech_company_id)

    console.log(`[WeeklyReportTestV8] Result:`, {
      success: result.success,
      emailsSent: result.results?.length || 0,
      summary: result.summary,
    })

    return NextResponse.json({
      success: result.success,
      results: result.results,
      summary: result.summary,
      error: result.error,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[WeeklyReportTestV8] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
