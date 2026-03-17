import { type NextRequest, NextResponse } from "next/server"
import { DailyEmailService } from "@/lib/services/daily-email-service"

export async function POST(request: NextRequest) {
  try {
    console.log("POST /api/send-daily-emails - Iniciando...")

    // Verificar si se especifica un usuario específico
    const body = await request.json().catch(() => ({}))
    const { userId } = body

    console.log("Body recibido:", { userId })

    if (userId) {
      // Enviar email a un usuario específico
      console.log(`Enviando email diario a usuario específico: ${userId}`)
      const result = await DailyEmailService.sendDailyEmail(userId)

      console.log("Resultado del envío individual:", result)

      return NextResponse.json({
        success: result.success,
        message: result.message,
        type: "single_user",
        userId,
      })
    } else {
      // Enviar emails a todos los usuarios de ScaleUp
      console.log("Enviando emails diarios a todos los usuarios de ScaleUp...")
      const result = await DailyEmailService.sendDailyEmailsToAllUsers()

      return NextResponse.json({
        success: result.success,
        results: result.results,
        summary: {
          total: result.results.length,
          successful: result.results.filter((r) => r.success).length,
          failed: result.results.filter((r) => !r.success).length,
        },
        type: "all_users",
      })
    }
  } catch (error) {
    console.error("Error en endpoint de emails diarios:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action")

    console.log("GET /api/send-daily-emails - Action:", action)

    // Si se solicita la lista de usuarios
    if (action === "getUsers") {
      console.log("Obteniendo lista de usuarios...")
      const users = await DailyEmailService.getScaleUpUsers()

      console.log(`Usuarios encontrados: ${users.length}`)

      return NextResponse.json({
        success: true,
        users: users.map((user) => ({
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          preferred_language: user.preferred_language,
          role_code: user.role_code,
        })),
      })
    }

    // Envío normal de emails diarios (para cron jobs)
    console.log("Enviando emails diarios a todos los usuarios...")
    const result = await DailyEmailService.sendDailyEmailsToAllUsers()

    return NextResponse.json({
      success: result.success,
      results: result.results,
      summary: {
        total: result.results.length,
        successful: result.results.filter((r) => r.success).length,
        failed: result.results.filter((r) => !r.success).length,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error en GET de emails diarios:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
