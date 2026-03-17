import { type NextRequest, NextResponse } from "next/server"
import { DailyEmailService } from "@/lib/services/daily-email-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ success: false, error: "userId es requerido" }, { status: 400 })
    }

    console.log(`Debug: Obteniendo datos para usuario ${userId}`)

    // Obtener los datos del email sin enviarlo
    const emailData = await DailyEmailService.getDailyEmailData(userId)

    if (!emailData) {
      return NextResponse.json(
        { success: false, error: "No se pudieron obtener los datos del usuario" },
        { status: 404 },
      )
    }

    // Verificar si hay contenido relevante
    const hasContent =
      emailData.stats.totalUpcomingTasks > 0 ||
      emailData.stats.newTasksCount > 0 ||
      emailData.stats.newOpportunitiesCount > 0

    return NextResponse.json({
      success: true,
      ...emailData,
      hasContent,
      wouldSendEmail: hasContent,
    })
  } catch (error) {
    console.error("Error en debug de datos de email:", error)
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
