// Crear un nuevo archivo para la versión cliente del servicio de partners
"use client"

import { supabase } from "@/lib/supabase/client"
import type { Partner } from "./partner-service"

// Versión cliente de las funciones principales del servicio de partners
export const getPartnersClient = async (
  page = 1,
  pageSize = 10,
  userInfo?: { id: string; roleCode?: string },
): Promise<{ data: Partner[]; total: number }> => {
  try {
    // Calcular el rango para la paginación
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    // Verificar si el usuario es un BDD
    const isBDD = userInfo?.roleCode === "bdd"

    let query

    if (isBDD && userInfo?.id) {
      console.log("Filtrando partners para BDD con ID:", userInfo.id)

      // Para BDD, solo mostrar partners donde es scaleup_manager_id en alguna relación
      query = supabase
        .from("partners")
        .select("id, name, code, logo_url, website, city, is_active")
        .in("id", supabase.from("partner_tech_companies").select("partner_id").eq("scaleup_manager_id", userInfo.id))
        .order("name")
        .range(from, to)

      // Consulta para obtener el total de registros filtrados
      const countQuery = supabase
        .from("partners")
        .select("id", { count: "exact", head: true })
        .in("id", supabase.from("partner_tech_companies").select("partner_id").eq("scaleup_manager_id", userInfo.id))

      // Ejecutar ambas consultas en paralelo
      const [countResult, dataResult] = await Promise.all([countQuery, query])

      if (countResult.error) {
        console.error("Error al obtener el conteo de partners para BDD:", countResult.error)
        return { data: [], total: 0 }
      }

      if (dataResult.error) {
        console.error("Error al obtener partners para BDD:", dataResult.error)
        return { data: [], total: 0 }
      }

      return {
        data: dataResult.data || [],
        total: countResult.count || 0,
      }
    } else {
      // Para admin u otros roles, mostrar todos los partners (comportamiento original)
      // Consulta para obtener el total de registros (optimizada)
      const countQuery = supabase.from("partners").select("id", { count: "exact", head: true })

      // Consulta para obtener los datos paginados (optimizada)
      query = supabase
        .from("partners")
        .select("id, name, code, logo_url, website, city, is_active") // Solo seleccionar los campos necesarios
        .order("name")
        .range(from, to)

      // Ejecutar ambas consultas en paralelo
      const [countResult, dataResult] = await Promise.all([countQuery, query])

      if (countResult.error) {
        console.error("Error al obtener el conteo de partners:", countResult.error)
        return { data: [], total: 0 }
      }

      if (dataResult.error) {
        console.error("Error al obtener partners:", dataResult.error)
        return { data: [], total: 0 }
      }

      return {
        data: dataResult.data || [],
        total: countResult.count || 0,
      }
    }
  } catch (error) {
    console.error("Error inesperado al obtener partners:", error)
    return { data: [], total: 0 }
  }
}

export const searchPartnersClient = async (
  searchTerm: string,
  userInfo?: { id: string; roleCode?: string },
): Promise<Partner[]> => {
  try {
    const term = searchTerm.toLowerCase().trim()
    const isBDD = userInfo?.roleCode === "bdd"

    if (!term && isBDD && userInfo?.id) {
      // Si no hay término de búsqueda pero es un BDD, devolver sus partners asignados
      const { data } = await getPartnersClient(1, 10, userInfo)
      return data
    } else if (!term) {
      // Si no hay término de búsqueda y no es BDD, comportamiento normal
      const { data } = await getPartnersClient(1, 10)
      return data
    }

    let query

    if (isBDD && userInfo?.id) {
      // Para BDD, filtrar por término de búsqueda y solo mostrar sus partners asignados
      query = supabase
        .from("partners")
        .select("id, name, code, logo_url, website, city, is_active")
        .or(`name.ilike.%${term}%,code.ilike.%${term}%,city.ilike.%${term}%`)
        .in("id", supabase.from("partner_tech_companies").select("partner_id").eq("scaleup_manager_id", userInfo.id))
        .order("name")
        .limit(10)
    } else {
      // Para admin u otros roles, comportamiento original
      query = supabase
        .from("partners")
        .select("id, name, code, logo_url, website, city, is_active")
        .or(`name.ilike.%${term}%,code.ilike.%${term}%,city.ilike.%${term}%`)
        .order("name")
        .limit(10)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error al buscar partners:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error inesperado al buscar partners:", error)
    return []
  }
}
