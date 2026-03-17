import { type NextRequest, NextResponse } from "next/server"
import { DailyEmailService } from "@/lib/services/daily-email-service"

export async function POST(request: NextRequest) {
  try {
    console.log("POST /api/send-daily-emails-debug - Iniciando modo DEBUG...")

    const body = await request.json().catch(() => ({}))
    const { userId } = body

    console.log("Body recibido (DEBUG):", { userId })

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "userId es requerido para el modo debug",
        },
        { status: 400 },
      )
    }

    // Enviar email en modo DEBUG (siempre a matias@scaleup-global.com)
    console.log(`Enviando email DEBUG para usuario: ${userId} -> matias@scaleup-global.com`)
    const result = await DailyEmailService.sendDailyEmail(userId, true) // isDebug = true

    console.log("Resultado del envío DEBUG:", result)

    return NextResponse.json({
      success: result.success,
      message: result.message,
      type: "debug_email",
      userId,
      sentTo: "matias@scaleup-global.com",
    })
  } catch (error) {
    console.error("Error en endpoint de email DEBUG:", error)
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
