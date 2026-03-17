import { supabase } from "@/lib/supabase/client"
import { StorageService } from "./storage-service"

export interface Partner {
  id: string
  name: string
  code: string
  logo_url: string | null
  website: string | null
  address: string | null
  main_country_id: string | null
  main_country_name?: string | null
  city: string | null
  postal_code: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  countries?: { id: string; name: string; code: string }[]
}

export interface PartnerFormData {
  name: string
  logo?: File | string | null // Aceptar tanto File como string (URL)
  website?: string | null
  address?: string | null
  main_country_id?: string | null
  city?: string | null
  postal_code?: string | null
  is_active?: boolean
  country_ids?: string[]
}

export const PartnerService = {
  /**
   * Genera un código único a partir del nombre del partner
   * @param name Nombre del partner
   * @returns Código generado
   */
  generatePartnerCode(name: string): string {
    // Eliminar caracteres especiales, convertir a minúsculas y reemplazar espacios con guiones
    let code = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_]+/g, "-")
      .replace(/^-+|-+$/g, "")

    // Agregar un sufijo aleatorio para evitar duplicados
    const randomSuffix = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0")
    code = `${code}-${randomSuffix}`

    // Limitar la longitud del código
    if (code.length > 50) {
      code = code.substring(0, 46) + "-" + randomSuffix
    }

    return code
  },

  /**
   * Obtiene todos los partners con paginación para mejorar el rendimiento
   * @param page Número de página
   * @param pageSize Tamaño de página
   * @returns Lista de partners y total
   */
  async getPartners(
    page = 1,
    pageSize = 10,
    userInfo?: { id: string; roleCode?: string },
  ): Promise<{ data: Partner[]; total: number }> {
    try {
      // Calcular el rango para la paginación
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      // Log para depuración
      console.log("getPartners - userInfo:", userInfo)

      // Verificar si el usuario es un BDD
      const isBDD = userInfo?.roleCode?.toLowerCase() === "bdd"

      if (isBDD && userInfo?.id) {
        console.log("Filtrando partners para BDD con ID:", userInfo.id)

        try {
          // Primero obtenemos los IDs de los partners asignados al BDD
          const { data: partnerIds, error: partnerIdsError } = await supabase
            .from("partner_tech_companies")
            .select("partner_id")
            .eq("scaleup_manager_id", userInfo.id)
            .order("partner_id")

          if (partnerIdsError) {
            console.error("Error al obtener IDs de partners para BDD:", partnerIdsError)
            return { data: [], total: 0 }
          }

          // Si no hay partners asignados, devolvemos un array vacío
          if (!partnerIds || partnerIds.length === 0) {
            console.log("No hay partners asignados al BDD")
            return { data: [], total: 0 }
          }

          // Extraemos los IDs únicos
          const uniquePartnerIds = [...new Set(partnerIds.map((item) => item.partner_id))]
          console.log("Partners asignados al BDD:", uniquePartnerIds.length)

          // Ahora obtenemos los partners con esos IDs
          const { data: partnersData, error: partnersError } = await supabase
            .from("partners")
            .select("id, name, code, logo_url, website, city, is_active")
            .in("id", uniquePartnerIds)
            .order("name")
            .range(from, to)

          if (partnersError) {
            console.error("Error al obtener partners para BDD:", partnersError)
            return { data: [], total: 0 }
          }

          return {
            data: partnersData || [],
            total: uniquePartnerIds.length,
          }
        } catch (error) {
          console.error("Error en la consulta de partners para BDD:", error)
          return { data: [], total: 0 }
        }
      } else {
        // Para admin u otros roles, mostrar todos los partners (comportamiento original)
        // Consulta para obtener el total de registros (optimizada)
        const countQuery = supabase.from("partners").select("id", { count: "exact", head: true })

        // Consulta para obtener los datos paginados (optimizada)
        const dataQuery = supabase
          .from("partners")
          .select("id, name, code, logo_url, website, city, is_active") // Solo seleccionar los campos necesarios
          .order("name")
          .range(from, to)

        // Ejecutar ambas consultas en paralelo
        const [countResult, dataResult] = await Promise.all([countQuery, dataQuery])

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
  },

  /**
   * Busca partners por término de búsqueda
   * @param searchTerm Término de búsqueda
   * @returns Lista de partners que coinciden con la búsqueda
   */
  async searchPartners(searchTerm: string, userInfo?: { id: string; roleCode?: string }): Promise<Partner[]> {
    try {
      const term = searchTerm.toLowerCase().trim()
      const isBDD = userInfo?.roleCode?.toLowerCase() === "bdd"

      if (isBDD && userInfo?.id) {
        try {
          // Primero obtenemos los IDs de los partners asignados al BDD
          const { data: partnerIds, error: partnerIdsError } = await supabase
            .from("partner_tech_companies")
            .select("partner_id")
            .eq("scaleup_manager_id", userInfo.id)

          if (partnerIdsError) {
            console.error("Error al obtener IDs de partners para búsqueda BDD:", partnerIdsError)
            return []
          }

          // Si no hay partners asignados, devolvemos un array vacío
          if (!partnerIds || partnerIds.length === 0) {
            return []
          }

          // Extraemos los IDs únicos
          const uniquePartnerIds = [...new Set(partnerIds.map((item) => item.partner_id))]

          // Si no hay término de búsqueda, devolvemos todos los partners asignados
          if (!term) {
            const { data: partnersData, error: partnersError } = await supabase
              .from("partners")
              .select("id, name, code, logo_url, website, city, is_active")
              .in("id", uniquePartnerIds)
              .order("name")
              .limit(10)

            if (partnersError) {
              console.error("Error al obtener partners para búsqueda BDD:", partnersError)
              return []
            }

            return partnersData || []
          }

          // Si hay término de búsqueda, filtramos los partners asignados
          const { data: searchResults, error: searchError } = await supabase
            .from("partners")
            .select("id, name, code, logo_url, website, city, is_active")
            .in("id", uniquePartnerIds)
            .or(`name.ilike.%${term}%,code.ilike.%${term}%,city.ilike.%${term}%`)
            .order("name")
            .limit(10)

          if (searchError) {
            console.error("Error al buscar partners para BDD:", searchError)
            return []
          }

          return searchResults || []
        } catch (error) {
          console.error("Error en la búsqueda de partners para BDD:", error)
          return []
        }
      } else {
        // Para admin u otros roles, comportamiento original
        if (!term) {
          const { data } = await this.getPartners(1, 100)
          return data
        }

        const { data, error } = await supabase
          .from("partners")
          .select("id, name, code, logo_url, website, city, is_active")
          .or(`name.ilike.%${term}%,code.ilike.%${term}%,city.ilike.%${term}%`)
          .order("name")
          .limit(10)

        if (error) {
          console.error("Error al buscar partners:", error)
          return []
        }

        return data || []
      }
    } catch (error) {
      console.error("Error inesperado al buscar partners:", error)
      return []
    }
  },

  /**
   * Obtiene un partner por su ID
   * @param id ID del partner
   * @returns Partner o null si no existe
   */
  async getPartnerById(id: string): Promise<Partner | null> {
    try {
      // Verificar si el ID es válido
      if (!id || typeof id !== "string") {
        console.error("ID de partner inválido:", id)
        return null
      }

      // Consulta para obtener el partner con su país principal
      const { data, error } = await supabase
        .from("partners")
        .select(`
          id, name, code, logo_url, website, address, 
          main_country_id, city, postal_code, is_active, 
          created_at, updated_at,
          countries:main_country_id (name)
        `)
        .eq("id", id)
        .single()

      if (error) {
        console.error(`Error al obtener partner con ID ${id}:`, error)
        return null
      }

      // Formatear los datos para incluir el nombre del país
      const partner: Partner = {
        ...data,
        main_country_name: data.countries?.name || null,
      }

      // Eliminar el objeto countries anidado
      delete (partner as any).countries

      // Obtener los países donde opera el partner
      const { data: partnerCountries, error: countriesError } = await supabase
        .from("partner_countries")
        .select(`
          country_id,
          countries:country_id (id, name, code)
        `)
        .eq("partner_id", id)

      if (countriesError) {
        console.error(`Error al obtener países del partner con ID ${id}:`, countriesError)
      } else if (partnerCountries && partnerCountries.length > 0) {
        // Formatear los países para el partner
        partner.countries = partnerCountries.map((item) => item.countries)
      }

      return partner
    } catch (error) {
      console.error(`Error inesperado al obtener partner con ID ${id}:`, error)
      return null
    }
  },

  /**
   * Obtiene un partner por su ID de manera optimizada
   * @param id ID del partner
   * @returns Partner o null si no existe
   */
  async getPartnerByIdOptimized(id: string): Promise<Partner | null> {
    try {
      // Verificar si el ID es válido
      if (!id || typeof id !== "string") {
        console.error("ID de partner inválido:", id)
        return null
      }

      // Solo seleccionar los campos necesarios para la edición básica
      const { data, error } = await supabase
        .from("partners")
        .select("id, name, code, website, city, is_active")
        .eq("id", id)
        .single()

      if (error) {
        console.error(`Error al obtener partner con ID ${id}:`, error)
        return null
      }

      return data
    } catch (error) {
      console.error(`Error inesperado al obtener partner con ID ${id}:`, error)
      return null
    }
  },

  /**
   * Obtiene los países donde opera un partner
   * @param partnerId ID del partner
   * @returns Lista de IDs de países
   */
  async getPartnerCountryIds(partnerId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase.from("partner_countries").select("country_id").eq("partner_id", partnerId)

      if (error) {
        console.error(`Error al obtener países del partner con ID ${partnerId}:`, error)
        return []
      }

      return data.map((item) => item.country_id)
    } catch (error) {
      console.error(`Error inesperado al obtener países del partner con ID ${partnerId}:`, error)
      return []
    }
  },

  /**
   * Crea un nuevo partner
   * @param formData Datos del formulario
   * @returns El partner creado o null si hay error
   */
  async createPartner(formData: PartnerFormData): Promise<Partner | null> {
    try {
      let logoUrl = null

      // Generar código automáticamente a partir del nombre
      const code = this.generatePartnerCode(formData.name)

      if (formData.logo) {
        if (formData.logo instanceof File) {
          // Si es un File, subirlo
          logoUrl = await StorageService.uploadPartnerLogo(formData.logo, code)
        } else if (typeof formData.logo === "string") {
          // Si es una URL (string), usarla directamente
          logoUrl = formData.logo
        }
      }

      // Crear el partner
      const { data, error } = await supabase
        .from("partners")
        .insert([
          {
            name: formData.name,
            code: code,
            logo_url: logoUrl,
            website: formData.website || null,
            address: formData.address || null,
            main_country_id: formData.main_country_id || null,
            city: formData.city || null,
            postal_code: formData.postal_code || null,
            is_active: formData.is_active !== undefined ? formData.is_active : true,
          },
        ])
        .select("id")
        .single()

      if (error) {
        console.error("Error al crear partner:", error)
        // Si se subió un logo pero hubo error al crear el partner, eliminar el logo
        if (logoUrl && formData.logo instanceof File) {
          await StorageService.deletePartnerLogo(logoUrl)
        }
        return null
      }

      // Si hay países seleccionados, crear las relaciones
      if (formData.country_ids && formData.country_ids.length > 0) {
        const partnerCountries = formData.country_ids.map((countryId) => ({
          partner_id: data.id,
          country_id: countryId,
        }))

        const { error: relationError } = await supabase.from("partner_countries").insert(partnerCountries)

        if (relationError) {
          console.error("Error al crear relaciones de países:", relationError)
          // No revertimos la creación del partner, solo registramos el error
        }
      }

      return data
    } catch (error) {
      console.error("Error inesperado al crear partner:", error)
      return null
    }
  },

  /**
   * Actualiza un partner existente
   * @param id ID del partner
   * @param formData Datos del formulario
   * @returns El partner actualizado o null si hay error
   */
  async updatePartner(id: string, formData: PartnerFormData): Promise<Partner | null> {
    try {
      // Verificar si el ID es válido
      if (!id || typeof id !== "string") {
        console.error("ID de partner inválido:", id)
        return null
      }

      // Obtener el partner actual para verificar si hay que actualizar el logo
      const currentPartner = await this.getPartnerById(id)
      if (!currentPartner) {
        console.error(`No se encontró el partner con ID ${id}`)
        return null
      }

      let logoUrl = currentPartner.logo_url

      if (formData.logo) {
        if (formData.logo instanceof File) {
          // Si es un File, subirlo
          const newLogoUrl = await StorageService.uploadPartnerLogo(formData.logo, currentPartner.code)

          if (newLogoUrl) {
            // Si había un logo anterior, eliminarlo
            if (currentPartner.logo_url) {
              await StorageService.deletePartnerLogo(currentPartner.logo_url)
            }
            logoUrl = newLogoUrl
          }
        } else if (typeof formData.logo === "string") {
          // Si es una URL (string), usarla directamente
          // Solo actualizar si es diferente a la actual
          if (formData.logo !== currentPartner.logo_url) {
            logoUrl = formData.logo
          }
        }
      }

      // Actualizar el partner
      const { data, error } = await supabase
        .from("partners")
        .update({
          name: formData.name,
          logo_url: logoUrl,
          website: formData.website || null,
          address: formData.address || null,
          main_country_id: formData.main_country_id || null,
          city: formData.city || null,
          postal_code: formData.postal_code || null,
          is_active: formData.is_active !== undefined ? formData.is_active : currentPartner.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select("id")
        .single()

      if (error) {
        console.error(`Error al actualizar partner con ID ${id}:`, error)
        return null
      }

      // Si hay países seleccionados, actualizar las relaciones
      if (formData.country_ids) {
        // Primero eliminamos todas las relaciones existentes
        const { error: deleteError } = await supabase.from("partner_countries").delete().eq("partner_id", id)

        if (deleteError) {
          console.error(`Error al eliminar relaciones de países para el partner ${id}:`, deleteError)
          // Continuamos a pesar del error
        }

        // Luego creamos las nuevas relaciones
        if (formData.country_ids.length > 0) {
          const partnerCountries = formData.country_ids.map((countryId) => ({
            partner_id: id,
            country_id: countryId,
          }))

          const { error: insertError } = await supabase.from("partner_countries").insert(partnerCountries)

          if (insertError) {
            console.error(`Error al crear nuevas relaciones de países para el partner ${id}:`, insertError)
            // No revertimos la actualización del partner, solo registramos el error
          }
        }
      }

      return data
    } catch (error) {
      console.error(`Error inesperado al actualizar partner con ID ${id}:`, error)
      return null
    }
  },

  /**
   * Actualiza un partner existente de manera simplificada
   * @param id ID del partner
   * @param formData Datos del formulario
   * @returns El partner actualizado o null si hay error
   */
  async updatePartnerSimple(
    id: string,
    formData: {
      name: string
      website?: string | null
      city?: string | null
      is_active?: boolean
    },
  ): Promise<Partner | null> {
    try {
      // Verificar si el ID es válido
      if (!id || typeof id !== "string") {
        console.error("ID de partner inválido:", id)
        return null
      }

      // Actualizar el partner con campos mínimos
      const { data, error } = await supabase
        .from("partners")
        .update({
          name: formData.name,
          website: formData.website || null,
          city: formData.city || null,
          is_active: formData.is_active !== undefined ? formData.is_active : true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select("id, name, code, logo_url, website, city, is_active")
        .single()

      if (error) {
        console.error(`Error al actualizar partner con ID ${id}:`, error)
        return null
      }

      return data
    } catch (error) {
      console.error(`Error inesperado al actualizar partner con ID ${id}:`, error)
      return null
    }
  },

  /**
   * Elimina un partner
   * @param id ID del partner
   * @returns true si se eliminó correctamente, false si hubo error
   */
  async deletePartner(id: string): Promise<boolean> {
    try {
      // Verificar si el ID es válido
      if (!id || typeof id !== "string") {
        console.error("ID de partner inválido:", id)
        return false
      }

      // Obtener el partner para eliminar su logo si existe
      const partner = await this.getPartnerById(id)
      if (!partner) {
        console.error(`No se encontró el partner con ID ${id}`)
        return false
      }

      // Eliminar las relaciones de países primero
      const { error: relationError } = await supabase.from("partner_countries").delete().eq("partner_id", id)

      if (relationError) {
        console.error(`Error al eliminar relaciones de países para el partner ${id}:`, relationError)
        // Continuamos a pesar del error
      }

      // Eliminar el partner
      const { error } = await supabase.from("partners").delete().eq("id", id)

      if (error) {
        console.error(`Error al eliminar partner con ID ${id}:`, error)
        return false
      }

      // Si tenía logo, eliminarlo
      if (partner.logo_url) {
        await StorageService.deletePartnerLogo(partner.logo_url)
      }

      return true
    } catch (error) {
      console.error(`Error inesperado al eliminar partner con ID ${id}:`, error)
      return false
    }
  },

  /**
   * Obtiene todos los países para el selector
   * @returns Lista de países
   */
  async getCountries(): Promise<{ id: string; name: string; code: string }[]> {
    try {
      const { data, error } = await supabase.from("countries").select("id, name, code").order("name")

      if (error) {
        console.error("Error al obtener países:", error)
        return []
      }

      return data || []
    } catch (error) {
      console.error("Error inesperado al obtener países:", error)
      return []
    }
  },
}

// Exportar funciones individuales para uso directo
export const getPartners = async (): Promise<Partner[]> => {
  const { data } = await PartnerService.getPartners(1, 100)
  return data
}

export const getPartnerById = async (id: string): Promise<Partner | null> => {
  return PartnerService.getPartnerById(id)
}
