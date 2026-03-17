import { supabase } from "@/lib/supabase/client"
import { v4 as uuidv4 } from "uuid"

const TECH_COMPANY_LOGOS_BUCKET = "tech_company_logos"
const PARTNER_LOGOS_BUCKET = "partner_logos"

export const StorageService = {
  /**
   * Sube un logo para una empresa tecnológica
   * @param file Archivo a subir
   * @param companyCode Código de la empresa para nombrar el archivo
   * @returns URL pública del archivo subido o null si hay error
   */
  async uploadTechCompanyLogo(file: File, companyCode: string): Promise<string | null> {
    try {
      // Obtener extensión del archivo
      const fileExt = file.name.split(".").pop()
      // Crear nombre único para el archivo
      const fileName = `${companyCode.toLowerCase()}_${uuidv4()}.${fileExt}`
      const filePath = `${fileName}`

      // Subir el archivo
      const { error: uploadError, data } = await supabase.storage
        .from(TECH_COMPANY_LOGOS_BUCKET)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        })

      if (uploadError) {
        console.error("Error al subir el logo:", uploadError)
        return null
      }

      // Obtener URL pública
      const {
        data: { publicUrl },
      } = supabase.storage.from(TECH_COMPANY_LOGOS_BUCKET).getPublicUrl(filePath)

      return publicUrl
    } catch (error) {
      console.error("Error al procesar la subida del logo:", error)
      return null
    }
  },

  /**
   * Elimina un logo de una empresa tecnológica
   * @param logoUrl URL del logo a eliminar
   * @returns true si se eliminó correctamente, false si hubo error
   */
  async deleteTechCompanyLogo(logoUrl: string): Promise<boolean> {
    try {
      // Extraer el nombre del archivo de la URL
      const urlParts = logoUrl.split("/")
      const fileName = urlParts[urlParts.length - 1]

      // Eliminar el archivo
      const { error } = await supabase.storage.from(TECH_COMPANY_LOGOS_BUCKET).remove([fileName])

      if (error) {
        console.error("Error al eliminar el logo:", error)
        return false
      }

      return true
    } catch (error) {
      console.error("Error al procesar la eliminación del logo:", error)
      return false
    }
  },

  /**
   * Sube un logo para un partner
   * @param file Archivo a subir
   * @param partnerCode Código del partner para nombrar el archivo
   * @returns URL pública del archivo subido o null si hay error
   */
  async uploadPartnerLogo(file: File, partnerCode: string): Promise<string | null> {
    try {
      // Verificar si el bucket existe, si no, usar el bucket de tech companies
      const bucketName = PARTNER_LOGOS_BUCKET

      // Obtener extensión del archivo
      const fileExt = file.name.split(".").pop()
      // Crear nombre único para el archivo
      const fileName = `${partnerCode.toLowerCase()}_${uuidv4()}.${fileExt}`
      const filePath = `${fileName}`

      // Subir el archivo
      const { error: uploadError } = await supabase.storage.from(bucketName).upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      })

      if (uploadError) {
        console.error("Error al subir el logo del partner:", uploadError)
        // Intentar con el bucket de tech companies como fallback
        return this.uploadTechCompanyLogo(file, partnerCode)
      }

      // Obtener URL pública
      const {
        data: { publicUrl },
      } = supabase.storage.from(bucketName).getPublicUrl(filePath)

      return publicUrl
    } catch (error) {
      console.error("Error al procesar la subida del logo del partner:", error)
      return null
    }
  },

  /**
   * Elimina un logo de un partner
   * @param logoUrl URL del logo a eliminar
   * @returns true si se eliminó correctamente, false si hubo error
   */
  async deletePartnerLogo(logoUrl: string): Promise<boolean> {
    try {
      // Extraer el nombre del archivo y el bucket de la URL
      const urlParts = logoUrl.split("/")
      const fileName = urlParts[urlParts.length - 1]

      // Determinar el bucket basado en la URL
      const bucketName = logoUrl.includes(PARTNER_LOGOS_BUCKET) ? PARTNER_LOGOS_BUCKET : TECH_COMPANY_LOGOS_BUCKET

      // Eliminar el archivo
      const { error } = await supabase.storage.from(bucketName).remove([fileName])

      if (error) {
        console.error("Error al eliminar el logo del partner:", error)
        return false
      }

      return true
    } catch (error) {
      console.error("Error al procesar la eliminación del logo del partner:", error)
      return false
    }
  },
}
