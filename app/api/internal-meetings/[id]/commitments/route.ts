import { type NextRequest, NextResponse } from "next/server"
//import { createClient } from "@/lib/supabase/server"
import { createServerClient } from "@/lib/supabase/server"
export const dynamic = "force-dynamic";

console.error("!!! EL ARCHIVO DE COMMITMENTS ROUTE FUE LEÍDO POR EL NAVEGADOR !!!");

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  console.error("DENTRO DE LA FUNCION");
  try {
    const supabase = createServerClient()

    const meetingId = params.id

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 })
    }

    // Get previous meeting ID
    const { data: currentMeeting } = await supabase
      .from("internal_weekly_meetings")
      .select("previous_meeting_id")
      .eq("id", meetingId)
      .single()

    const previousMeetingId = currentMeeting?.previous_meeting_id

    // Get previous week commitments
    let previousCommitments: any[] = []
    if (previousMeetingId) {
      const { data: prevCommitments } = await supabase
        .from("tasks")
        .select(
          `
          id,
          title,
          description,
          commitment_status,
          tech_company_id,
          assigned_to,
          tech_companies(name),
          users!tasks_assigned_to_fkey(first_name, last_name)
        `,
        )
        .eq("is_commitment", true)
        .eq("meeting_id", previousMeetingId)

      previousCommitments =
        prevCommitments?.map((c: any) => ({
          id: c.id,
          title: c.title,
          description: c.description,
          commitment_status: c.commitment_status,
          tech_company_name: c.tech_companies?.name || null,
          user_name: c.users ? `${c.users.first_name} ${c.users.last_name}` : "Usuario desconocido",
        })) || []
    }

    // Get current week commitments
    const { data: currCommitments } = await supabase
      .from("tasks")
      .select(
        `
        id,
        title,
        description,
        tech_company_id,
        assigned_to,
        tech_companies(name),
        users!tasks_assigned_to_fkey(first_name, last_name)
      `,
      )
      .eq("is_commitment", true)
      .eq("meeting_id", meetingId)

    const currentCommitments =
      currCommitments?.map((c: any) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        tech_company_name: c.tech_companies?.name || null,
        user_name: c.users ? `${c.users.first_name} ${c.users.last_name}` : "Usuario desconocido",
      })) || []

    return NextResponse.json({
      success: true,
      previousCommitments,
      currentCommitments,
    })
  } catch (error) {
    console.error("Error fetching commitments:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}
