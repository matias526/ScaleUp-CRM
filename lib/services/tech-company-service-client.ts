import { supabase } from "@/lib/supabase/client"

// Función para obtener todas las empresas tecnológicas activas (versión cliente)
export async function getActiveTechCompaniesClient(): Promise<Array<{ id: string; name: string }>> {
  try {
    console.log("[v0] Obteniendo tech companies activas")

    const { data, error } = await supabase
      .from("tech_companies")
      .select("id, name")
      .eq("is_active", true)
      .order("name")

    if (error) {
      console.error("[v0] Error al obtener tech companies activas:", error)
      throw new Error(`Error al obtener empresas tecnológicas: ${error.message}`)
    }

    console.log(`[v0] Se obtuvieron ${data?.length || 0} empresas tecnológicas activas`)
    return data || []
  } catch (error: any) {
    console.error("[v0] Excepción al obtener tech companies activas:", error)
    throw error
  }
}
