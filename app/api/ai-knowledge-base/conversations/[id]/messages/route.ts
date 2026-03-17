import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { data, error } = await supabase
      .from("kb_messages")
      .select("*")
      .eq("conversation_id", params.id)
      .order("created_at", { ascending: true })

    if (error) {
      throw new Error(error.message)
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error("[v0] Error fetching messages:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
