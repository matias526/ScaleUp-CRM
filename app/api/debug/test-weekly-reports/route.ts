import { type NextRequest, NextResponse } from "next/server"
import { WeeklyReportServiceV8 } from "@/lib/services/weekly-report-service-v8"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    // Verificar que es una solicitud autorizada
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[WeeklyReportsTest] Iniciando test del servicio de weekly reports...")

    const supabase = createServerClient()

    // Ejecutar el servicio con debug
    const result = await WeeklyReportServiceV8.sendAllWeeklyReports(supabase)

    console.log("[WeeklyReportsTest] Resultado:", result)

    return NextResponse.json({
      success: true,
      message: "Test ejecutado",
      result: result,
    })
  } catch (error) {
    console.error("[WeeklyReportsTest] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
