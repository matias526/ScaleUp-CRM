import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params

    const { data: document, error } = await supabase
      .from("kb_documents")
      .select(
        `
        id,
        status,
        error_message,
        total_chunks,
        processed_at,
        created_at
      `,
      )
      .eq("id", id)
      .single()

    if (error || !document) {
      return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 })
    }

    // Get chunk count
    const { count: chunkCount } = await supabase
      .from("kb_document_chunks")
      .select("*", { count: "exact", head: true })
      .eq("document_id", id)

    return NextResponse.json({
      status: document.status,
      error_message: document.error_message,
      total_chunks: document.total_chunks || 0,
      chunks_in_db: chunkCount || 0,
      processed_at: document.processed_at,
      created_at: document.created_at,
    })
  } catch (error: any) {
    console.error("[v0] Error checking document status:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
