import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const documentId = params.id
    console.log("[v0] Fetching chunks for document:", documentId)

    const supabase = await createServerClient()

    // Get document info
    const { data: document, error: docError } = await supabase
      .from("kb_documents")
      .select("*")
      .eq("id", documentId)
      .single()

    if (docError) {
      console.error("[v0] Error fetching document:", docError)
      return NextResponse.json({ error: "Document not found", details: docError.message }, { status: 404 })
    }

    console.log("[v0] Document found:", {
      id: document.id,
      status: document.status,
      file_name: document.file_name,
    })

    // Get chunks for this document
    const { data: chunks, error: chunksError } = await supabase
      .from("kb_document_chunks")
      .select("*")
      .eq("document_id", documentId)
      .order("chunk_index", { ascending: true })

    if (chunksError) {
      console.error("[v0] Error fetching chunks:", chunksError)
      return NextResponse.json({ error: "Error fetching chunks", details: chunksError.message }, { status: 500 })
    }

    console.log("[v0] Chunks found:", chunks?.length || 0)

    // Test if match_kb_chunks function exists
    let functionExists = false
    let functionError = null
    try {
      const { error: rpcError } = await supabase.rpc("match_kb_chunks", {
        query_embedding: JSON.stringify(Array(1536).fill(0)),
        match_threshold: 0.7,
        match_count: 1,
        tech_company_filter: null,
      })
      functionExists = !rpcError
      functionError = rpcError?.message
    } catch (e: any) {
      functionError = e.message
    }

    return NextResponse.json({
      document: {
        id: document.id,
        file_name: document.file_name,
        status: document.status,
        tech_company_id: document.tech_company_id,
        created_at: document.created_at,
      },
      chunks: chunks?.map((chunk) => ({
        id: chunk.id,
        chunk_index: chunk.chunk_index,
        content: chunk.chunk_text,
        content_length: chunk.chunk_text?.length || 0,
        has_embedding: !!chunk.embedding,
        embedding_dimensions: chunk.embedding ? JSON.parse(chunk.embedding).length : 0,
      })),
      totalChunks: chunks?.length || 0,
      matchFunctionExists: functionExists,
      matchFunctionError: functionError,
    })
  } catch (error: any) {
    console.error("[v0] Error in chunks endpoint:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}
