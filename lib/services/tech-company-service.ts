import { supabase } from "@/lib/supabase/client"
import { StorageService } from "./storage-service"

export interface TechCompany {
  id: string
  name: string
  code: string
  logo_url: string | null
  website: string | null
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TechCompanyFormData {
  name: string
  code: string
  logo?: File | null
  website?: string | null
  description?: string | null
  is_active?: boolean
}

export const TechCompanyService = {
  /**
   * Obtiene todas las empresas tecnológicas
   * @param searchTerm Término de búsqueda
   * @returns Lista de empresas tecnológicas
   */
  async getTechCompanies(searchTerm = ""): Promise<TechCompany[]> {
    try {
      let query = supabase.from("tech_companies").select("*").order("name")

      if (searchTerm) {
        query = query.ilike("name", `%${searchTerm}%`)
      }

      const { data, error } = await query

      if (error) {
        console.error("Error fetching tech companies:", error)
        return []
      }

      return data || []
    } catch (error) {
      console.error("Unexpected error fetching tech companies:", error)
      return []
    }
  },

  /**
   * Obtiene una empresa tecnológica por su ID
   * @param id ID de la empresa tecnológica
   * @returns Empresa tecnológica o null si no existe
   */
  async getTechCompanyById(id: string): Promise<TechCompany | null> {
    try {
      const { data, error } = await supabase.from("tech_companies").select("*").eq("id", id).single()

      if (error) {
        console.error("Error fetching tech company:", error)
        return null
      }

      return data
    } catch (error) {
      console.error("Unexpected error fetching tech company:", error)
      return null
    }
  },

  /**
   * Crea una nueva empresa tecnológica
   * @param formData Datos del formulario
   * @returns La empresa tecnológica creada o null si hay error
   */
  async createTechCompany(formData: TechCompanyFormData): Promise<TechCompany | null> {
    try {
      let logoUrl = null

      // Si hay un logo, subirlo primero
      if (formData.logo) {
        logoUrl = await StorageService.uploadTechCompanyLogo(formData.logo, formData.code)
      }

      // Crear la empresa tecnológica
      const { data, error } = await supabase
        .from("tech_companies")
        .insert([
          {
            name: formData.name,
            code: formData.code,
            logo_url: logoUrl,
            website: formData.website || null,
            description: formData.description || null,
            is_active: formData.is_active !== undefined ? formData.is_active : true,
          },
        ])
        .select()
        .single()

      if (error) {
        console.error("Error creating tech company:", error)
        // Si se subió un logo pero hubo error al crear la empresa, eliminar el logo
        if (logoUrl) {
          await StorageService.deleteTechCompanyLogo(logoUrl)
        }
        return null
      }

      return data
    } catch (error) {
      console.error("Unexpected error creating tech company:", error)
      return null
    }
  },

  /**
   * Actualiza una empresa tecnológica existente
   * @param id ID de la empresa tecnológica
   * @param formData Datos del formulario
   * @returns La empresa tecnológica actualizada o null si hay error
   */
  async updateTechCompany(id: string, formData: TechCompanyFormData): Promise<TechCompany | null> {
    try {
      // Obtener la empresa actual para verificar si hay que actualizar el logo
      const currentCompany = await this.getTechCompanyById(id)
      if (!currentCompany) {
        console.error(`Tech company with ID ${id} not found`)
        return null
      }

      let logoUrl = currentCompany.logo_url

      // Si hay un nuevo logo, subirlo y eliminar el anterior
      if (formData.logo instanceof File) {
        const newLogoUrl = await StorageService.uploadTechCompanyLogo(formData.logo, formData.code)
        if (newLogoUrl) {
          // Si había un logo anterior, eliminarlo
          if (currentCompany.logo_url) {
            await StorageService.deleteTechCompanyLogo(currentCompany.logo_url)
          }
          logoUrl = newLogoUrl
        }
      }

      // Actualizar la empresa tecnológica
      const { data, error } = await supabase
        .from("tech_companies")
        .update({
          name: formData.name,
          code: formData.code,
          logo_url: logoUrl,
          website: formData.website || null,
          description: formData.description || null,
          is_active: formData.is_active !== undefined ? formData.is_active : currentCompany.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single()

      if (error) {
        console.error(`Error updating tech company with ID ${id}:`, error)
        return null
      }

      return data
    } catch (error) {
      console.error(`Unexpected error updating tech company with ID ${id}:`, error)
      return null
    }
  },

  /**
   * Elimina una empresa tecnológica
   * @param id ID de la empresa tecnológica
   * @returns true si se eliminó correctamente, false si hubo error
   */
  async deleteTechCompany(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from("tech_companies").delete().eq("id", id)

      if (error) {
        console.error(`Error deleting tech company with ID ${id}:`, error)
        return false
      }

      return true
    } catch (error) {
      console.error(`Unexpected error deleting tech company with ID ${id}:`, error)
      return false
    }
  },

  async getTechCompaniesBasic(): Promise<{ id: string; name: string }[]> {
    try {
      const { data, error } = await supabase.from("tech_companies").select("id, name").order("name")
      if (error) {
        console.error("Error fetching tech companies:", error)
        return []
      }
      return data || []
    } catch (error) {
      console.error("Unexpected error fetching tech companies:", error)
      return []
    }
  },
}

// Función para obtener todas las empresas tecnológicas (exportación nombrada)
export async function getTechCompanies(searchTerm = ""): Promise<TechCompany[]> {
  try {
    console.log("CLIENT: Iniciando getTechCompanies")

    let query = supabase.from("tech_companies").select("*").order("name")

    if (searchTerm) {
      query = query.ilike("name", `%${searchTerm}%`)
    }

    // Mostrar la consulta que se va a ejecutar
    console.log("CLIENT QUERY:", "supabase.from('tech_companies').select('*').order('name')")

    const { data, error } = await query

    if (error) {
      console.error("CLIENT ERROR en getTechCompanies:", error)
      return []
    }

    console.log(`CLIENT: getTechCompanies obtuvo ${data?.length || 0} registros`)
    return data || []
  } catch (error) {
    console.error("CLIENT EXCEPTION en getTechCompanies:", error)
    return []
  }
}
