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

    const prompt = `You are a translation expert. Translate the following content to ${targetLanguage}.

CRITICAL RULES:
- Keep ONLY the structure and placeholders intact
- Do NOT modify anything inside __PULSEVAR_*, __PULSEFMT_*, or __PULSEBR_* markers
- Use [BR] to represent line breaks (NOT real newlines - always use literal [BR])
- Respond STRICTLY with valid JSON, no additional text
- Escape all special characters properly

Content to translate:
- display_name: "${texts.display_name}"
- subject: "${texts.subject}"
- body_content: "${texts.body_content}"

Respond with ONLY this JSON structure (no markdown, no extra text):
{"display_name":"translated name","subject":"translated subject","body_content":"translated content"}`

    console.log("[v0] Prompt enviado a Groq")

    const { text } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      prompt,
      temperature: 0.2,
    })

    if (!text) {
      throw new Error("Respuesta vacía de Groq")
    }

    console.log("[v0] Respuesta bruta de Groq:", text.substring(0, 200))

    // Limpiar y trimear la respuesta
    let cleanedText = text.trim()

    // Remover markdown code blocks si existen
    cleanedText = cleanedText.replace(/```json\n?/g, "").replace(/```\n?/g, "")

    // Extraer el JSON (por si hay texto adicional)
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error(`No valid JSON found in response: ${cleanedText.substring(0, 300)}`)
    }

    const jsonString = jsonMatch[0].trim()

    // Parsear el JSON
    let translations
    try {
      translations = JSON.parse(jsonString)
    } catch (parseError) {
      console.error("[v0] Error parseando JSON:", jsonString)
      throw new Error(`Invalid JSON format: ${parseError instanceof Error ? parseError.message : "Unknown error"}`)
    }

    console.log("[v0] Traducciones parseadas exitosamente")

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
