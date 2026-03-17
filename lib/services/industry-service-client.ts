import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

export async function getIndustries() {
  const { data, error } = await supabase.from("industries").select("*").order("name")

  if (error) {
    console.error("Error fetching industries:", error)
    throw error
  }

  return data || []
}
