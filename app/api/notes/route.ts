import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/types/supabase"

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    const { data: session } = await supabase.auth.getSession()

    if (!session.session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { opportunity_id, content, is_private } = await request.json()

    if (!opportunity_id || !content) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 })
    }

    const user_id = session.session.user.id

    // Añadir logs para depuración
    console.log("API - Creando nota:", { opportunity_id, user_id, content, is_private })

    // Insertar la nota en la base de datos
    const { data, error } = await supabase
      .from("notes")
      .insert({
        opportunity_id,
        user_id,
        content,
        is_private: is_private || false,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Error al crear nota:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log de éxito
    console.log("API - Nota creada exitosamente:", data)

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error inesperado:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error desconocido" }, { status: 500 })
  }
}

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

    // Verificar si el usuario es miembro de ScaleUp
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role_id, partner_id")
      .eq("id", session.session.user.id)
      .single()

    if (userError) {
      console.error("Error al obtener datos del usuario:", userError)
      return NextResponse.json({ error: userError.message }, { status: 500 })
    }

    // Determinar si el usuario es miembro de ScaleUp
    const scaleUpRoles = [1, 2, 3] // IDs de roles que pertenecen a ScaleUp
    const isScaleUp = scaleUpRoles.includes(userData.role_id) || userData.partner_id === null

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
      query = query.eq("is_private", false)
    }

    // Ejecutar la consulta ordenando por fecha de creación descendente
    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) {
      console.error("Error al obtener notas:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error inesperado:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error desconocido" }, { status: 500 })
  }
}
