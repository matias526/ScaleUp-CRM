import { createGroq } from "@ai-sdk/groq"
import { generateText } from "ai"

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
})

export async function POST(req: Request) {
  try {
    const { texts, targetLanguage } = await req.json()

    console.log("[v0] Iniciando traducción a:", targetLanguage)
    console.log("[v0] Textos a traducir:", texts)

    // Validar que el API key esté configurado
    if (!process.env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY no está configurado en las variables de entorno")
    }

    const prompt = `Translate the following content to ${targetLanguage}. 
Keep ONLY the structure and placeholders intact - do not modify anything inside __PULSEVAR_* or __PULSEFMT_* markers.

Content:
- display_name: "${texts.display_name}"
- subject: "${texts.subject}"
- body_content: "${texts.body_content}"

Respond ONLY with valid JSON in this exact format:
{
  "display_name": "translated display name",
  "subject": "translated subject",
  "body_content": "translated body content"
}`

    console.log("[v0] Prompt enviado a Groq:", prompt)

    const { text } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      prompt,
      temperature: 0.3,
    })

    console.log("[v0] Respuesta de Groq:", text)

    if (!text) {
      throw new Error("Respuesta vacía de Groq")
    }

    // Parsear la respuesta JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error(`Invalid JSON response from Groq. Response: ${text}`)
    }

    const translations = JSON.parse(jsonMatch[0])
    console.log("[v0] Traducciones parseadas:", translations)

    return Response.json({
      translations,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error)
    console.error("[v0] Error en traducción:", errorMessage)

    return Response.json(
      {
        error: errorMessage,
      },
      { status: 500 },
    )
  }
}

// Last updated: 2026-04-20T15:20:00Z
// Updated to AI SDK v5/v6 standard syntax
