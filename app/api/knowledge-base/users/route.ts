//import { createClient } from "@/lib/supabase/server"
import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = createServerClient()

    // Verificar autenticación
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Obtener usuarios activos con sus roles
    const { data, error } = await supabase
      .from("users")
      .select(
        `
        id,
        first_name,
        last_name,
        email,
        roles:role_id (code)
      `,
      )
      .eq("is_active", true)

    if (error) {
      console.error("[v0] Error fetching users:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Total usuarios activos:", data?.length)

    // Filtrar solo Admin y BDD
    const filteredUsers = data?.filter((user: any) => user.roles?.code === "Admin" || user.roles?.code === "BDD")

    console.log("[v0] Usuarios Admin/BDD después de filtrar:", filteredUsers?.length)

    // Formatear respuesta
    const formattedUsers = filteredUsers?.map((user: any) => ({
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role_code: user.roles?.code,
      full_name: `${user.first_name} ${user.last_name}`,
    }))

    return NextResponse.json({ data: formattedUsers || [] })
  } catch (error: any) {
    console.error("[v0] Error en /api/knowledge-base/users:", error)
    return NextResponse.json({ error: "Error al obtener usuarios" }, { status: 500 })
  }
}
