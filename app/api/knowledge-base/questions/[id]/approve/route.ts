//import { createClient } from "@/lib/supabase/server"
import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerClient()

    // Verificar autenticación
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Obtener la pregunta para verificar la tech_company_id
    const { data: question, error: questionError } = await supabase
      .from("knowledge_base_questions")
      .select("tech_company_id, is_approved")
      .eq("id", params.id)
      .single()

    if (questionError || !question) {
      return NextResponse.json({ error: "Pregunta no encontrada" }, { status: 404 })
    }

    // Verificar si el usuario puede aprobar preguntas de esta TechCompany
    const { data: approver, error: approverError } = await supabase
      .from("knowledge_base_tech_company_approvers")
      .select("id")
      .eq("user_id", user.id)
      .eq("tech_company_id", question.tech_company_id)
      .single()

    if (approverError || !approver) {
      return NextResponse.json(
        { error: "No tienes permisos para aprobar preguntas de esta TechCompany" },
        { status: 403 },
      )
    }

    // Aprobar la pregunta
    const { data: updatedQuestion, error: updateError } = await supabase
      .from("knowledge_base_questions")
      .update({
        is_approved: true,
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json(updatedQuestion)
  } catch (error) {
    console.error("Error in POST /api/knowledge-base/questions/[id]/approve:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
