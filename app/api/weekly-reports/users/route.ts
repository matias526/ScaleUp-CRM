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

    // Obtener todos los usuarios activos
    const { data: users, error } = await supabase
      .from("users")
      .select(`
        id, email, first_name, last_name, preferred_language, tech_company_id,
        roles (code)
      `)
      .eq("is_active", true)
      .order("first_name")

    if (error) {
      console.error("Error al obtener usuarios:", error)
      return NextResponse.json({ success: false, error: "Error al obtener usuarios" }, { status: 500 })
    }

    // Formatear datos
    const formattedUsers =
      users?.map((user) => ({
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        preferred_language: user.preferred_language || "es",
        tech_company_id: user.tech_company_id,
        role_code: user.roles?.code,
      })) || []

    return NextResponse.json({
      success: true,
      users: formattedUsers,
    })
  } catch (error) {
    console.error("Error inesperado:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}
