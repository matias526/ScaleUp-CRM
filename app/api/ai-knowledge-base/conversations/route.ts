import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const techCompanyId = searchParams.get("tech_company_id")

    let query = supabase
      .from("kb_conversations")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (techCompanyId) {
      query = query.eq("tech_company_id", techCompanyId)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(error.message)
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error("[v0] Error fetching conversations:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
