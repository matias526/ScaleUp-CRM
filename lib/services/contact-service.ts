import { supabase } from "@/lib/supabase/client"

export interface Contact {
  id: string
  user_id: string | null
  first_name: string
  last_name: string
  email: string
  phone: string | null
  position: string | null
  department: string
  preferred_language: string
  tech_company_id: string | null
  partner_id: string | null
  end_customer_id: string | null
  linkedin_url: string | null
  notes: string | null
  created_at: string
  updated_at: string | null
}

export interface ContactFormData {
  user_id?: string | null
  first_name: string
  last_name: string
  email: string
  phone?: string | null
  position?: string | null
  department: string
  preferred_language?: string
  tech_company_id?: string | null
  partner_id?: string | null
  end_customer_id?: string | null
  linkedin_url?: string | null
  notes?: string | null
}

export interface ContactFilters {
  department?: string
  preferred_language?: string
  tech_company_id?: string
  partner_id?: string
  end_customer_id?: string
  searchTerm?: string
}

export const ContactService = {
  /**
   * Obtiene todos los contactos con paginación
   * @param page Número de página
   * @param pageSize Tamaño de página
   * @param filters Filtros opcionales (departamento, idioma, compañía)
   * @returns Lista de contactos y total
   */
  async getContacts(
    page = 1,
    pageSize = 10,
    filters?: ContactFilters,
  ): Promise<{ data: Contact[]; total: number }> {
    try {
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      // Obtener el total de registros
      let countQuery = supabase
        .from("contacts")
        .select("id", { count: "exact", head: true })

      // Obtener los datos paginados
      let dataQuery = supabase
        .from("contacts")
        .select("*")
        .order("created_at", { ascending: false })
        .range(from, to)

      // Aplicar filtros
      if (filters?.department) {
        countQuery = countQuery.eq("department", filters.department)
        dataQuery = dataQuery.eq("department", filters.department)
      }

      if (filters?.preferred_language) {
        countQuery = countQuery.eq("preferred_language", filters.preferred_language)
        dataQuery = dataQuery.eq("preferred_language", filters.preferred_language)
      }

      if (filters?.tech_company_id) {
        countQuery = countQuery.eq("tech_company_id", filters.tech_company_id)
        dataQuery = dataQuery.eq("tech_company_id", filters.tech_company_id)
      }

      if (filters?.partner_id) {
        countQuery = countQuery.eq("partner_id", filters.partner_id)
        dataQuery = dataQuery.eq("partner_id", filters.partner_id)
      }

      if (filters?.end_customer_id) {
        countQuery = countQuery.eq("end_customer_id", filters.end_customer_id)
        dataQuery = dataQuery.eq("end_customer_id", filters.end_customer_id)
      }

      if (filters?.searchTerm) {
        const term = filters.searchTerm.toLowerCase()
        countQuery = countQuery.or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%,email.ilike.%${term}%`)
        dataQuery = dataQuery.or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%,email.ilike.%${term}%`)
      }

      // Ejecutar ambas consultas en paralelo
      const [countResult, dataResult] = await Promise.all([countQuery, dataQuery])

      if (countResult.error) {
        console.error("Error al obtener el conteo de contactos:", countResult.error)
        return { data: [], total: 0 }
      }

      if (dataResult.error) {
        console.error("Error al obtener contactos:", dataResult.error)
        return { data: [], total: 0 }
      }

      return {
        data: dataResult.data || [],
        total: countResult.count || 0,
      }
    } catch (error) {
      console.error("Error inesperado al obtener contactos:", error)
      return { data: [], total: 0 }
    }
  },

  /**
   * Busca contactos por término de búsqueda
   * @param searchTerm Término de búsqueda
   * @returns Lista de contactos que coinciden
   */
  async searchContacts(searchTerm: string): Promise<Contact[]> {
    try {
      const term = searchTerm.toLowerCase().trim()

      if (!term) {
        return []
      }

      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%,email.ilike.%${term}%,position.ilike.%${term}%`)
        .order("created_at", { ascending: false })
        .limit(20)

      if (error) {
        console.error("Error al buscar contactos:", error)
        return []
      }

      return data || []
    } catch (error) {
      console.error("Error inesperado al buscar contactos:", error)
      return []
    }
  },

  /**
   * Obtiene un contacto por ID
   * @param id ID del contacto
   * @returns Contacto o null
   */
  async getContactById(id: string): Promise<Contact | null> {
    try {
      const { data, error } = await supabase.from("contacts").select("*").eq("id", id).single()

      if (error) {
        console.error("Error al obtener contacto:", error)
        return null
      }

      return data
    } catch (error) {
      console.error("Error inesperado al obtener contacto:", error)
      return null
    }
  },

  /**
   * Obtiene contactos por ID de usuario
   * @param userId ID del usuario
   * @returns Lista de contactos
   */
  async getContactsByUserId(userId: string): Promise<Contact[]> {
    try {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error al obtener contactos del usuario:", error)
        return []
      }

      return data || []
    } catch (error) {
      console.error("Error inesperado al obtener contactos del usuario:", error)
      return []
    }
  },

  /**
   * Obtiene contactos de una compañía técnica
   * @param techCompanyId ID de la compañía técnica
   * @returns Lista de contactos
   */
  async getContactsByTechCompany(techCompanyId: string): Promise<Contact[]> {
    try {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .eq("tech_company_id", techCompanyId)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error al obtener contactos de la compañía técnica:", error)
        return []
      }

      return data || []
    } catch (error) {
      console.error("Error inesperado al obtener contactos:", error)
      return []
    }
  },

  /**
   * Obtiene contactos de un partner
   * @param partnerId ID del partner
   * @returns Lista de contactos
   */
  async getContactsByPartner(partnerId: string): Promise<Contact[]> {
    try {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .eq("partner_id", partnerId)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error al obtener contactos del partner:", error)
        return []
      }

      return data || []
    } catch (error) {
      console.error("Error inesperado al obtener contactos:", error)
      return []
    }
  },

  /**
   * Crea un nuevo contacto
   * @param contactData Datos del contacto
   * @returns Contacto creado o null
   */
  async createContact(contactData: ContactFormData): Promise<Contact | null> {
    try {
      const { data, error } = await supabase
        .from("contacts")
        .insert([
          {
            ...contactData,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single()

      if (error) {
        console.error("Error al crear contacto:", error)
        return null
      }

      return data
    } catch (error) {
      console.error("Error inesperado al crear contacto:", error)
      return null
    }
  },

  /**
   * Actualiza un contacto
   * @param id ID del contacto
   * @param contactData Datos del contacto a actualizar
   * @returns Contacto actualizado o null
   */
  async updateContact(id: string, contactData: Partial<ContactFormData>): Promise<Contact | null> {
    try {
      const { data, error } = await supabase
        .from("contacts")
        .update({
          ...contactData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single()

      if (error) {
        console.error("Error al actualizar contacto:", error)
        return null
      }

      return data
    } catch (error) {
      console.error("Error inesperado al actualizar contacto:", error)
      return null
    }
  },

  /**
   * Elimina un contacto
   * @param id ID del contacto
   * @returns true si se eliminó exitosamente
   */
  async deleteContact(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from("contacts").delete().eq("id", id)

      if (error) {
        console.error("Error al eliminar contacto:", error)
        return false
      }

      return true
    } catch (error) {
      console.error("Error inesperado al eliminar contacto:", error)
      return false
    }
  },

  /**
   * Obtiene contactos ordenados por departamento
   * @param techCompanyId ID de la compañía técnica (opcional)
   * @returns Lista de contactos agrupados por departamento
   */
  async getContactsByDepartment(techCompanyId?: string): Promise<Record<string, Contact[]>> {
    try {
      let query = supabase.from("contacts").select("*")

      if (techCompanyId) {
        query = query.eq("tech_company_id", techCompanyId)
      }

      const { data, error } = await query.order("department").order("last_name")

      if (error) {
        console.error("Error al obtener contactos por departamento:", error)
        return {}
      }

      // Agrupar por departamento
      const grouped = (data || []).reduce(
        (acc, contact) => {
          const dept = contact.department || "Sin departamento"
          if (!acc[dept]) {
            acc[dept] = []
          }
          acc[dept].push(contact)
          return acc
        },
        {} as Record<string, Contact[]>,
      )

      return grouped
    } catch (error) {
      console.error("Error inesperado al obtener contactos:", error)
      return {}
    }
  },
}
