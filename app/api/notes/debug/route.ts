import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/types/supabase"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    const { data: session } = await supabase.auth.getSession()

    if (!session.session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const url = new URL(request.url)
    const opportunityId = url.searchParams.get("opportunity_id")

    if (!opportunityId) {
      return NextResponse.json({ error: "ID de oportunidad requerido" }, { status: 400 })
    }

    // Obtener información detallada del usuario
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*, roles(id, name, code)")
      .eq("id", session.session.user.id)
      .single()

    if (userError) {
      console.error("Error al obtener datos del usuario:", userError)
      return NextResponse.json({ error: userError.message }, { status: 500 })
    }

    // Determinar si el usuario es miembro de ScaleUp
    const scaleUpRoles = [1, 2, 3] // IDs de roles que pertenecen a ScaleUp
    const scaleUpCodes = ["Admin", "BDD"] // Códigos de roles que pertenecen a ScaleUp
    const isScaleUp =
      scaleUpRoles.includes(userData.role_id) ||
      scaleUpCodes.includes(userData.roles?.code) ||
      userData.partner_id === null

    console.log("API DEBUG - Usuario:", {
      id: userData.id,
      email: userData.email,
      role_id: userData.role_id,
      role_code: userData.roles?.code,
      partner_id: userData.partner_id,
      isScaleUp,
    })

    // Construir la consulta base
    let query = supabase
      .from("notes")
      .select(`
        *,
        user:users(id, first_name, last_name, email, role_id, partner_id, tech_company_id)
      `)
      .eq("opportunity_id", opportunityId)

    // Si el usuario no es de ScaleUp, filtrar las notas privadas
    if (!isScaleUp) {
      console.log("API DEBUG - Aplicando filtro: Solo notas públicas (is_private = false)")
      query = query.eq("is_private", false)
    } else {
      console.log("API DEBUG - NO aplicando filtro: Usuario es ScaleUp, mostrando todas las notas")
    }

    // Ejecutar la consulta ordenando por fecha de creación descendente
    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) {
      console.error("Error al obtener notas:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Contar notas privadas y públicas
    const privateNotes = data?.filter((note) => note.is_private).length || 0
    const publicNotes = data?.length - privateNotes || 0

    console.log("API DEBUG - Notas obtenidas:", {
      total: data?.length || 0,
      privadas: privateNotes,
      publicas: publicNotes,
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error inesperado:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error desconocido" }, { status: 500 })
  }
}
