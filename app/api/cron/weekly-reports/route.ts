import { type NextRequest, NextResponse } from "next/server"
import { WeeklyReportServiceV8 } from "@/lib/services/weekly-report-service-v8.tsx"

// Esta función se ejecutará automáticamente todos los lunes a las 06:00 AM UTC (3:00 AM Argentina)
export async function GET(request: NextRequest) {
  try {
    // Obtener todos los headers para debugging
    const headers = Object.fromEntries(request.headers.entries())
    console.log("[WeeklyCron] Headers recibidos:", JSON.stringify(headers, null, 2))

    const isVercelExecution = headers["x-vercel-id"] || headers["x-vercel-deployment-url"] || headers["x-vercel-cron"]
    const manualToken = request.nextUrl.searchParams.get("token")

    // IMPORTANTE: Para ejecuciones manuales desde Vercel, permitimos cualquier solicitud que venga de Vercel
    // o que tenga el token manual
    if (!isVercelExecution && manualToken !== "manual-execution-2024") {
      console.log("[WeeklyCron] Solicitud no autorizada - no proviene de Vercel ni tiene token válido")
      return NextResponse.json(
        {
          error: "Unauthorized - Not from Vercel or missing valid token",
          hint: "Para ejecución manual externa, agrega ?token=manual-execution-2024 a la URL",
        },
        { status: 401 },
      )
    }

    // Log del tipo de ejecución
    if (isVercelExecution) {
      console.log("[WeeklyCron] ✅ Ejecución desde Vercel")
    } else {
      console.log("[WeeklyCron] 🧪 Ejecución manual con token")
    }

    console.log("[WeeklyCron] ✅ Iniciando envío de reportes semanales programado")
    console.log(`[WeeklyCron] Fecha y hora de ejecución: ${new Date().toISOString()}`)
    console.log(`[WeeklyCron] Timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`)

    // Ejecutar el envío de reportes semanales
    const result = await WeeklyReportServiceV8.sendAllWeeklyReports()

    // Registrar resultados detallados
    const successCount = result.results?.filter((r) => r.success).length || 0
    const totalCount = result.results?.length || 0

    console.log(
      `[WeeklyCron] ✅ Proceso completado: ${successCount}/${totalCount} reportes enviados exitosamente`,
    )

    // Log de resultados individuales
    result.results?.forEach((r) => {
      if (r.success) {
        console.log(`[WeeklyCron] ✅ Reporte enviado para tech company ${r.techCompanyId}`)
      } else {
        console.log(`[WeeklyCron] ❌ Error enviando para tech company ${r.techCompanyId}: ${r.error}`)
      }
    })

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      summary: result.summary,
      results: result.results,
    })
  } catch (error) {
    console.error("[WeeklyCron] ❌ Error crítico en el cron job de reportes semanales:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
        timestamp: new Date().toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      { status: 500 },
    )
  }
}

// También permitir POST para pruebas manuales
export async function POST(request: NextRequest) {
  try {
    // Obtener todos los headers para debugging
    const headers = Object.fromEntries(request.headers.entries())
    console.log("[WeeklyCron] Headers recibidos en POST:", JSON.stringify(headers, null, 2))

    const isVercelExecution = headers["x-vercel-id"] || headers["x-vercel-deployment-url"] || headers["x-vercel-cron"]

    // Para POST, permitimos cualquier solicitud que venga de Vercel
    if (!isVercelExecution) {
      console.log("[WeeklyCron] Solicitud POST no autorizada - no proviene de Vercel")
      return NextResponse.json(
        {
          error: "Unauthorized - Not from Vercel",
          hint: "Este endpoint solo acepta solicitudes POST desde Vercel",
        },
        { status: 401 },
      )
    }

    console.log("[WeeklyCron] 🧪 Ejecución manual del cron job (POST)")

    const result = await WeeklyReportServiceV8.sendAllWeeklyReports()
    const successCount = result.results?.filter((r) => r.success).length || 0
    const totalCount = result.results?.length || 0

    console.log(`[WeeklyCron] 🧪 Prueba manual completada: ${successCount}/${totalCount} reportes enviados`)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      manual: true,
      summary: result.summary,
      results: result.results,
    })
  } catch (error) {
    console.error("[WeeklyCron] ❌ Error en ejecución manual:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
        timestamp: new Date().toISOString(),
        manual: true,
      },
      { status: 500 },
    )
  }
}
