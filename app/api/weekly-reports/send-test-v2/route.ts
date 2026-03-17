import { type NextRequest, NextResponse } from "next/server"
import { WeeklyReportServiceV2 } from "@/lib/services/weekly-report-service-v2"

export async function POST(request: NextRequest) {
  try {
    console.log("[API] === INICIO send-test-v2 ===")

    const { tech_company_id } = await request.json()

    if (!tech_company_id) {
      return NextResponse.json({
        success: false,
        error: "tech_company_id is required",
      })
    }

    console.log(`[API] Enviando reporte para tech company: ${tech_company_id}`)

    const result = await WeeklyReportServiceV2.sendWeeklyReport(tech_company_id)

    console.log(`[API] Resultado:`, result)
    console.log("[API] === FIN send-test-v2 ===")

    return NextResponse.json(result)
  } catch (error) {
    console.error("[API] Error en send-test-v2:", error)
    return NextResponse.json({
      success: false,
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
