import { NextResponse } from "next/server"
//import { createClient } from "@/lib/supabase/server"
import { createServerClient } from "@/lib/supabase/server"
import { WeeklyReportService } from "@/lib/services/weekly-report-service"

export async function POST(request: Request) {
  try {
    console.log("[API] === INICIO ENVÍO REPORTE DE PRUEBA ===")

    const supabase = createServerClient()

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("[API] Error de autenticación:", authError)
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 })
    }

    console.log("[API] Usuario autenticado:", user.id)

    const body = await request.json()
    console.log("[API] Body recibido:", body)

    const { tech_company_id } = body

    if (!tech_company_id) {
      console.error("[API] tech_company_id faltante")
      return NextResponse.json(
        {
          success: false,
          error: "tech_company_id es requerido",
        },
        { status: 400 },
      )
    }

    console.log(`[API] Enviando reporte de prueba para tech company: ${tech_company_id}`)

    // Verificar configuración de email
    if (!process.env.RESEND_API_KEY) {
      console.error("[API] RESEND_API_KEY no está configurada")
      return NextResponse.json(
        {
          success: false,
          error: "RESEND_API_KEY no está configurada",
        },
        { status: 500 },
      )
    }

    console.log("[API] RESEND_API_KEY configurada correctamente")

    // Enviar reporte de prueba
    console.log("[API] Llamando a WeeklyReportService.sendWeeklyReport...")
    const result = await WeeklyReportService.sendWeeklyReport(tech_company_id)

    console.log("[API] Resultado completo del servicio:", JSON.stringify(result, null, 2))

    return NextResponse.json({
      success: result.success,
      results: result.results || [],
      message: result.success
        ? `Reporte enviado a ${(result.results || []).filter((r) => r.success).length} destinatarios`
        : result.error || "Error al enviar el reporte",
      error: result.success ? undefined : result.error || "Error desconocido",
    })
  } catch (error) {
    console.error("[API] Error inesperado al enviar reporte de prueba:", error)
    console.error("[API] Stack trace:", error instanceof Error ? error.stack : "No stack available")

    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
