import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = createClient()

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("Error de autenticación:", authError)
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 })
    }

    // Obtener todas las tech companies activas
    const { data: techCompanies, error } = await supabase
      .from("tech_companies")
      .select("id, name, logo_url")
      .eq("is_active", true)
      .order("name")

    if (error) {
      console.error("Error al obtener tech companies:", error)
      return NextResponse.json({ success: false, error: "Error al obtener tech companies" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      techCompanies: techCompanies || [],
    })
  } catch (error) {
    console.error("Error inesperado:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}
