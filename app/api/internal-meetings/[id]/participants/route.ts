import { type NextRequest, NextResponse } from "next/server"
//import { createClient } from "@/lib/supabase/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerClient()

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
    const supabase = createServerClient()
    const body = await request.json()

    // --- EL CAMBIO CLAVE ---
    // En lugar de confiar en 'params.id', lo sacamos manualmente de la URL de la petición
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    // Si la ruta es /api/internal-meetings/[id]/participants, el ID es el penúltimo elemento
    const idFromPath = pathParts[pathParts.length - 2];

    // Intentamos obtener el ID de todas las formas posibles
    const meetingId = idFromPath || params?.id || body.meetingId;

    console.log("[SERVER DEBUG] ID Final recuperado:", meetingId);

    const userId = body.userId;
    const attended = body.attended;

    if (!userId || !meetingId || meetingId === "undefined") {
      return NextResponse.json({
        success: false,
        error: `Faltan IDs. userId: ${userId}, meetingId: ${meetingId}`
      }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("internal_meeting_participants")
      .upsert(
        {
          meeting_id: meetingId,
          user_id: userId,
          attended: attended,
        },
        { onConflict: "meeting_id,user_id" }
      )
      .select()

    if (error) throw error;
    return NextResponse.json({ success: true, participant: data[0] })

  } catch (error: any) {
    console.error("Error en API Participants:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
