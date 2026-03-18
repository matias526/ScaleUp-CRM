//import { createClient } from "@/lib/supabase/server"
import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { generateEmbedding } from "@/lib/embeddings"

export const maxDuration = 30

export async function POST(request: Request) {
  try {
    const supabase = createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { message_id, tech_company_id, positive_example } = await request.json()

    if (!message_id || !tech_company_id || !positive_example) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 })
    }

    // Obtener el mensaje original
    const { data: message, error: messageError } = await supabase
      .from("kb_messages")
      .select("content, conversation_id")
      .eq("id", message_id)
      .single()

    if (messageError || !message) {
      return NextResponse.json({ error: "Mensaje no encontrado" }, { status: 404 })
    }

    // Obtener la pregunta del usuario (mensaje anterior)
    const { data: messages } = await supabase
      .from("kb_messages")
      .select("content, role")
      .eq("conversation_id", message.conversation_id)
      .order("created_at", { ascending: false })
      .limit(2)

    const userQuery = messages?.find((m) => m.role === "user")?.content || "Consulta desconocida"

    // Generar embedding para la pregunta
    const embedding = await generateEmbedding(userQuery)

    // Guardar como ejemplo positivo
    const { error: insertError } = await supabase.from("kb_learning_examples").insert({
      tech_company_id: tech_company_id,
      user_id: user.id,
      conversation_id: message.conversation_id,
      user_query: userQuery,
      mika_response: message.content,
      user_correction: `✅ EJEMPLO POSITIVO: ${positive_example}`,
      query_embedding: embedding,
      is_positive: true,
    })

    if (insertError) {
      console.error("[v0] Error saving positive example:", insertError)
      return NextResponse.json({ error: "Error al guardar ejemplo" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Error in teach-positive:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
