import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)

    const tech_company_id = searchParams.get("tech_company_id")
    const label_id = searchParams.get("label_id")
    const search = searchParams.get("search")
    const approved_only = searchParams.get("approved_only") === "true"

    let query = supabase
      .from("knowledge_base_questions")
      .select(
        `
        *,
        tech_company:tech_companies(id, name, logo_url),
        creator:users!knowledge_base_questions_created_by_fkey(id, first_name, last_name),
        approver:users!knowledge_base_questions_approved_by_fkey(id, first_name, last_name)
      `,
      )
      .order("created_at", { ascending: false })

    if (tech_company_id) {
      query = query.eq("tech_company_id", tech_company_id)
    }

    if (approved_only) {
      query = query.eq("is_approved", true)
    }

    if (search) {
      query = query.or(`question.ilike.%${search}%,answer.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Si hay filtro por label, filtrar las preguntas
    if (label_id && data) {
      const questionsWithLabel = await Promise.all(
        data.map(async (question) => {
          const { data: labels } = await supabase
            .from("knowledge_base_question_labels")
            .select("label_id")
            .eq("question_id", question.id)
            .eq("label_id", label_id)

          return labels && labels.length > 0 ? question : null
        }),
      )

      const filtered = questionsWithLabel.filter((q) => q !== null)
      return NextResponse.json(filtered)
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in GET /api/knowledge-base/questions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    console.log("[v0] POST /api/knowledge-base/questions - Iniciando")
    const supabase = createClient()

    // Verificar autenticación
    const {
      data: { user },
    } = await supabase.auth.getUser()

    console.log("[v0] Usuario autenticado:", user?.id)

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    console.log("[v0] Body recibido:", JSON.stringify(body, null, 2))

    const { question, answer, tech_company_id, label_ids, attachments } = body

    if (!question || !answer || !tech_company_id) {
      console.log("[v0] Faltan campos requeridos")
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    const { data: approverData } = await supabase
      .from("knowledge_base_tech_company_approvers")
      .select("*")
      .eq("tech_company_id", tech_company_id)
      .eq("user_id", user.id)
      .single()

    const isApprover = !!approverData

    const insertData = {
      question,
      answer,
      tech_company_id,
      created_by: user.id,
      last_modified_by: user.id,
      is_approved: isApprover,
      approved_by: isApprover ? user.id : null,
      approved_at: isApprover ? new Date().toISOString() : null,
      version: 1,
    }

    console.log("[v0] ===== DATOS A INSERTAR =====")
    console.log(JSON.stringify(insertData, null, 2))
    console.log("[v0] ==============================")

    console.log("[v0] Insertando pregunta en la base de datos")
    const { data: newQuestion, error: questionError } = await supabase
      .from("knowledge_base_questions")
      .insert(insertData)
      .select()
      .single()

    if (questionError) {
      console.error("[v0] ===== ERROR DE SUPABASE =====")
      console.error("Message:", questionError.message)
      console.error("Details:", questionError.details)
      console.error("Hint:", questionError.hint)
      console.error("Code:", questionError.code)
      console.error("Full error:", JSON.stringify(questionError, null, 2))
      console.error("[v0] =================================")

      return NextResponse.json(
        {
          error: questionError.message,
          details: questionError.details,
          hint: questionError.hint,
          code: questionError.code,
        },
        { status: 500 },
      )
    }

    console.log("[v0] Pregunta creada:", newQuestion.id)

    // Agregar labels si existen
    if (label_ids && label_ids.length > 0) {
      console.log("[v0] Insertando labels:", label_ids)
      const labelInserts = label_ids.map((label_id: string) => ({
        question_id: newQuestion.id,
        label_id,
      }))

      const { error: labelsError } = await supabase.from("knowledge_base_question_labels").insert(labelInserts)

      if (labelsError) {
        console.error("[v0] Error al insertar labels:", labelsError)
      }
    }

    // Agregar attachments si existen
    if (attachments && attachments.length > 0) {
      console.log("[v0] Insertando attachments:", attachments)
      const attachmentInserts = attachments.map((att: any) => ({
        question_id: newQuestion.id,
        file_name: att.file_name,
        file_url: att.file_url,
        file_type: att.file_type,
        file_size: att.file_size,
        uploaded_by: user.id,
      }))

      const { error: attachmentsError } = await supabase.from("knowledge_base_attachments").insert(attachmentInserts)

      if (attachmentsError) {
        console.error("[v0] Error al insertar attachments:", attachmentsError)
      }
    }

    console.log("[v0] Pregunta creada exitosamente")
    return NextResponse.json(newQuestion)
  } catch (error) {
    console.error("[v0] Error en POST /api/knowledge-base/questions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
