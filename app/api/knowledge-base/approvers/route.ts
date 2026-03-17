import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const tech_company_id = searchParams.get("tech_company_id")

    let query = supabase
      .from("knowledge_base_tech_company_approvers")
      .select(
        `
        *,
        tech_companies:tech_company_id(id, name),
        users:user_id(id, first_name, last_name, email)
      `,
      )
      .order("created_at", { ascending: false })

    if (tech_company_id) {
      query = query.eq("tech_company_id", tech_company_id)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error fetching approvers:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Approvers fetched:", data)
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in GET /api/knowledge-base/approvers:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient()

    // Verificar autenticación y que sea admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from("users")
      .select("role_id, roles:role_id(code)")
      .eq("id", user.id)
      .single()

    console.log("[v0] User data:", userData)

    if (!userData || userData.roles?.code !== "Admin") {
      return NextResponse.json(
        { error: "No autorizado. Solo administradores pueden gestionar aprobadores." },
        { status: 403 },
      )
    }

    const body = await request.json()
    const { tech_company_id, user_id } = body

    console.log("[v0] Attempting to insert approver:", { tech_company_id, user_id, created_by: user.id })

    if (!tech_company_id || !user_id) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("knowledge_base_tech_company_approvers")
      .insert({
        tech_company_id,
        user_id,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating approver - Full details:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      })
      return NextResponse.json(
        {
          error: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        },
        { status: 500 },
      )
    }

    console.log("[v0] Approver created:", data)
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in POST /api/knowledge-base/approvers:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
