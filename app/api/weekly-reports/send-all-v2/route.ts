import { type NextRequest, NextResponse } from "next/server"
import { WeeklyReportServiceV2 } from "@/lib/services/weekly-report-service-v2"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    console.log("[API] === INICIO send-all-v2 ===")

    const supabase = createClient()

    // Obtener todas las tech companies que tienen destinatarios configurados
    const { data: techCompanies, error } = await supabase
      .from("weekly_report_recipients")
      .select(`
        tech_company_id,
        tech_companies!inner(id, name)
      `)
      .eq("is_active", true)

    if (error) {
      console.error("[API] Error getting tech companies:", error)
      return NextResponse.json({
        success: false,
        error: "Error getting tech companies",
      })
    }

    // Obtener IDs únicos de tech companies
    const uniqueTechCompanyIds = [...new Set(techCompanies?.map((tc) => tc.tech_company_id) || [])]

    console.log(`[API] Found ${uniqueTechCompanyIds.length} tech companies with recipients`)

    const results = []
    let totalSent = 0

    // Enviar reporte a cada tech company
    for (const techCompanyId of uniqueTechCompanyIds) {
      try {
        console.log(`[API] Enviando reporte para tech company: ${techCompanyId}`)

        const result = await WeeklyReportServiceV2.sendWeeklyReport(techCompanyId)

        if (result.success) {
          const successCount = result.results?.filter((r: any) => r.success).length || 0
          totalSent += successCount

          results.push({
            techCompanyId,
            success: true,
            emailsSent: successCount,
            totalOpportunities: result.totalOpportunities || 0,
          })
        } else {
          results.push({
            techCompanyId,
            success: false,
            error: result.error,
          })
        }

        // Pausa entre tech companies
        await new Promise((resolve) => setTimeout(resolve, 2000))
      } catch (error) {
        console.error(`[API] Error enviando reporte para ${techCompanyId}:`, error)
        results.push({
          techCompanyId,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    console.log(`[API] Completado: ${totalSent} emails enviados en total`)
    console.log("[API] === FIN send-all-v2 ===")

    return NextResponse.json({
      success: totalSent > 0,
      totalSent,
      results,
    })
  } catch (error) {
    console.error("[API] Error en send-all-v2:", error)
    return NextResponse.json({
      success: false,
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
