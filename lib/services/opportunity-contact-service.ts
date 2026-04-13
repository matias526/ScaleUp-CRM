import { supabase } from "@/lib/supabase/client"

export interface OpportunityContact {
  id: string
  opportunity_id: string
  contact_id: string | null
  is_primary: boolean
  created_at: string
  contact?: {
    id: string
    first_name: string
    last_name: string
    email: string
    phone?: string | null
    position?: string | null
    department?: string | null
    preferred_language?: string
  }
}

export class OpportunityContactService {
  /**
   * Get all contacts related to an opportunity
   */
  static async getOpportunityContacts(opportunityId: string) {
    const { data, error } = await supabase
      .from("opportunity_contacts")
      .select(
        `
        id,
        opportunity_id,
        contact_id,
        is_primary,
        created_at,
        contact:contacts(
          id,
          first_name,
          last_name,
          email,
          phone,
          position,
          department,
          preferred_language
        )
      `
      )
      .eq("opportunity_id", opportunityId)
      .order("is_primary", { ascending: false })
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching opportunity contacts:", error)
      throw error
    }

    return data as OpportunityContact[]
  }

  /**
   * Add a contact to an opportunity
   */
  static async addContactToOpportunity(opportunityId: string, contactId: string, isPrimary = false) {
    // If this is to be primary, remove primary from others
    if (isPrimary) {
      await supabase
        .from("opportunity_contacts")
        .update({ is_primary: false })
        .eq("opportunity_id", opportunityId)
    }

    const { data, error } = await supabase
      .from("opportunity_contacts")
      .insert({
        opportunity_id: opportunityId,
        contact_id: contactId,
        is_primary: isPrimary,
      })
      .select()

    if (error) {
      console.error("Error adding contact to opportunity:", error)
      throw error
    }

    return data?.[0]
  }

  /**
   * Update a contact's primary status in an opportunity
   */
  static async updatePrimaryContact(opportunityId: string, contactId: string, isPrimary: boolean) {
    // If setting to primary, remove primary from others
    if (isPrimary) {
      await supabase
        .from("opportunity_contacts")
        .update({ is_primary: false })
        .eq("opportunity_id", opportunityId)
        .neq("contact_id", contactId)
    }

    const { data, error } = await supabase
      .from("opportunity_contacts")
      .update({ is_primary: isPrimary })
      .eq("opportunity_id", opportunityId)
      .eq("contact_id", contactId)
      .select()

    if (error) {
      console.error("Error updating primary contact:", error)
      throw error
    }

    return data?.[0]
  }

  /**
   * Remove a contact from an opportunity
   */
  static async removeContactFromOpportunity(opportunityId: string, contactId: string) {
    const { error } = await supabase
      .from("opportunity_contacts")
      .delete()
      .eq("opportunity_id", opportunityId)
      .eq("contact_id", contactId)

    if (error) {
      console.error("Error removing contact from opportunity:", error)
      throw error
    }
  }

  /**
   * Check if a contact is already related to an opportunity
   */
  static async isContactInOpportunity(opportunityId: string, contactId: string) {
    const { data, error } = await supabase
      .from("opportunity_contacts")
      .select("id")
      .eq("opportunity_id", opportunityId)
      .eq("contact_id", contactId)
      .single()

    if (error && error.code !== "PGRST116") {
      console.error("Error checking if contact is in opportunity:", error)
    }

    return !!data
  }
}
