import { put } from "@vercel/blob"
import { NextResponse } from "next/server"
//import { createClient } from "@/lib/supabase/server"
import { createServerClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const maxDuration = 60
export const bodyParser = {
  sizeLimit: "50mb",
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const supabase = createServerClient()
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
      return NextResponse.json({ error: "Solo Admin puede subir documentos" }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const techCompanyId = formData.get("techCompanyId") as string

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó archivo" }, { status: 400 })
    }

    console.log("[v0] Uploading file to Blob:", file.name, "size:", file.size, "type:", file.type)

    const blob = await put(`kb-documents/${Date.now()}-${file.name}`, file, {
      access: "public",
      addRandomSuffix: true,
    })

    console.log("[v0] File uploaded to Blob successfully:", blob.url)

    const { data: document, error: dbError } = await supabase
      .from("kb_documents")
      .insert({
        filename: file.name,
        file_path: blob.url,
        file_size: file.size,
        mime_type: file.type,
        tech_company_id: techCompanyId || null,
        uploaded_by: user.id,
        status: "pending",
      })
      .select(
        `
        *,
        tech_companies:tech_company_id(id, name),
        users:uploaded_by(id, first_name, last_name, email)
      `,
      )
      .single()

    if (dbError) {
      console.error("[v0] Database error:", dbError)
      throw new Error("Error al guardar en la base de datos: " + dbError.message)
    }

    console.log("[v0] Document saved with ID:", document.id)

    return NextResponse.json(document)
  } catch (error: any) {
    console.error("[v0] Error in upload handler:", error)
    return NextResponse.json({ error: error.message || "Error al subir el archivo" }, { status: 500 })
  }
}
