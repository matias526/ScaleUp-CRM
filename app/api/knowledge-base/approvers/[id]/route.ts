import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
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

    if (!userData || userData.roles?.code !== "admin") {
      return NextResponse.json(
        { error: "No autorizado. Solo administradores pueden gestionar aprobadores." },
        { status: 403 },
      )
    }

    const { error } = await supabase.from("knowledge_base_tech_company_approvers").delete().eq("id", params.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in DELETE /api/knowledge-base/approvers/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
