import { NextResponse } from "next/server"
//import { createClient } from "@/lib/supabase/server"
import { createServerClient } from "@/lib/supabase/server"

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerClient()
    const id = params.id

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("Error de autenticación:", authError)
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 })
    }

    // Desactivar destinatario (soft delete)
    const { error } = await supabase.from("weekly_report_recipients").update({ is_active: false }).eq("id", id)

    if (error) {
      console.error("Error al eliminar destinatario:", error)
      return NextResponse.json({ success: false, error: "Error al eliminar destinatario" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Destinatario eliminado correctamente",
    })
  } catch (error) {
    console.error("Error inesperado:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}
