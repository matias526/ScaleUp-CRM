import { createClient } from "@/lib/supabase/client"

export async function debugIndustries() {
  try {
    const supabase = createClient()

    console.log("🔍 Debugging industries...")

    // Query simple sin filtros
    const { data: allData, error: allError } = await supabase.from("industries").select("*")

    console.log("📊 All industries query result:", { data: allData, error: allError })

    // Query con filtro is_active
    const { data: activeData, error: activeError } = await supabase.from("industries").select("*").eq("is_active", true)

    console.log("✅ Active industries query result:", { data: activeData, error: activeError })

    return {
      all: allData || [],
      active: activeData || [],
      errors: { allError, activeError },
    }
  } catch (error) {
    console.error("💥 Debug error:", error)
    return { all: [], active: [], errors: { error } }
  }
}
