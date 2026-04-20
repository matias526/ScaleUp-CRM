import { createGroq } from "@ai-sdk/groq"
import { generateText } from "ai"

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
})

export async function POST(req: Request) {
  try {
    const { texts, targetLanguage } = await req.json()

    console.log("[v0] Traduciendo a", targetLanguage)
    console.log("[v0] Textos a traducir:", texts)

    const prompt = `Translate the following content to ${targetLanguage}. 
Keep ONLY the structure and placeholders intact - do not modify anything inside __VAR_* or __FORMAT_* markers.

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

    const { text } = await generateText({
      model: groq("mixtral-8x7b-32768"),
      prompt,
      temperature: 0.3,
    })

    console.log("[v0] Respuesta de Groq:", text)

    // Parsear la respuesta JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("Invalid JSON response from Groq")
    }

    const translations = JSON.parse(jsonMatch[0])

    return Response.json({
      translations,
    })
  } catch (error) {
    console.error("[v0] Error en traducción:", error)
    // Retornar JSON válido incluso en error para que el frontend no se quede colgado
    return Response.json(
      {
        translations: {
          display_name: "",
          subject: "",
          body_content: "",
        },
        error: error instanceof Error ? error.message : "Translation error",
      },
      { status: 500 },
    )
  }
}
