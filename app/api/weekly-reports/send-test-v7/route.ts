import { type NextRequest, NextResponse } from "next/server"
import { WeeklyReportServiceV7 } from "@/lib/services/weekly-report-service-v7"

export async function POST(request: NextRequest) {
  try {
    console.log("[API] /api/weekly-reports/send-test-v7 - Iniciando...")

    const body = await request.json()
    const { techCompanyId } = body

    if (!techCompanyId) {
      return NextResponse.json({ success: false, error: "techCompanyId es requerido" }, { status: 400 })
    }

    console.log(`[API] Enviando reporte de prueba V7 para tech company: ${techCompanyId}`)

    const result = await WeeklyReportServiceV7.sendWeeklyReport(techCompanyId)

    console.log(`[API] Resultado:`, result)

    return NextResponse.json(result)
  } catch (error) {
    console.error("[API] Error en send-test-v7:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
