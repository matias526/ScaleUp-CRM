import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("knowledge_base_questions")
      .select(
        `
        *,
        tech_company:tech_companies(id, name, logo_url),
        creator:users!knowledge_base_questions_created_by_fkey(id, first_name, last_name),
        approver:users!knowledge_base_questions_approved_by_fkey(id, first_name, last_name)
      `,
      )
      .eq("id", params.id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Obtener labels
    const { data: questionLabels } = await supabase
      .from("knowledge_base_question_labels")
      .select("label:knowledge_base_labels(*)")
      .eq("question_id", params.id)

    // Obtener attachments
    const { data: attachments } = await supabase
      .from("knowledge_base_attachments")
      .select("*")
      .eq("question_id", params.id)

    return NextResponse.json({
      ...data,
      labels: questionLabels?.map((ql: any) => ql.label) || [],
      attachments: attachments || [],
    })
  } catch (error) {
    console.error("Error in GET /api/knowledge-base/questions/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()

    // Verificar autenticación
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { question, answer, tech_company_id, label_ids, attachments } = body

    if (!question || !answer || !tech_company_id) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    // Actualizar la pregunta (el trigger se encargará de incrementar version y resetear aprobación)
    const { data: updatedQuestion, error: questionError } = await supabase
      .from("knowledge_base_questions")
      .update({
        question,
        answer,
        tech_company_id,
        last_modified_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single()

    if (questionError) {
      return NextResponse.json({ error: questionError.message }, { status: 500 })
    }

    // Actualizar labels: eliminar los existentes y agregar los nuevos
    await supabase.from("knowledge_base_question_labels").delete().eq("question_id", params.id)

    if (label_ids && label_ids.length > 0) {
      const labelInserts = label_ids.map((label_id: string) => ({
        question_id: params.id,
        label_id,
      }))

      await supabase.from("knowledge_base_question_labels").insert(labelInserts)
    }

    // Actualizar attachments si se proporcionan nuevos
    if (attachments && attachments.length > 0) {
      const attachmentInserts = attachments.map((att: any) => ({
        question_id: params.id,
        file_name: att.file_name,
        file_url: att.file_url,
        file_type: att.file_type,
        file_size: att.file_size,
        uploaded_by: user.id,
      }))

      await supabase.from("knowledge_base_attachments").insert(attachmentInserts)
    }

    return NextResponse.json(updatedQuestion)
  } catch (error) {
    console.error("Error in PUT /api/knowledge-base/questions/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()

    // Verificar autenticación
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Verificar que el usuario es admin
    const { data: userData } = await supabase
      .from("users")
      .select("role_id, roles:role_id(code)")
      .eq("id", user.id)
      .single()

    if (!userData || userData.roles?.code !== "admin") {
      return NextResponse.json(
        { error: "No autorizado. Solo administradores pueden eliminar preguntas." },
        { status: 403 },
      )
    }

    // Eliminar la pregunta (CASCADE eliminará labels y attachments)
    const { error } = await supabase.from("knowledge_base_questions").delete().eq("id", params.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in DELETE /api/knowledge-base/questions/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
