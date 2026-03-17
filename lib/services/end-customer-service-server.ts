import { createClient } from "@/lib/supabase/server"
import type { Tables } from "@/types/supabase"

export type EndCustomer = Tables<"end_customers"> & {
  countries?: {
    name: string
    code: string
  } | null
  industries?: {
    name: string
    description?: string
  } | null
}

export type EndCustomerInsert = Omit<Tables<"end_customers">, "id" | "created_at" | "updated_at">

// Obtener todos los clientes finales (server-side)
export async function getEndCustomers(): Promise<EndCustomer[]> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("end_customers")
      .select(`
        *,
        countries (
          name,
          code
        ),
        industries (
          name,
          description
        )
      `)
      .order("name")

    if (error) {
      console.error("Error fetching end customers:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Unexpected error fetching end customers:", error)
    return []
  }
}

// Obtener un cliente final por ID (server-side)
export async function getEndCustomerById(id: string): Promise<EndCustomer | null> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("end_customers")
      .select(`
        *,
        countries (
          name,
          code
        ),
        industries (
          name,
          description
        )
      `)
      .eq("id", id)
      .single()

    if (error) {
      console.error(`Error fetching end customer ${id}:`, error)
      return null
    }

    return data
  } catch (error) {
    console.error(`Unexpected error fetching end customer ${id}:`, error)
    return null
  }
}

// Crear un nuevo cliente final (server-side)
export async function createEndCustomer(customerData: EndCustomerInsert): Promise<EndCustomer | null> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase.from("end_customers").insert([customerData]).select("*").single()

    if (error) {
      console.error("Error creating end customer:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("Unexpected error creating end customer:", error)
    throw error
  }
}

// Actualizar un cliente final (server-side)
export async function updateEndCustomer(id: string, updates: Partial<EndCustomerInsert>): Promise<EndCustomer | null> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase.from("end_customers").update(updates).eq("id", id).select("*").single()

    if (error) {
      console.error(`Error updating end customer ${id}:`, error)
      throw error
    }

    return data
  } catch (error) {
    console.error(`Unexpected error updating end customer ${id}:`, error)
    throw error
  }
}
