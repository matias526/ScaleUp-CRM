//import { createClient } from "@/lib/supabase/server"
import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Check if user is Admin
    const { data: userData } = await supabase.from("users").select("role:roles(code)").eq("id", user.id).single()

    if (userData?.role?.code !== "Admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { error } = await supabase.from("knowledge_base_labels").delete().eq("id", params.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting label:", error)
    return NextResponse.json({ error: error.message || "Error al eliminar label" }, { status: 500 })
  }
}
