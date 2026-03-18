import { type NextRequest, NextResponse } from "next/server"
//import { createClient } from "@/lib/supabase/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("Error de autenticación:", authError)
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 })
    }

    console.log("[v0] Fetching internal meetings for user:", user.id)

    // Fetch internal meetings with better ordering
    const { data, error } = await supabase
      .from("internal_weekly_meetings")
      .select("*")
      .order("meeting_date", { ascending: false })
      .limit(20)

    console.log("[v0] Query results:")
    console.log("[v0] Error:", error)
    console.log("[v0] Data count:", data?.length || 0)

    if (error) {
      console.error("Error fetching internal meetings:", error)
      return NextResponse.json({ success: false, error: "Error al obtener reuniones" }, { status: 500 })
    }

    return NextResponse.json({ success: true, meetings: data || [] })
  } catch (error) {
    console.error("Unexpected error in internal meetings API:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("Error de autenticación:", authError)
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { meeting_date, weekly_topic, status, news_items } = body

    console.log("[v0] Creating new meeting with data:", JSON.stringify(body, null, 2))

    const { data: previousMeeting } = await supabase
      .from("internal_weekly_meetings")
      .select("id")
      .order("meeting_date", { ascending: false })
      .limit(1)
      .maybeSingle()

    console.log("[v0] Previous meeting found:", previousMeeting?.id || "none")

    const { data: meetingData, error: meetingError } = await supabase
      .from("internal_weekly_meetings")
      .insert({
        meeting_date,
        weekly_topic,
        status: status || "scheduled",
        created_by: user.id,
        previous_meeting_id: previousMeeting?.id || null,
      })
      .select()
      .single()

    if (meetingError) {
      console.error("Error creating meeting:", meetingError)
      return NextResponse.json({ success: false, error: "Error al crear reunión" }, { status: 500 })
    }

    console.log("[v0] Meeting created:", meetingData)

    // Insert news items if provided
    if (news_items && news_items.length > 0) {
      const newsToInsert = news_items.map((item: any, index: number) => ({
        meeting_id: meetingData.id,
        title: item.title,
        description: item.description,
        image_url: item.image_url || null,
        order_index: index,
        created_by: user.id,
      }))

      console.log("[v0] Inserting news items:", JSON.stringify(newsToInsert, null, 2))

      const { error: newsError } = await supabase.from("weekly_general_news").insert(newsToInsert)

      if (newsError) {
        console.error("Error inserting news:", newsError)
        return NextResponse.json({ success: false, error: "Error al insertar noticias" }, { status: 500 })
      }

      console.log("[v0] News items inserted successfully")
    }

    return NextResponse.json({ success: true, meeting: meetingData })
  } catch (error) {
    console.error("Error in POST /api/internal-meetings:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}
