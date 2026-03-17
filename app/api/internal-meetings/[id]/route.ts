import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("Error de autenticación:", authError)
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 })
    }

    const meetingId = params.id
    console.log("[v0] Fetching meeting:", meetingId, "for user:", user.id)

    // Get meeting details
    const { data: meeting, error: meetingError } = await supabase
      .from("internal_weekly_meetings")
      .select("*")
      .eq("id", meetingId)
      .single()

    if (meetingError) {
      console.error("Error fetching meeting:", meetingError)
      return NextResponse.json({ success: false, error: "Error al obtener reunión" }, { status: 500 })
    }

    // Get news for this meeting
    const { data: news, error: newsError } = await supabase
      .from("weekly_general_news")
      .select("*")
      .eq("meeting_id", meetingId)
      .order("order_index")

    if (newsError) {
      console.error("Error fetching news:", newsError)
      return NextResponse.json({ success: false, error: "Error al obtener noticias" }, { status: 500 })
    }

    console.log("[v0] Meeting fetched successfully:", meeting.id)
    console.log("[v0] News items count:", news?.length || 0)

    return NextResponse.json({ success: true, meeting, news: news || [] })
  } catch (error) {
    console.error("Error in GET /api/internal-meetings/[id]:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("Error de autenticación:", authError)
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 })
    }

    const meetingId = params.id
    const body = await request.json()
    const { meeting_date, weekly_topic, status, news_items } = body

    console.log("[v0] Updating meeting:", meetingId, "with data:", JSON.stringify(body, null, 2))

    // Update meeting
    const { error: meetingError } = await supabase
      .from("internal_weekly_meetings")
      .update({
        meeting_date,
        weekly_topic,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", meetingId)

    if (meetingError) {
      console.error("Error updating meeting:", meetingError)
      return NextResponse.json({ success: false, error: "Error al actualizar reunión" }, { status: 500 })
    }

    // Delete existing news
    const { error: deleteError } = await supabase.from("weekly_general_news").delete().eq("meeting_id", meetingId)

    if (deleteError) {
      console.error("Error deleting existing news:", deleteError)
      return NextResponse.json({ success: false, error: "Error al eliminar noticias existentes" }, { status: 500 })
    }

    // Insert new news items
    if (news_items && news_items.length > 0) {
      const newsToInsert = news_items.map((item: any, index: number) => ({
        meeting_id: meetingId,
        title: item.title,
        description: item.description,
        image_url: item.image_url || null,
        order_index: index,
        created_by: user.id,
      }))

      const { error: newsError } = await supabase.from("weekly_general_news").insert(newsToInsert)

      if (newsError) {
        console.error("Error inserting news:", newsError)
        return NextResponse.json({ success: false, error: "Error al insertar noticias" }, { status: 500 })
      }
    }

    console.log("[v0] Meeting updated successfully:", meetingId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in PUT /api/internal-meetings/[id]:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}
