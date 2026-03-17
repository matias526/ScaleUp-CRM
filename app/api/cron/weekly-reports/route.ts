import { type NextRequest, NextResponse } from "next/server"
import { WeeklyReportServiceV8 } from "@/lib/services/weekly-report-service-v8"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: NextRequest) {
  console.log("[WeeklyReportsCron] === INICIO CRON JOB ===")

  try {
    // Verificar token de autorización para cron jobs
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET || "weekly-reports-cron-2024"

    // Verificar autorización (Vercel Cron o token manual)
    const isVercelCron = request.headers.get("user-agent")?.includes("vercel-cron")
    const hasValidToken = authHeader === `Bearer ${cronSecret}`

    if (!isVercelCron && !hasValidToken) {
      console.log("[WeeklyReportsCron] Acceso no autorizado")
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          message: "Este endpoint solo puede ser ejecutado por Vercel Cron o con token válido",
        },
        { status: 401 },
      )
    }

    console.log("[WeeklyReportsCron] Autorización válida, iniciando envío de reportes semanales...")

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("[WeeklyReportsCron] Faltan variables de entorno necesarias")
      return NextResponse.json(
        {
          success: false,
          error: "Missing environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
        },
        { status: 500 },
      )
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    console.log("[WeeklyReportsCron] Cliente de Supabase con service role creado")

    const result = await WeeklyReportServiceV8.sendAllWeeklyReports(supabaseAdmin)

    console.log("[WeeklyReportsCron] Resultado del envío:", {
      success: result.success,
      totalTechCompanies: result.summary?.totalTechCompanies || 0,
      successful: result.summary?.successful || 0,
      failed: result.summary?.failed || 0,
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Weekly reports sent successfully",
        summary: result.summary,
        results: result.results,
        timestamp: new Date().toISOString(),
      })
    } else {
      console.error("[WeeklyReportsCron] Error en el envío:", result.error)
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Unknown error",
          timestamp: new Date().toISOString(),
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("[WeeklyReportsCron] Error inesperado:", error)
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

// Permitir también POST para testing manual
export async function POST(request: NextRequest) {
  return GET(request)
}
