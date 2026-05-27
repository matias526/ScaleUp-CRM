import { supabase } from "@/lib/supabase/client"
import type { ProspectPartner } from "@/types/prospect-partner"

export class ProspectConversionService {
  /**
   * Convierte un prospect partner a un partner real y vincula los contacts
   */
  static async convertProspectToPartner(
    prospectId: string,
    partnerId: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Update prospect_partners to mark as converted
      const { error: prospectError } = await supabase
        .from("prospect_partners")
        .update({
          converted_partner_id: partnerId,
          converted_at: new Date().toISOString(),
        })
        .eq("id", prospectId)

      if (prospectError) throw prospectError

      // Get all contacts linked to this prospect
      const { data: contacts, error: contactsError } = await supabase
        .from("contacts")
        .select("id")
        .eq("prospect_id", prospectId)

      if (contactsError) throw contactsError

      // Update all contacts to link them to the new partner
      if (contacts && contacts.length > 0) {
        const contactIds = contacts.map((c) => c.id)

        const { error: updateContactsError } = await supabase
          .from("contacts")
          .update({
            partner_id: partnerId,
            prospect_id: null, // Remove prospect link since it's now converted
          })
          .in("id", contactIds)

        if (updateContactsError) throw updateContactsError
      }

      return { success: true }
    } catch (error: any) {
      console.error("Error converting prospect to partner:", error)
      return {
        success: false,
        error: error.message || "Error al convertir prospect a partner",
      }
    }
  }

  /**
   * Obtiene los datos de un prospect para pre-llenar el formulario
   */
  static async getProspectData(prospectId: string): Promise<ProspectPartner | null> {
    try {
      const { data, error } = await supabase
        .from("prospect_partners")
        .select("*")
        .eq("id", prospectId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("Error fetching prospect:", error)
      return null
    }
  }

  /**
   * Obtiene los contacts vinculados a un prospect
   */
  static async getProspectContacts(prospectId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .eq("prospect_id", prospectId)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Error fetching prospect contacts:", error)
      return []
    }
  }
}
