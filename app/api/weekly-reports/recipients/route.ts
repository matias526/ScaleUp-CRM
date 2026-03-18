import { NextResponse } from "next/server"
//import { createClient } from "@/lib/supabase/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET() {
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

    // Obtener todos los destinatarios activos
    const { data: recipients, error } = await supabase
      .from("weekly_report_recipients")
      .select(`
        id, tech_company_id, user_id, is_active, created_at,
        tech_company:tech_companies (id, name),
        user:users (id, email, first_name, last_name, preferred_language, roles(code))
      `)
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error al obtener destinatarios:", error)
      return NextResponse.json({ success: false, error: "Error al obtener destinatarios" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      recipients: recipients || [],
    })
  } catch (error) {
    console.error("Error inesperado:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}

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

    // Obtener datos del request
    const { tech_company_id, user_id } = await request.json()

    if (!tech_company_id || !user_id) {
      return NextResponse.json({ success: false, error: "tech_company_id y user_id son requeridos" }, { status: 400 })
    }

    // Verificar si ya existe
    const { data: existing, error: existingError } = await supabase
      .from("weekly_report_recipients")
      .select("id")
      .eq("tech_company_id", tech_company_id)
      .eq("user_id", user_id)
      .eq("is_active", true)
      .maybeSingle()

    if (existingError) {
      console.error("Error al verificar destinatario existente:", existingError)
      return NextResponse.json({ success: false, error: "Error al verificar destinatario existente" }, { status: 500 })
    }

    if (existing) {
      return NextResponse.json(
        { success: false, error: "Este usuario ya está configurado como destinatario para esta tech company" },
        { status: 400 },
      )
    }

    // Crear nuevo destinatario
    const { data: newRecipient, error } = await supabase
      .from("weekly_report_recipients")
      .insert({
        tech_company_id,
        user_id,
        is_active: true,
      })
      .select(`
        id, tech_company_id, user_id, is_active, created_at,
        tech_company:tech_companies (id, name),
        user:users (id, email, first_name, last_name, preferred_language, roles(code))
      `)
      .single()

    if (error) {
      console.error("Error al crear destinatario:", error)
      return NextResponse.json({ success: false, error: "Error al crear destinatario" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      recipient: newRecipient,
    })
  } catch (error) {
    console.error("Error inesperado:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}
