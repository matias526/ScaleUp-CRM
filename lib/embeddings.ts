/**
 * Servicio de embeddings usando Jina AI
 * Modelo: jina-embeddings-v3 (1024 dimensiones)
 * Free tier: 1M tokens/mes
 */

const JINA_API_URL = "https://api.jina.ai/v1/embeddings"
const JINA_MODEL = "jina-embeddings-v3"

/**
 * Genera un embedding para un texto usando Jina AI
 * @param text - Texto a convertir en embedding
 * @returns Array de números (vector de 1024 dimensiones)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    throw new Error("El texto no puede estar vacío")
  }

  const jinaApiKey = process.env.JINA_API_KEY

  if (!jinaApiKey) {
    throw new Error(
      "JINA_API_KEY no está configurada. Por favor agrega tu API key de Jina AI en las variables de entorno.",
    )
  }

  try {
    const response = await fetch(JINA_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jinaApiKey}`,
      },
      body: JSON.stringify({
        model: JINA_MODEL,
        input: [text],
        dimensions: 1024, // Compatible con schema actual
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`Jina AI API error: ${response.status} - ${errorData}`)
    }

    const data = await response.json()

    if (!data.data || !data.data[0] || !data.data[0].embedding) {
      throw new Error("Respuesta inválida de Jina AI")
    }

    return data.data[0].embedding
  } catch (error: any) {
    console.error("[v0] Error generando embedding con Jina AI:", error)
    throw new Error(`Error al generar embedding: ${error.message}`)
  }
}

/**
 * Genera embeddings para múltiples textos en batch
 * @param texts - Array de textos
 * @returns Array de embeddings
 */
export async function generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
  if (!texts || texts.length === 0) {
    return []
  }

  const jinaApiKey = process.env.JINA_API_KEY

  if (!jinaApiKey) {
    throw new Error("JINA_API_KEY no está configurada")
  }

  // Filtrar textos vacíos
  const validTexts = texts.filter((t) => t && t.trim().length > 0)

  if (validTexts.length === 0) {
    return []
  }

  try {
    // Jina AI soporta batch processing
    const response = await fetch(JINA_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jinaApiKey}`,
      },
      body: JSON.stringify({
        model: JINA_MODEL,
        input: validTexts,
        dimensions: 1024,
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`Jina AI API error: ${response.status} - ${errorData}`)
    }

    const data = await response.json()

    if (!data.data || !Array.isArray(data.data)) {
      throw new Error("Respuesta inválida de Jina AI")
    }

    return data.data.map((item: any) => item.embedding)
  } catch (error: any) {
    console.error("[v0] Error generando embeddings en batch con Jina AI:", error)
    throw new Error(`Error al generar embeddings en batch: ${error.message}`)
  }
}

export const generateJinaEmbedding = generateEmbedding
