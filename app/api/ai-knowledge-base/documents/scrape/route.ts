import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import * as cheerio from "cheerio"
import { generateEmbedding } from "@/lib/embeddings"

export const runtime = "nodejs"
export const maxDuration = 60

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { url, techCompanyId } = await request.json()

    if (!url || !techCompanyId) {
      return NextResponse.json({ error: "URL y tecnología son requeridos" }, { status: 400 })
    }

    // Validate URL
    let validUrl: URL
    try {
      validUrl = new URL(url)
      if (!["http:", "https:"].includes(validUrl.protocol)) {
        throw new Error("Solo se permiten URLs HTTP/HTTPS")
      }
    } catch (error) {
      return NextResponse.json({ error: "URL inválida" }, { status: 400 })
    }

    console.log("[v0] Scraping URL:", url)

    // Fetch the webpage
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; MikaBot/1.0)",
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`)
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // Remove script, style, and other non-content elements
    $("script, style, nav, footer, header, aside, iframe, noscript").remove()

    // Extract title
    const title = $("title").text().trim() || $("h1").first().text().trim() || validUrl.hostname

    // Extract main content
    let content = ""

    // Try to find main content area
    const mainSelectors = [
      "main",
      "article",
      '[role="main"]',
      ".content",
      "#content",
      ".post-content",
      ".entry-content",
    ]

    for (const selector of mainSelectors) {
      const mainContent = $(selector).text()
      if (mainContent && mainContent.length > content.length) {
        content = mainContent
      }
    }

    // If no main content found, get body text
    if (!content) {
      content = $("body").text()
    }

    // Clean up the text
    content = content
      .replace(/\s+/g, " ") // Replace multiple spaces with single space
      .replace(/\n+/g, "\n") // Replace multiple newlines with single newline
      .trim()

    if (!content || content.length < 100) {
      throw new Error("No se pudo extraer contenido suficiente de la URL")
    }

    console.log("[v0] Extracted content length:", content.length)

    // Create document record
    const { data: document, error: docError } = await supabase
      .from("kb_documents")
      .insert({
        filename: title,
        source_type: "url",
        source_url: url,
        file_path: url,
        file_size: content.length,
        mime_type: "text/html",
        tech_company_id: techCompanyId,
        uploaded_by: user.id,
        status: "processing",
      })
      .select()
      .single()

    if (docError) {
      console.error("[v0] Error creating document:", docError)
      throw new Error("Error al crear el documento: " + docError.message)
    }

    console.log("[v0] Document created:", document.id)

    // Process the content immediately
    try {
      // Split content into chunks (approximately 1000 characters each)
      const chunkSize = 1000
      const chunks: string[] = []

      for (let i = 0; i < content.length; i += chunkSize) {
        chunks.push(content.slice(i, i + chunkSize))
      }

      console.log("[v0] Created", chunks.length, "chunks")

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i]

        console.log("[v0] Processing chunk", i + 1, "of", chunks.length)

        // Generate embedding with Jina AI
        const embedding = await generateEmbedding(chunk)

        // Save chunk to database
        const { error: chunkError } = await supabase.from("kb_document_chunks").insert({
          document_id: document.id,
          chunk_text: chunk,
          chunk_index: i,
          embedding: `[${embedding.join(",")}]`,
          token_count: Math.ceil(chunk.length / 4),
        })

        if (chunkError) {
          throw new Error(`Failed to save chunk ${i + 1}: ${chunkError.message}`)
        }
      }

      // Update document status
      await supabase
        .from("kb_documents")
        .update({
          status: "completed",
          processed_at: new Date().toISOString(),
          total_chunks: chunks.length,
        })
        .eq("id", document.id)

      console.log("[v0] URL processing completed successfully")

      return NextResponse.json({
        success: true,
        documentId: document.id,
        chunksProcessed: chunks.length,
        message: "URL procesada exitosamente",
      })
    } catch (processingError: any) {
      console.error("[v0] Processing error:", processingError)

      // Update document with error
      await supabase
        .from("kb_documents")
        .update({
          status: "failed",
          error_message: processingError.message,
        })
        .eq("id", document.id)

      throw processingError
    }
  } catch (error: any) {
    console.error("[v0] Scraping error:", error)
    return NextResponse.json({ error: error.message || "Error al procesar la URL" }, { status: 500 })
  }
}
