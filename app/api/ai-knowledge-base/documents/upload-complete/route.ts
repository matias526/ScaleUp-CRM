//import { createClient } from "@/lib/supabase/server"
import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const supabase = createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { blobUrl, filename, fileSize, mimeType, techCompanyId } = await request.json()

    if (!blobUrl || !filename || !techCompanyId) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 })
    }

    const { data: document, error: dbError } = await supabase
      .from("kb_documents")
      .insert({
        filename,
        file_path: blobUrl,
        file_size: fileSize,
        mime_type: mimeType || "application/pdf",
        tech_company_id: techCompanyId,
        uploaded_by: user.id,
        status: "pending",
      })
      .select()
      .single()

    if (dbError) {
      console.error("[v0] Database error:", dbError)
      throw new Error("Error al guardar el documento en la base de datos")
    }

    return NextResponse.json(document)
  } catch (error: any) {
    console.error("[v0] Error completing upload:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
