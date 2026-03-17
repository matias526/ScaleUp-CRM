import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

export async function getEndCustomersForPartner(partnerId: string): Promise<any[]> {
  try {
    if (!partnerId) {
      console.log("No se proporcionó ID de partner")
      return []
    }

    console.log(`Obteniendo clientes finales para el partner: ${partnerId}`)

    // Obtener los IDs de clientes finales que tienen oportunidades con este partner
    const { data: opportunitiesData, error: opportunitiesError } = await supabase
      .from("opportunities")
      .select("end_customer_id")
      .eq("partner_id", partnerId)
      .not("end_customer_id", "is", null)

    if (opportunitiesError) {
      console.error("Error al obtener oportunidades del partner:", opportunitiesError)
      return []
    }

    if (!opportunitiesData || opportunitiesData.length === 0) {
      console.log(`No se encontraron oportunidades para el partner ${partnerId}`)
      return []
    }

    // Extraer los IDs únicos de clientes finales
    const endCustomerIds = [...new Set(opportunitiesData.map((opp) => opp.end_customer_id).filter(Boolean))]
    console.log(`IDs de clientes finales encontrados: ${endCustomerIds.length}`)

    if (endCustomerIds.length === 0) {
      return []
    }

    // Obtener los detalles de los clientes finales
    const { data: endCustomersData, error: endCustomersError } = await supabase
      .from("end_customers")
      .select("*")
      .in("id", endCustomerIds)
      .order("name", { ascending: true })

    if (endCustomersError) {
      console.error("Error al obtener detalles de clientes finales:", endCustomersError)
      return []
    }

    console.log(`Se obtuvieron ${endCustomersData?.length || 0} clientes finales para el partner`)
    return endCustomersData || []
  } catch (error) {
    console.error("Error inesperado al obtener clientes finales del partner:", error)
    return []
  }
}

// Obtener todos los clientes finales (para usuarios ScaleUp)
export async function getEndCustomers() {
  const { data, error } = await supabase
    .from("end_customers")
    .select(`
      *,
      countries (
        name,
        code
      ),
      industries (
        name
      )
    `)
    .order("name")

  if (error) {
    console.error("Error fetching end customers:", error)
    throw error
  }

  return data || []
}

// Eliminar un cliente final (client-side)
export async function deleteEndCustomer(id: string): Promise<void> {
  const { error } = await supabase.from("end_customers").delete().eq("id", id)

  if (error) {
    console.error(`Error deleting end customer ${id}:`, error)
    throw new Error(`Error al eliminar: ${error.message}`)
  }
}

// Buscar clientes finales (client-side)
export async function searchEndCustomers(searchTerm: string) {
  try {
    console.log(`Buscando clientes finales con query: "${searchTerm}"`)

    const { data, error } = await supabase
      .from("end_customers")
      .select(`
        *,
        countries (
          name,
          code
        ),
        industries (
          name
        )
      `)
      .ilike("name", `%${searchTerm}%`)
      .order("name", { ascending: true })
      .limit(20) // Limitar a 20 resultados para mejor rendimiento

    if (error) {
      console.error("Error searching end customers:", error)
      throw error
    }

    console.log(`Se encontraron ${data?.length || 0} clientes finales`)
    return data || []
  } catch (error) {
    console.error("Error in searchEndCustomers:", error)
    throw error
  }
}

// Crear un nuevo cliente final
export async function createEndCustomer(endCustomerData: any) {
  const { data, error } = await supabase.from("end_customers").insert([endCustomerData]).select().single()

  if (error) {
    console.error("Error creating end customer:", error)
    throw error
  }

  return data
}
