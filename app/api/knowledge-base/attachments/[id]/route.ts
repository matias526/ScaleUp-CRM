import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Verificar autenticación
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Obtener información del attachment
    const { data: attachment, error: fetchError } = await supabase
      .from("knowledge_base_attachments")
      .select("*")
      .eq("id", params.id)
      .single()

    if (fetchError || !attachment) {
      return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 })
    }

    // Extraer el path del archivo de la URL
    const urlParts = attachment.file_url.split("/")
    const filePath = urlParts.slice(urlParts.indexOf("knowledge-base")).join("/")

    // Eliminar de Supabase Storage
    const { error: storageError } = await supabase.storage.from("knowledge_base_files").remove([filePath])

    if (storageError) {
      console.error("Error deleting file from storage:", storageError)
    }

    // Eliminar de la base de datos
    const { error: dbError } = await supabase.from("knowledge_base_attachments").delete().eq("id", params.id)

    if (dbError) {
      return NextResponse.json({ error: "Error al eliminar el archivo" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in DELETE /api/knowledge-base/attachments/[id]:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
