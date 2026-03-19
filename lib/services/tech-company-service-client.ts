import { supabase } from "@/lib/supabase/client"

// Función para obtener todas las empresas tecnológicas (versión cliente)
export async function getTechCompaniesClient(): Promise<any[]> {
  try {
    console.log("CLIENT: Iniciando getTechCompaniesClient")


    // Mostrar la consulta que se va a ejecutar
    const query = "supabase.from('tech_companies').select('id, name').order('name')"
    console.log("CLIENT QUERY:", query)

    // Ejecutar la consulta
    const { data, error } = await supabase.from("tech_companies").select("id, name").order("name")

    if (error) {
      console.error("CLIENT ERROR en getTechCompaniesClient:", error)
      throw new Error(`Error al obtener empresas tecnológicas: ${error.message}`)
    }

    console.log(`CLIENT: getTechCompaniesClient obtuvo ${data?.length || 0} registros`)
    console.log("Datos obtenidos:", data)

    return data || []
  } catch (error: any) {
    console.error("CLIENT EXCEPTION en getTechCompaniesClient:", error)
    throw new Error(`Excepción al obtener empresas tecnológicas: ${error.message}`)
  }
}

// Función para obtener una empresa tecnológica por su ID (versión cliente)
export async function getTechCompanyByIdClient(id: string): Promise<any | null> {
  try {

    const { data, error } = await supabase.from("tech_companies").select("*").eq("id", id).single()

    if (error) {
      console.error(`CLIENT ERROR en getTechCompanyByIdClient con ID ${id}:`, error)
      return null
    }

    return data
  } catch (error) {
    console.error(`CLIENT EXCEPTION en getTechCompanyByIdClient con ID ${id}:`, error)
    return null
  }
}
