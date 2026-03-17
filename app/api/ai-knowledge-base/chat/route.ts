import { createClient } from "@/lib/supabase/server"
import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"
import { generateEmbedding, generateJinaEmbedding } from "@/lib/embeddings"
import { SCALEUP_CONTEXT } from "@/lib/scaleup-context"
import { randomUUID } from "crypto"

export const maxDuration = 60

function detectLearnCommand(message: string): { isCommand: boolean; content: string } {
  const learnPatterns = [
    /^\*\*\*aprender\*\*\*\s*(.+)/is,
    /^\*\*\*aprende\*\*\*\s*(.+)/is,
    /^\*\*\*learn\*\*\*\s*(.+)/is,
  ]

  for (const pattern of learnPatterns) {
    const match = message.match(pattern)
    if (match) {
      return { isCommand: true, content: match[1].trim() }
    }
  }

  return { isCommand: false, content: "" }
}

async function findRelevantLearningExamples(
  supabase: any,
  query: string,
  techCompanyId: string,
): Promise<Array<{ user_query: string; user_correction: string }>> {
  try {
    const embedding = await generateEmbedding(query)

    const { data, error } = await supabase.rpc("match_learning_examples", {
      query_embedding: `[${embedding.join(",")}]`,
      match_threshold: 0.7,
      match_count: 5,
      tech_company_filter: techCompanyId,
    })

    if (error) {
      console.error("[v0] Error finding learning examples:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("[v0] Error in findRelevantLearningExamples:", error)
    return []
  }
}

async function findRelevantChunks(supabase: any, techCompanyId: string, query: string, limit = 5) {
  const embedding = await generateEmbedding(query)
  const vectorString = `[${embedding.join(",")}]`

  const { data: chunks, error } = await supabase.rpc("match_kb_chunks", {
    query_embedding: vectorString,
    match_threshold: 0.5,
    match_count: limit,
    tech_company_filter: techCompanyId,
  })

  if (error) {
    console.error("[v0] Error finding relevant chunks:", error)
    return []
  }

  return chunks || []
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const supabaseAdmin = createServiceRoleClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { message, tech_company_id, conversation_id, previous_messages = [] } = await request.json()

    if (!message || !tech_company_id) {
      return NextResponse.json({ error: "Mensaje y tecnología son requeridos" }, { status: 400 })
    }

    const learnCommand = detectLearnCommand(message)

    if (learnCommand.isCommand) {
      console.log("🎓 [LEARN COMMAND] Detected learning command")
      console.log("📝 [LEARN COMMAND] Content to learn:", learnCommand.content)

      try {
        const embedding = await generateJinaEmbedding(learnCommand.content)
        console.log("🔢 [LEARN COMMAND] Generated embedding with dimensions:", embedding.length)

        const { data: insertData, error: insertError } = await supabaseAdmin
          .from("kb_learning_examples")
          .insert({
            tech_company_id: tech_company_id,
            user_id: user.id,
            conversation_id: conversation_id || randomUUID(),
            user_query: message,
            mika_response: "",
            user_correction: learnCommand.content,
            query_embedding: embedding,
          })
          .select()
          .single()

        if (insertError) {
          console.error("❌ [v0] Error saving learning example:", insertError.message, insertError.details)
          return NextResponse.json({
            response: `Entendido, pero hubo un error al guardar el aprendizaje: ${insertError.message}. Por favor verifica los logs del servidor.`,
            learningStatus: "error",
            error: insertError.message,
          })
        }

        console.log("✅ [v0] Learning example saved successfully!")
        return NextResponse.json({
          response: `✅ He guardado este aprendizaje correctamente. De ahora en adelante, aplicaré esta información en consultas similares.`,
          learningStatus: "saved",
          savedId: insertData?.id,
        })
      } catch (error) {
        console.error("❌ [v0] Exception saving learning:", error)
        return NextResponse.json({
          response: "Hubo un error al procesar el comando de aprendizaje.",
          learningStatus: "error",
        })
      }
    }

    const { data: techCompany, error: companyError } = await supabase
      .from("tech_companies")
      .select("name")
      .eq("id", tech_company_id)
      .single()

    if (companyError) {
      console.error("[v0] Error fetching tech company:", companyError)
    }

    let currentConversationId = conversation_id

    if (!currentConversationId) {
      const { data: newConversation, error: convError } = await supabase
        .from("kb_conversations")
        .insert({
          user_id: user.id,
          tech_company_id: tech_company_id,
          title: message.substring(0, 50),
        })
        .select()
        .single()

      if (convError) {
        console.error("[v0] Error creating conversation:", convError)
        throw new Error(`Error al crear conversación: ${convError.message}`)
      }

      currentConversationId = newConversation.id
    }

    const { error: userMessageError } = await supabase.from("kb_messages").insert({
      conversation_id: currentConversationId,
      role: "user",
      content: message,
    })

    if (userMessageError) {
      console.error("[v0] Error saving user message:", userMessageError)
      throw new Error(`Error al guardar mensaje de usuario: ${userMessageError.message}`)
    }

    const learningExamples = await findRelevantLearningExamples(supabase, message, tech_company_id)
    const relevantChunks = await findRelevantChunks(supabase, tech_company_id, message, 10)

    const context = relevantChunks.map((chunk: any) => chunk.chunk_text).join("\n\n")
    const companyName = techCompany?.name || "esta tecnología"

    let learningContext = ""
    if (learningExamples.length > 0) {
      learningContext = "\n\n## CONOCIMIENTO APRENDIDO:\n\n"
      learningExamples.forEach((example, index) => {
        learningContext += `${index + 1}. ${example.user_correction}\n\n`
      })
      learningContext +=
        "IMPORTANTE: Este conocimiento fue proporcionado por usuarios de ScaleUp y debe ser aplicado en tus respuestas.\n\n"
    }

    const systemPrompt = `${SCALEUP_CONTEXT}

---

Estás ayudando con consultas sobre ${companyName}.

${learningContext}${context ? `DOCUMENTACIÓN TÉCNICA RELEVANTE:\n${context}\n\n` : "No hay documentación técnica específica disponible para esta consulta.\n\n"}Recuerda aplicar la metodología y criterios de ScaleUp al responder sobre ${companyName}.`

    const groqApiKey = process.env.API_KEY_GROQ_API_KEY || process.env.GROQ_API_KEY
    if (!groqApiKey) {
      throw new Error("GROQ_API_KEY not configured")
    }

    const conversationMessages = []
    const recentMessages = previous_messages.slice(-10)

    recentMessages.forEach((msg: any) => {
      conversationMessages.push({
        role: msg.role,
        content: msg.content,
      })
    })

    conversationMessages.push({
      role: "user",
      content: message,
    })

    const chatResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "system", content: systemPrompt }, ...conversationMessages],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    })

    if (!chatResponse.ok) {
      const errorData = await chatResponse.text()
      console.error("[v0] Groq API error:", errorData)
      throw new Error(`Groq API error: ${errorData}`)
    }

    const chatData = await chatResponse.json()
    const text = chatData.choices[0].message.content

    const sources = relevantChunks.map((chunk: any) => ({
      filename: chunk.filename,
      chunk_text: chunk.chunk_text.substring(0, 200),
    }))

    const { data: assistantMessage, error: assistantMessageError } = await supabase
      .from("kb_messages")
      .insert({
        conversation_id: currentConversationId,
        role: "assistant",
        content: text,
        sources: sources,
      })
      .select()
      .single()

    if (assistantMessageError) {
      console.error("[v0] Error saving assistant message:", assistantMessageError)
      throw new Error(`Error al guardar respuesta: ${assistantMessageError.message}`)
    }

    return NextResponse.json({
      response: text,
      sources: sources,
      conversation_id: currentConversationId,
      message_id: assistantMessage.id,
      learningExamplesUsed: learningExamples.length,
    })
  } catch (error: any) {
    console.error("[v0] Error in chat:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
