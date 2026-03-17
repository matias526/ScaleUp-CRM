import { supabase } from "@/lib/supabase/client"

export interface PartnerTechCompany {
  id: string
  partner_id: string
  tech_company_id: string
  scaleup_manager_id: string | null
  created_at: string
  updated_at: string
  tech_company_name?: string
  scaleup_manager_name?: string
}

export interface PartnerTechCompanyFormData {
  partner_id: string
  tech_company_id: string
  scaleup_manager_id?: string | null
}

export const PartnerTechCompanyService = {
  /**
   * Obtiene todas las relaciones de un partner con empresas tecnológicas
   * @param partnerId ID del partner
   * @returns Lista de relaciones
   */
  async getPartnerTechCompanies(partnerId: string): Promise<PartnerTechCompany[]> {
    try {
      const { data, error } = await supabase
        .from("partner_tech_companies")
        .select(`
          id, partner_id, tech_company_id, scaleup_manager_id, created_at, updated_at,
          tech_companies:tech_company_id (name),
          users:scaleup_manager_id (first_name, last_name)
        `)
        .eq("partner_id", partnerId)
        .order("created_at")

      if (error) {
        console.error("Error al obtener relaciones partner-tech:", error)
        return []
      }

      // Formatear los datos para incluir nombres
      return data.map((item) => ({
        ...item,
        tech_company_name: item.tech_companies?.name || null,
        scaleup_manager_name: item.users ? `${item.users.first_name} ${item.users.last_name}` : null,
      }))
    } catch (error) {
      console.error("Error inesperado al obtener relaciones partner-tech:", error)
      return []
    }
  },

  /**
   * Crea una nueva relación entre un partner y una empresa tecnológica
   * @param formData Datos del formulario
   * @returns La relación creada o null si hay error
   */
  async createPartnerTechCompany(formData: PartnerTechCompanyFormData): Promise<PartnerTechCompany | null> {
    try {
      // Verificar si ya existe una relación entre este partner y esta empresa tecnológica
      const { data: existingRelation, error: checkError } = await supabase
        .from("partner_tech_companies")
        .select("id")
        .eq("partner_id", formData.partner_id)
        .eq("tech_company_id", formData.tech_company_id)
        .maybeSingle()

      if (checkError) {
        console.error("Error al verificar relación existente:", checkError)
        return null
      }

      if (existingRelation) {
        console.error("Ya existe una relación entre este partner y esta empresa tecnológica")
        throw new Error("Ya existe una relación entre este partner y esta empresa tecnológica")
      }

      // Crear la relación
      const { data, error } = await supabase
        .from("partner_tech_companies")
        .insert([
          {
            partner_id: formData.partner_id,
            tech_company_id: formData.tech_company_id,
            scaleup_manager_id: formData.scaleup_manager_id === "null" ? null : formData.scaleup_manager_id,
          },
        ])
        .select()
        .single()

      if (error) {
        console.error("Error al crear relación partner-tech:", error)
        return null
      }

      return data
    } catch (error: any) {
      console.error("Error inesperado al crear relación partner-tech:", error)
      throw error
    }
  },

  /**
   * Actualiza una relación existente
   * @param id ID de la relación
   * @param scaleupManagerId ID del usuario gestor de ScaleUp
   * @returns La relación actualizada o null si hay error
   */
  async updatePartnerTechCompany(id: string, scaleupManagerId: string | null): Promise<PartnerTechCompany | null> {
    try {
      const { data, error } = await supabase
        .from("partner_tech_companies")
        .update({
          scaleup_manager_id: scaleupManagerId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single()

      if (error) {
        console.error("Error al actualizar relación partner-tech:", error)
        return null
      }

      return data
    } catch (error) {
      console.error("Error inesperado al actualizar relación partner-tech:", error)
      return null
    }
  },

  /**
   * Elimina una relación
   * @param id ID de la relación
   * @returns true si se eliminó correctamente, false si hubo error
   */
  async deletePartnerTechCompany(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from("partner_tech_companies").delete().eq("id", id)

      if (error) {
        console.error("Error al eliminar relación partner-tech:", error)
        return false
      }

      return true
    } catch (error) {
      console.error("Error inesperado al eliminar relación partner-tech:", error)
      return false
    }
  },

  /**
   * Obtiene las empresas tecnológicas disponibles para asociar
   */
  async getAvailableTechCompanies() {
    try {
      const { data, error } = await supabase
        .from("tech_companies")
        .select("id, name, code")
        .eq("is_active", true)
        .order("name")

      if (error) {
        console.error("Error al obtener empresas tecnológicas:", error)
        return []
      }

      return data || []
    } catch (error) {
      console.error("Error inesperado al obtener empresas tecnológicas:", error)
      return []
    }
  },
}
