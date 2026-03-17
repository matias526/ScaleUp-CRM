import { createClient } from "@/lib/supabase/client"
import type { Tables } from "@/types/supabase"

export type Industry = Tables<"industries">

export type IndustryInsert = {
  name: string
  description?: string | null
  is_active?: boolean
  display_order?: number
}

// Obtener todas las industrias activas
export async function getIndustries(): Promise<Industry[]> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("industries")
      .select("*")
      .eq("is_active", true)
      .order("display_order")
      .order("name")

    if (error) {
      console.error("Error fetching industries:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Unexpected error fetching industries:", error)
    return []
  }
}
