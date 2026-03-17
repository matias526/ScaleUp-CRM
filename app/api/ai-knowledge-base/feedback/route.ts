import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { message_id, rating, comment } = await request.json()

    if (!message_id || !rating) {
      return NextResponse.json({ error: "message_id y rating son requeridos" }, { status: 400 })
    }

    const { data: existingFeedback } = await supabase
      .from("kb_feedback")
      .select("id")
      .eq("message_id", message_id)
      .eq("user_id", user.id)
      .single()

    if (existingFeedback) {
      const { error: updateError } = await supabase
        .from("kb_feedback")
        .update({ rating, comment })
        .eq("id", existingFeedback.id)

      if (updateError) {
        throw new Error(updateError.message)
      }
    } else {
      const { error: insertError } = await supabase.from("kb_feedback").insert({
        message_id,
        user_id: user.id,
        rating,
        comment,
      })

      if (insertError) {
        throw new Error(insertError.message)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Error saving feedback:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
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

    if (userData?.roles?.code !== "Admin") {
      return NextResponse.json({ error: "Solo Admin puede ver el feedback" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const techCompanyId = searchParams.get("tech_company_id")
    const ratingFilter = searchParams.get("rating")

    let query = supabase.from("kb_feedback").select(`
        *,
        kb_messages!inner(
          content,
          role,
          conversation_id,
          kb_conversations!inner(
            tech_company_id,
            tech_companies(name)
          )
        ),
        users(first_name, last_name, email)
      `)

    if (techCompanyId) {
      query = query.eq("kb_messages.kb_conversations.tech_company_id", techCompanyId)
    }

    if (ratingFilter) {
      query = query.eq("rating", Number.parseInt(ratingFilter))
    }

    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error("[v0] Error fetching feedback:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
