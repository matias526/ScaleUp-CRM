import { createClient } from "@/lib/supabase/client"
import type { Tables } from "@/types/supabase"

export type EndCustomer = Tables<"end_customers"> & {
  countries?: {
    name: string
    code: string
  } | null
  industries?: {
    name: string
  } | null
  country_name?: string | null
  country_code?: string | null
  industry_name?: string | null
}

export type EndCustomerInsert = {
  name: string
  industry_id?: string | null
  website?: string | null
  country_id?: string | null
  city?: string | null
  primary_contact_name?: string | null
  primary_contact_email?: string | null
  primary_contact_phone?: string | null
  tax_id?: string | null
}

// Función simple para obtener todos los clientes finales (para el formulario de oportunidades)
export async function getEndCustomers(): Promise<EndCustomer[]> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("end_customers")
      .select(`
        id,
        name,
        website,
        city,
        tax_id,
        industry_id,
        country_id,
        primary_contact_name,
        primary_contact_email,
        primary_contact_phone,
        created_at,
        updated_at,
        industries:industry_id (
          name
        ),
        countries:country_id (
          name,
          code
        )
      `)
      .order("name")

    if (error) {
      console.error("Error fetching end customers:", error)
      return []
    }

    return (data || []).map((customer) => ({
      ...customer,
      industry_name: customer.industries?.name || null,
      country_name: customer.countries?.name || null,
      country_code: customer.countries?.code || null,
    }))
  } catch (error) {
    console.error("Unexpected error fetching end customers:", error)
    return []
  }
}

// Función con paginación para la tabla
export async function getEndCustomersPaginated(
  page = 1,
  pageSize = 50,
): Promise<{ data: EndCustomer[]; total: number }> {
  try {
    const supabase = createClient()

    // Primero obtener el conteo total
    const { count, error: countError } = await supabase
      .from("end_customers")
      .select("*", { count: "exact", head: true })

    if (countError) {
      console.error("Error al obtener conteo:", countError)
      return { data: [], total: 0 }
    }

    // Luego obtener los datos con paginación
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data, error } = await supabase
      .from("end_customers")
      .select(`
        id,
        name,
        website,
        city,
        tax_id,
        industry_id,
        country_id,
        primary_contact_name,
        primary_contact_email,
        primary_contact_phone,
        created_at,
        updated_at,
        industries:industry_id (
          name
        ),
        countries:country_id (
          name,
          code
        )
      `)
      .range(from, to)
      .order("name")

    if (error) {
      console.error("Error al obtener clientes finales:", error)
      return { data: [], total: count || 0 }
    }

    // Formatear los datos
    const formattedData = (data || []).map((customer) => ({
      ...customer,
      country_name: customer.countries?.name || null,
      country_code: customer.countries?.code || null,
      industry_name: customer.industries?.name || null,
    }))

    return {
      data: formattedData,
      total: count || 0,
    }
  } catch (error) {
    console.error("Error inesperado:", error)
    return { data: [], total: 0 }
  }
}

// Obtener un cliente final por ID
export async function getEndCustomerById(id: string): Promise<EndCustomer | null> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("end_customers")
      .select(`
        id,
        name,
        website,
        city,
        tax_id,
        industry_id,
        country_id,
        primary_contact_name,
        primary_contact_email,
        primary_contact_phone,
        created_at,
        updated_at,
        industries:industry_id (
          name
        ),
        countries:country_id (
          name,
          code
        )
      `)
      .eq("id", id)
      .single()

    if (error) {
      console.error(`Error al obtener cliente final ${id}:`, error)
      return null
    }

    return {
      ...data,
      country_name: data.countries?.name || null,
      country_code: data.countries?.code || null,
      industry_name: data.industries?.name || null,
    }
  } catch (error) {
    console.error(`Error inesperado al obtener cliente ${id}:`, error)
    return null
  }
}

// Crear un nuevo cliente final
export async function createEndCustomer(customer: EndCustomerInsert): Promise<EndCustomer | null> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase.from("end_customers").insert([customer]).select("*").single()

    if (error) {
      console.error("Error al crear cliente final:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("Error inesperado al crear cliente final:", error)
    throw error
  }
}

// Actualizar un cliente final existente
export async function updateEndCustomer(id: string, updates: Partial<EndCustomerInsert>): Promise<EndCustomer | null> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase.from("end_customers").update(updates).eq("id", id).select("*").single()

    if (error) {
      console.error(`Error al actualizar cliente final ${id}:`, error)
      throw error
    }

    return data
  } catch (error) {
    console.error(`Error inesperado al actualizar cliente ${id}:`, error)
    throw error
  }
}

// Eliminar un cliente final
export async function deleteEndCustomer(id: string): Promise<boolean> {
  try {
    const supabase = createClient()

    const { error } = await supabase.from("end_customers").delete().eq("id", id)

    if (error) {
      console.error(`Error al eliminar cliente final ${id}:`, error)
      throw new Error(`Error al eliminar: ${error.message}`)
    }

    return true
  } catch (error) {
    console.error(`Error inesperado al eliminar cliente ${id}:`, error)
    throw error
  }
}

// Buscar clientes finales
export async function searchEndCustomers(searchTerm: string): Promise<EndCustomer[]> {
  try {
    const supabase = createClient()
    const term = searchTerm.toLowerCase().trim()

    if (!term) {
      return await getEndCustomers()
    }

    const { data, error } = await supabase
      .from("end_customers")
      .select(`
        id,
        name,
        website,
        city,
        tax_id,
        industry_id,
        country_id,
        primary_contact_name,
        primary_contact_email,
        primary_contact_phone,
        created_at,
        updated_at,
        industries:industry_id (
          name
        ),
        countries:country_id (
          name,
          code
        )
      `)
      .or(`name.ilike.%${term}%,city.ilike.%${term}%`)
      .order("name")
      .limit(20)

    if (error) {
      console.error("Error al buscar clientes finales:", error)
      return []
    }

    return (data || []).map((customer) => ({
      ...customer,
      country_name: customer.countries?.name || null,
      country_code: customer.countries?.code || null,
      industry_name: customer.industries?.name || null,
    }))
  } catch (error) {
    console.error("Error inesperado al buscar clientes finales:", error)
    return []
  }
}
