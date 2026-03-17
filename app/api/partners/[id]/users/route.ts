import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Verificar si el usuario está autenticado
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: { message: "No autorizado" } }, { status: 401 })
    }

    // Obtener usuarios del partner
    const { data, error } = await supabase
      .from("users")
      .select(`
        id, email, first_name, last_name, is_active,
        roles:role_id (code)
      `)
      .eq("partner_id", params.id)

    if (error) {
      console.error("Error al obtener usuarios:", error)
      return NextResponse.json({ error: { message: error.message } }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error("Error inesperado:", error)
    return NextResponse.json({ error: { message: "Error interno del servidor" } }, { status: 500 })
  }
}
