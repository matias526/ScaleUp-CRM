import { type NextRequest, NextResponse } from "next/server"
import { WeeklyReportServiceV5 } from "@/lib/services/weekly-report-service-v5"

export async function POST(request: NextRequest) {
  try {
    const { tech_company_id } = await request.json()

    if (!tech_company_id) {
      return NextResponse.json({ success: false, error: "tech_company_id is required" }, { status: 400 })
    }

    console.log(`[API] Enviando reporte de prueba V5 para tech company: ${tech_company_id}`)

    const result = await WeeklyReportServiceV5.sendWeeklyReport(tech_company_id)

    return NextResponse.json(result)
  } catch (error) {
    console.error("[API] Error sending test report V5:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
