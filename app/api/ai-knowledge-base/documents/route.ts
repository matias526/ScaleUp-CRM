import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const maxDuration = 60

export async function GET(request: Request) {
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
      .select("role_id, tech_company_id, roles:role_id(code)")
      .eq("id", user.id)
      .single()

    const isAdmin = userData?.roles?.code === "Admin"

    let query = supabase
      .from("kb_documents")
      .select(
        `
        *,
        tech_companies:tech_company_id(id, name),
        users:uploaded_by(id, first_name, last_name, email),
        total_chunks:kb_chunks(count)
      `,
        { count: "exact" },
      )
      .order("created_at", { ascending: false })

    if (!isAdmin) {
      query = query.eq("tech_company_id", userData?.tech_company_id)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching documents:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const documentsWithChunks = (data || []).map((doc) => ({
      ...doc,
      total_chunks: Array.isArray(doc.total_chunks) ? doc.total_chunks.length : 0,
    }))

    return NextResponse.json(documentsWithChunks)
  } catch (error: any) {
    console.error("Error in GET /api/ai-knowledge-base/documents:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
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
      return NextResponse.json({ error: "Solo Admin puede subir documentos" }, { status: 403 })
    }

    const { blobUrl, filename, fileSize, mimeType, techCompanyId } = await request.json()

    console.log("[v0] Received document registration request:", {
      filename,
      blobUrl,
      blobUrlLength: blobUrl?.length,
      fileSize,
      mimeType,
      techCompanyId,
    })

    if (!blobUrl || !filename || !techCompanyId) {
      console.error("[v0] Missing required fields:", {
        blobUrl: !!blobUrl,
        filename: !!filename,
        techCompanyId: !!techCompanyId,
      })
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 })
    }

    if (!blobUrl.startsWith("https://") || !blobUrl.includes("blob.vercel-storage.com")) {
      console.error("[v0] Invalid Blob URL format:", blobUrl)
      return NextResponse.json({ error: "URL de Blob inválida" }, { status: 400 })
    }

    const { data: insertData, error: insertError } = await supabase
      .from("kb_documents")
      .insert({
        filename,
        file_path: blobUrl,
        file_size: fileSize,
        mime_type: mimeType,
        tech_company_id: techCompanyId,
        uploaded_by: user.id,
        status: "pending",
      })
      .select("id")
      .single()

    if (insertError) {
      console.error("[v0] Error inserting document:", insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    const { data: completeDoc, error: fetchError } = await supabase
      .from("kb_documents")
      .select(
        `
        *,
        tech_companies:tech_company_id(id, name),
        users:uploaded_by(id, first_name, last_name, email)
      `,
      )
      .eq("id", insertData.id)
      .single()

    if (fetchError) {
      console.error("[v0] Error fetching complete document:", fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    console.log("[v0] Document registered successfully with tech_company_id:", completeDoc.tech_company_id)

    return NextResponse.json(completeDoc)
  } catch (error: any) {
    console.error("[v0] Error in POST /api/ai-knowledge-base/documents:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
