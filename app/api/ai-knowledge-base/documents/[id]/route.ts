import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { del } from "@vercel/blob"

export const dynamic = "force-dynamic"

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from("users")
      .select("role_id, roles:role_id(code)")
      .eq("id", user.id)
      .single()

    if (userData?.roles?.code !== "Admin") {
      return NextResponse.json({ error: "Solo Admin puede eliminar documentos" }, { status: 403 })
    }

    const { data: document } = await supabase.from("kb_documents").select("file_path").eq("id", params.id).single()

    if (!document) {
      return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 })
    }

    try {
      await del(document.file_path)
      console.log("[v0] File deleted from Blob:", document.file_path)
    } catch (error) {
      console.error("[v0] Error deleting from Blob:", error)
      // Continuamos aunque falle la eliminación del blob
    }

    await supabase.from("kb_document_chunks").delete().eq("document_id", params.id)

    const { error: deleteError } = await supabase.from("kb_documents").delete().eq("id", params.id)

    if (deleteError) {
      console.error("[v0] Error deleting document:", deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Error in DELETE /api/ai-knowledge-base/documents:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
