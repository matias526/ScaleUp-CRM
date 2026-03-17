import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const meetingId = params.id

    console.log("[v0] Fetching participants for meeting:", meetingId)

    // Obtener participantes de la reunión
    const { data: participants, error } = await supabase
      .from("internal_meeting_participants")
      .select(`
        user_id,
        attended,
        users:user_id (
          id,
          first_name,
          last_name,
          email,
          role_code
        )
      `)
      .eq("meeting_id", meetingId)

    if (error) {
      console.error("[v0] Error fetching meeting participants:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    console.log("[v0] Participants loaded:", participants?.length || 0)

    return NextResponse.json({ success: true, participants })
  } catch (error) {
    console.error("[v0] Error in meeting participants API:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const meetingId = params.id
    const { userId, attended } = await request.json()

    // Insertar o actualizar participante
    const { data, error } = await supabase
      .from("internal_meeting_participants")
      .upsert(
        {
          meeting_id: meetingId,
          user_id: userId,
          attended: attended,
        },
        {
          onConflict: "meeting_id,user_id",
        },
      )
      .select()

    if (error) {
      console.error("Error updating meeting participant:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, participant: data[0] })
  } catch (error) {
    console.error("Error in meeting participants API:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
