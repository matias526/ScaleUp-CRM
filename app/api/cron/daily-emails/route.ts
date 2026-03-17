import { type NextRequest, NextResponse } from "next/server"
import { DailyEmailService } from "@/lib/services/daily-email-service"

// Esta función se ejecutará automáticamente todos los días a las 05:00 AM UTC (2:00 AM Argentina)
export async function GET(request: NextRequest) {
  try {
    // Obtener todos los headers para debugging
    const headers = Object.fromEntries(request.headers.entries())
    console.log("[CronJob] Headers recibidos:", JSON.stringify(headers, null, 2))

    const isVercelExecution = headers["x-vercel-id"] || headers["x-vercel-deployment-url"] || headers["x-vercel-cron"]
    const manualToken = request.nextUrl.searchParams.get("token")

    // IMPORTANTE: Para ejecuciones manuales desde Vercel, permitimos cualquier solicitud que venga de Vercel
    // o que tenga el token manual
    if (!isVercelExecution && manualToken !== "manual-execution-2024") {
      console.log("[CronJob] Solicitud no autorizada - no proviene de Vercel ni tiene token válido")
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
      console.log("[CronJob] ✅ Ejecución desde Vercel")
    } else {
      console.log("[CronJob] 🧪 Ejecución manual con token")
    }

    console.log("[CronJob] ✅ Iniciando envío de emails diarios programado")
    console.log(`[CronJob] Fecha y hora de ejecución: ${new Date().toISOString()}`)
    console.log(`[CronJob] Timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`)

    // Ejecutar el envío de emails
    const result = await DailyEmailService.sendDailyEmailsToAllUsers()

    // Registrar resultados detallados
    const successCount = result.results.filter((r) => r.success).length
    const totalCount = result.results.length

    console.log(`[CronJob] ✅ Proceso completado: ${successCount}/${totalCount} emails enviados exitosamente`)

    // Log de resultados individuales
    result.results.forEach((r) => {
      if (r.success) {
        console.log(`[CronJob] ✅ Email enviado a ${r.email}`)
      } else {
        console.log(`[CronJob] ❌ Error enviando a ${r.email}: ${r.message}`)
      }
    })

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      summary: {
        total: totalCount,
        successful: successCount,
        failed: totalCount - successCount,
      },
      results: result.results,
    })
  } catch (error) {
    console.error("[CronJob] ❌ Error crítico en el cron job de emails diarios:", error)
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
    console.log("[CronJob] Headers recibidos en POST:", JSON.stringify(headers, null, 2))

    const isVercelExecution = headers["x-vercel-id"] || headers["x-vercel-deployment-url"] || headers["x-vercel-cron"]

    // Para POST, permitimos cualquier solicitud que venga de Vercel
    if (!isVercelExecution) {
      console.log("[CronJob] Solicitud POST no autorizada - no proviene de Vercel")
      return NextResponse.json(
        {
          error: "Unauthorized - Not from Vercel",
          hint: "Este endpoint solo acepta solicitudes POST desde Vercel",
        },
        { status: 401 },
      )
    }

    console.log("[CronJob] 🧪 Ejecución manual del cron job (POST)")

    const result = await DailyEmailService.sendDailyEmailsToAllUsers()
    const successCount = result.results.filter((r) => r.success).length
    const totalCount = result.results.length

    console.log(`[CronJob] 🧪 Prueba manual completada: ${successCount}/${totalCount} emails enviados`)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      manual: true,
      summary: {
        total: totalCount,
        successful: successCount,
        failed: totalCount - successCount,
      },
      results: result.results,
    })
  } catch (error) {
    console.error("[CronJob] ❌ Error en ejecución manual:", error)
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
