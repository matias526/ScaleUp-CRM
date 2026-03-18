import { type NextRequest, NextResponse } from "next/server"
//import { createClient } from "@/lib/supabase/server"
import { createServerClient } from "@/lib/supabase/server"
import { sendInternalMeetingSummary } from "@/lib/services/internal-meeting-summary-service"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("[v0] send-summary API called for meeting:", params.id)

    const supabase = createServerClient()
    const meetingId = params.id

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log("[v0] Authentication failed")
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { recipients } = body

    console.log("[v0] Recipients received:", recipients)

    if (!Array.isArray(recipients) || recipients.length === 0) {
      console.log("[v0] No valid recipients")
      return NextResponse.json({ success: false, error: "No hay destinatarios válidos" }, { status: 400 })
    }

    // Get meeting data
    const { data: meeting } = await supabase
      .from("internal_weekly_meetings")
      .select("meeting_date, weekly_topic, previous_meeting_id")
      .eq("id", meetingId)
      .single()

    if (!meeting) {
      console.log("[v0] Meeting not found")
      return NextResponse.json({ success: false, error: "Reunión no encontrada" }, { status: 404 })
    }

    console.log("[v0] Meeting data loaded:", meeting)

    // Get news items
    const { data: newsItems } = await supabase
      .from("weekly_general_news")
      .select("title, description")
      .eq("meeting_id", meetingId)
      .order("order_index")

    console.log("[v0] News items loaded:", newsItems?.length || 0)

    // Get previous commitments
    let previousCommitments: any[] = []
    if (meeting.previous_meeting_id) {
      const { data: prevCommitments } = await supabase
        .from("tasks")
        .select(
          `
          id,
          title,
          description,
          commitment_status,
          tech_company_id,
          tech_companies(name),
          users!tasks_assigned_to_fkey(first_name, last_name)
        `,
        )
        .eq("is_commitment", true)
        .eq("meeting_id", meeting.previous_meeting_id)

      previousCommitments =
        prevCommitments?.map((c: any) => ({
          title: c.title,
          description: c.description,
          commitment_status: c.commitment_status,
          tech_company_name: c.tech_companies?.name || null,
          user_name: c.users ? `${c.users.first_name} ${c.users.last_name}` : "Usuario desconocido",
        })) || []
    }

    console.log("[v0] Previous commitments loaded:", previousCommitments.length)

    // Get current commitments
    const { data: currCommitments } = await supabase
      .from("tasks")
      .select(
        `
        id,
        title,
        description,
        tech_company_id,
        tech_companies(name),
        users!tasks_assigned_to_fkey(first_name, last_name)
      `,
      )
      .eq("is_commitment", true)
      .eq("meeting_id", meetingId)

    const currentCommitments =
      currCommitments?.map((c: any) => ({
        title: c.title,
        description: c.description,
        commitment_status: null,
        tech_company_name: c.tech_companies?.name || null,
        user_name: c.users ? `${c.users.first_name} ${c.users.last_name}` : "Usuario desconocido",
      })) || []

    console.log("[v0] Current commitments loaded:", currentCommitments.length)

    // Get participants
    const { data: participantIds } = await supabase
      .from("internal_meeting_participants")
      .select("user_id")
      .eq("meeting_id", meetingId)
      .eq("attended", true)

    let participants: any[] = []
    if (participantIds && participantIds.length > 0) {
      const { data: participantData } = await supabase
        .from("users")
        .select("first_name, last_name, email")
        .in(
          "id",
          participantIds.map((p) => p.user_id),
        )

      participants = participantData || []
    }

    console.log("[v0] Participants loaded:", participants.length)

    // Send email
    console.log("[v0] Calling sendInternalMeetingSummary...")
    const result = await sendInternalMeetingSummary({
      to: recipients,
      meetingDate: meeting.meeting_date,
      weeklyTopic: meeting.weekly_topic,
      newsItems: newsItems || [],
      previousCommitments,
      currentCommitments,
      participants,
    })

    console.log("[v0] Email service result:", result)

    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] Error sending summary:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}
