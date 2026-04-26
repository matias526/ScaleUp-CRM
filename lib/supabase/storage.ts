import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

export async function uploadNewsImage(
  file: File,
  supabase: SupabaseClient<Database>,
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // Create unique filename
    const timestamp = Date.now()
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
    const filename = `news_${timestamp}_${originalName}`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage.from("news-images").upload(filename, file, {
      cacheControl: "3600",
      upsert: false,
    })

    if (error) {
      console.error("[v0] Supabase upload error:", error)
      return { success: false, error: error.message }
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("news-images").getPublicUrl(filename)

    return { success: true, url: publicUrl }
  } catch (error) {
    console.error("[v0] Error uploading to Supabase:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

// Función para subir attachments de mensajes y guardarlos en la BD
export async function uploadMessageAttachment(
  file: File,
  supabase: any,
): Promise<{ success: boolean; attachmentId?: string; url?: string; error?: string }> {
  try {
    console.log("[v0] Iniciando upload de attachment:", file.name)

    // Crear nombre único
    const timestamp = Date.now()
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
    const filename = `pulse_${timestamp}_${originalName}`
    const bucket = "pulse-message-attachments"

    // Subir a Supabase Storage
    const { data, error: uploadError } = await supabase.storage.from(bucket).upload(filename, file, {
      cacheControl: "3600",
      upsert: false,
    })

    if (uploadError) {
      console.error("[v0] Error al subir archivo:", uploadError)
      return { success: false, error: uploadError.message }
    }

    // Obtener URL pública
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filename)
    const publicUrl = urlData.publicUrl

    console.log("[v0] Archivo subido exitosamente:", filename, publicUrl)

    // Guardar registro en pulse_message_attachments
    const { data: attachmentData, error: dbError } = await (supabase
      .from("pulse_message_attachments")
      .insert({
        file_name: file.name,
        file_url: publicUrl,
        file_type: file.type || file.name.split(".").pop() || "unknown",
        file_size: file.size,
      })
      .select() as any)

    if (dbError) {
      console.error("[v0] Error al guardar attachment en BD:", dbError)
      return { success: false, error: dbError.message }
    }

    if (!attachmentData || attachmentData.length === 0) {
      console.error("[v0] No se obtuvo ID del attachment")
      return { success: false, error: "No attachment ID returned" }
    }

    const attachmentId = attachmentData[0].id
    console.log("[v0] Attachment guardado en BD:", attachmentId)

    return { success: true, attachmentId, url: publicUrl }
  } catch (error) {
    console.error("[v0] Error subiendo attachment:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

// Función para descargar attachment desde storage
export async function getMessageAttachmentUrl(
  attachmentId: string,
  supabase: any,
): Promise<{ success: boolean; url?: string; filename?: string; error?: string }> {
  try {
    console.log("[v0] Obteniendo URL para attachment:", attachmentId)

    // Obtener datos del attachment
    const { data: attachmentData, error: dbError } = await (supabase
      .from("pulse_message_attachments")
      .select("file_url, file_name")
      .eq("id", attachmentId)
      .single() as any)

    if (dbError || !attachmentData) {
      console.error("[v0] Error al obtener attachment de BD:", dbError)
      return { success: false, error: dbError?.message || "Attachment not found" }
    }

    console.log("[v0] Attachment encontrado:", attachmentData)

    return {
      success: true,
      url: attachmentData.file_url,
      filename: attachmentData.file_name,
    }
  } catch (error) {
    console.error("[v0] Error obteniendo attachment:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}
