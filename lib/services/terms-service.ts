import type { SupabaseClient } from "@supabase/supabase-js"

// Versión actual de los términos y condiciones
export const CURRENT_TERMS_VERSION = "1.2"

export class TermsService {
  private supabase: SupabaseClient

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase
  }

  /**
   * Verifica si el usuario ha aceptado los términos y condiciones
   * @param userId ID del usuario
   * @param version Versión de los términos a verificar (opcional, por defecto la versión actual)
   * @returns true si el usuario ha aceptado los términos, false en caso contrario
   */
  async hasAcceptedTerms(userId: string, version: string = CURRENT_TERMS_VERSION): Promise<boolean> {
    try {
      console.log("Verificando aceptación de términos para el usuario:", userId)

      const { data, error } = await this.supabase
        .from("user_terms_acceptance")
        .select("*")
        .eq("user_id", userId)
        .eq("terms_version", version)
        .single()

      if (error) {
        // Si el error es "No rows found", significa que el usuario no ha aceptado los términos
        if (error.code === "PGRST116") {
          console.log("El usuario no ha aceptado los términos")
          return false
        }

        console.error("Error al verificar la aceptación de términos:", error)
        return false
      }

      console.log("Resultado de verificación de términos:", !!data)
      return !!data
    } catch (error) {
      console.error("Error al verificar la aceptación de términos:", error)
      return false
    }
  }

  /**
   * Registra la aceptación de términos y condiciones por parte del usuario
   * @param userId ID del usuario
   * @param version Versión de los términos aceptados (opcional, por defecto la versión actual)
   */
  async acceptTerms(userId: string, version: string = CURRENT_TERMS_VERSION): Promise<void> {
    try {
      console.log("Verificando si el usuario ya ha aceptado los términos...")

      // Primero verificamos si el usuario ya ha aceptado estos términos
      const alreadyAccepted = await this.hasAcceptedTerms(userId, version)

      if (alreadyAccepted) {
        console.log("El usuario ya ha aceptado estos términos anteriormente. No es necesario registrar de nuevo.")
        return // Si ya los aceptó, no hacemos nada más
      }

      console.log("Registrando aceptación de términos para el usuario:", userId)

      // Usar una IP fija para evitar problemas con la API externa
      const ipAddress = "127.0.0.1"

      // Usamos upsert para evitar duplicados (actualiza si existe, inserta si no)
      const { error } = await this.supabase.from("user_terms_acceptance").upsert(
        {
          user_id: userId,
          terms_version: version,
          accepted_at: new Date().toISOString(),
          ip_address: ipAddress,
        },
        {
          onConflict: "user_id,terms_version", // Especificamos las columnas que forman la clave única
          ignoreDuplicates: true, // Ignorar si ya existe
        },
      )

      if (error) {
        console.error("Error al aceptar los términos:", error)
        throw new Error("Error al aceptar los términos: " + error.message)
      }

      console.log("Términos aceptados correctamente")
    } catch (error) {
      console.error("Error al aceptar los términos:", error)
      throw error
    }
  }
}
