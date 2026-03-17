import { supabase } from "@/lib/supabaseClient"

// Función para obtener todos los países
export async function getCountries() {
  try {
    const { data, error } = await supabase.from("countries").select("*").order("name", { ascending: true })

    if (error) {
      console.error("Error al obtener países:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error inesperado al obtener países:", error)
    return []
  }
}
