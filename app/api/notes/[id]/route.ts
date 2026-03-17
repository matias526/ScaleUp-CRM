import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/types/supabase"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const noteId = params.id
    const supabase = createRouteHandlerClient<Database>({ cookies })
    const { data: session } = await supabase.auth.getSession()

    if (!session.session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Primero verificamos si el usuario tiene permiso para eliminar esta nota
    const { data: note, error: noteError } = await supabase.from("notes").select("user_id").eq("id", noteId).single()

    if (noteError) {
      console.error("Error al obtener la nota:", noteError)
      return NextResponse.json({ error: noteError.message }, { status: 500 })
    }

    if (!note) {
      return NextResponse.json({ error: "Nota no encontrada" }, { status: 404 })
    }

    // Verificar si el usuario es el creador de la nota o un miembro de ScaleUp
    const userId = session.session.user.id
    if (note.user_id !== userId) {
      // Si no es el creador, verificamos si es miembro de ScaleUp
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("role_id, partner_id")
        .eq("id", userId)
        .single()

      if (userError) {
        console.error("Error al obtener datos del usuario:", userError)
        return NextResponse.json({ error: userError.message }, { status: 500 })
      }

      // Determinar si el usuario es miembro de ScaleUp
      const scaleUpRoles = [1, 2, 3] // IDs de roles que pertenecen a ScaleUp
      const isScaleUp = scaleUpRoles.includes(userData.role_id) || userData.partner_id === null

      if (!isScaleUp) {
        return NextResponse.json({ error: "No tienes permiso para eliminar esta nota" }, { status: 403 })
      }
    }

    // Eliminar la nota
    const { error: deleteError } = await supabase.from("notes").delete().eq("id", noteId)

    if (deleteError) {
      console.error("Error al eliminar la nota:", deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error inesperado:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error desconocido" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const noteId = params.id
    const supabase = createRouteHandlerClient<Database>({ cookies })
    const { data: session } = await supabase.auth.getSession()

    if (!session.session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Obtener los datos de la solicitud
    const requestData = await request.json()
    const { content, is_private } = requestData

    if (!content || content.trim() === "") {
      return NextResponse.json({ error: "El contenido de la nota no puede estar vacío" }, { status: 400 })
    }

    // Primero verificamos si el usuario tiene permiso para editar esta nota
    const { data: note, error: noteError } = await supabase.from("notes").select("user_id").eq("id", noteId).single()

    if (noteError) {
      console.error("Error al obtener la nota:", noteError)
      return NextResponse.json({ error: noteError.message }, { status: 500 })
    }

    if (!note) {
      return NextResponse.json({ error: "Nota no encontrada" }, { status: 404 })
    }

    // Verificar si el usuario es el creador de la nota o un miembro de ScaleUp
    const userId = session.session.user.id
    if (note.user_id !== userId) {
      // Si no es el creador, verificamos si es miembro de ScaleUp
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("role_id, partner_id")
        .eq("id", userId)
        .single()

      if (userError) {
        console.error("Error al obtener datos del usuario:", userError)
        return NextResponse.json({ error: userError.message }, { status: 500 })
      }

      // Determinar si el usuario es miembro de ScaleUp
      const scaleUpRoles = [1, 2, 3] // IDs de roles que pertenecen a ScaleUp
      const isScaleUp = scaleUpRoles.includes(userData.role_id) || userData.partner_id === null

      if (!isScaleUp) {
        return NextResponse.json({ error: "No tienes permiso para editar esta nota" }, { status: 403 })
      }
    }

    // Preparar los datos para actualizar
    const updateData: any = {
      content: content.trim(),
      updated_at: new Date().toISOString(),
    }

    // Solo actualizar is_private si se proporciona y el usuario es de ScaleUp
    if (typeof is_private === "boolean") {
      // Verificar si el usuario es de ScaleUp
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("role_id, partner_id")
        .eq("id", userId)
        .single()

      if (userError) {
        console.error("Error al obtener datos del usuario:", userError)
        return NextResponse.json({ error: userError.message }, { status: 500 })
      }

      // Determinar si el usuario es miembro de ScaleUp
      const scaleUpRoles = [1, 2, 3] // IDs de roles que pertenecen a ScaleUp
      const isScaleUp = scaleUpRoles.includes(userData.role_id) || userData.partner_id === null

      if (isScaleUp) {
        updateData.is_private = is_private
      }
    }

    // Actualizar la nota
    const { data: updatedNote, error: updateError } = await supabase
      .from("notes")
      .update(updateData)
      .eq("id", noteId)
      .select()
      .single()

    if (updateError) {
      console.error("Error al actualizar la nota:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json(updatedNote)
  } catch (error) {
    console.error("Error inesperado:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error desconocido" }, { status: 500 })
  }
}
