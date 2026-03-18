import { NextResponse } from "next/server"
//import { createClient } from "@/lib/supabase/server"
import { createServerClient } from "@/lib/supabase/server"
import { WeeklyReportService } from "@/lib/services/weekly-report-service"

export async function POST(request: Request) {
  try {
    const supabase = createServerClient()

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("Error de autenticación:", authError)
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 })
    }

    // Verificar rol de admin
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select(`
        id,
        roles!inner (code)
      `)
      .eq("id", user.id)
      .single()

    if (userError || userData?.roles?.code !== "Admin") {
      return NextResponse.json({ success: false, error: "Acceso denegado" }, { status: 403 })
    }

    // Enviar todos los reportes
    const result = await WeeklyReportService.sendAllWeeklyReports()

    return NextResponse.json({
      success: result.success,
      results: result.results,
    })
  } catch (error) {
    console.error("Error inesperado:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}
