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
