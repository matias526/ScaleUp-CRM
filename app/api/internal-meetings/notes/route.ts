import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const body = await request.json()

    const { meeting_id, user_id, note_content } = body

    // Validate required fields
    if (!meeting_id || !user_id || !note_content) {
      return NextResponse.json(
        {
          success: false,
          error: "meeting_id, user_id y note_content son requeridos",
        },
        { status: 400 },
      )
    }

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "No autenticado",
        },
        { status: 401 },
      )
    }

    // Insert note into meeting_notes table
    const { data: note, error: insertError } = await supabase
      .from("meeting_notes")
      .insert({
        meeting_id,
        user_id,
        note_content,
        created_by: user.id,
      })
      .select()
      .single()

    if (insertError) {
      console.error("[v0] Error inserting note:", insertError)
      return NextResponse.json(
        {
          success: false,
          error: "Error al crear la nota",
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      data: note,
    })
  } catch (error) {
    console.error("[v0] Error in POST /api/internal-meetings/notes:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor",
      },
      { status: 500 },
    )
  }
}
