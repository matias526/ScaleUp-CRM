import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Verificar autenticación
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const questionId = formData.get("questionId") as string

    console.log("[v0] Upload attempt - questionId:", questionId, "file:", file?.name, "size:", file?.size)

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó archivo" }, { status: 400 })
    }

    // Validar tamaño (máx 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "El archivo excede el tamaño máximo de 10MB" }, { status: 400 })
    }

    // Generar nombre único
    const fileExt = file.name.split(".").pop()
    const fileName = `${uuidv4()}.${fileExt}`
    const filePath = `knowledge-base/${questionId}/${fileName}`

    console.log("[v0] Uploading to storage - path:", filePath)

    // Subir a Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("knowledge_base_files")
      .upload(filePath, file)

    if (uploadError) {
      console.error("[v0] Storage upload error:", {
        message: uploadError.message,
        name: uploadError.name,
        cause: uploadError.cause,
      })
      return NextResponse.json(
        {
          error: "Error al subir el archivo",
          details: uploadError.message,
          errorName: uploadError.name,
        },
        { status: 500 },
      )
    }

    console.log("[v0] File uploaded successfully:", uploadData)

    // Obtener URL pública
    const {
      data: { publicUrl },
    } = supabase.storage.from("knowledge_base_files").getPublicUrl(filePath)

    console.log("[v0] Public URL:", publicUrl)

    const attachmentData = {
      question_id: questionId,
      file_name: file.name,
      file_url: publicUrl,
      file_type: file.type,
      file_size: file.size,
      uploaded_by: session.user.id,
    }

    console.log("[v0] Inserting attachment metadata:", attachmentData)

    // Guardar metadata en la base de datos
    const { data: attachment, error: dbError } = await supabase
      .from("knowledge_base_attachments")
      .insert(attachmentData)
      .select()
      .single()

    if (dbError) {
      console.error("[v0] Database insert error:", {
        message: dbError.message,
        details: dbError.details,
        hint: dbError.hint,
        code: dbError.code,
      })
      return NextResponse.json(
        {
          error: "Error al guardar metadata del archivo",
          details: dbError.message,
          hint: dbError.hint,
          code: dbError.code,
          dbDetails: dbError.details,
        },
        { status: 500 },
      )
    }

    console.log("[v0] Attachment saved successfully:", attachment)

    return NextResponse.json(attachment)
  } catch (error) {
    console.error("[v0] Unexpected error in POST /api/knowledge-base/attachments:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
