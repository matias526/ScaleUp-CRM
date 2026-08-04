import { supabase } from "@/lib/supabase/client"

export interface UnverifiedContact {
  id: string
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  company_name?: string
  position?: string
  industry_id?: string
  country_id?: string
  source: "BULK_IMPORT" | "WEB_FORM" | "EVENT"
  status: "NEW" | "CONTACTED" | "GRADUATED" | "DISCARDED"
  created_at: string
  updated_at: string
}

export class UnverifiedContactsService {
  /**
   * Get all unverified contacts with optional filtering
   */
  static async getContacts(filters?: {
    source?: string
    status?: string
    industry_id?: string
    search?: string
  }) {
    let query = supabase.from("unverified_contacts").select("*").order("created_at", { ascending: false })

    if (filters?.source) {
      query = query.eq("source", filters.source)
    }

    if (filters?.status) {
      query = query.eq("status", filters.status)
    }

    if (filters?.industry_id) {
      query = query.eq("industry_id", filters.industry_id)
    }

    if (filters?.search) {
      const search = filters.search.toLowerCase()
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,company_name.ilike.%${search}%`,
      )
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  /**
   * Get a single unverified contact by ID
   */
  static async getContact(id: string) {
    const { data, error } = await supabase.from("unverified_contacts").select("*").eq("id", id).single()

    if (error) throw error
    return data
  }

  /**
   * Create a new unverified contact
   */
  static async createContact(contact: Omit<UnverifiedContact, "id" | "created_at" | "updated_at">) {
    const { data, error } = await supabase
      .from("unverified_contacts")
      .insert([
        {
          ...contact,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Update an unverified contact
   */
  static async updateContact(id: string, updates: Partial<UnverifiedContact>) {
    const { data, error } = await supabase
      .from("unverified_contacts")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Delete an unverified contact
   */
  static async deleteContact(id: string) {
    const { error } = await supabase.from("unverified_contacts").delete().eq("id", id)

    if (error) throw error
  }

  /**
   * Promote an unverified contact to an official contact
   */
  static async promoteToContact(unverifiedContactId: string, contactData: any) {
    // Create new contact from unverified contact
    const { data: newContact, error: createError } = await supabase
      .from("contacts")
      .insert([contactData])
      .select()
      .single()

    if (createError) throw createError

    // Mark unverified contact as graduated
    await this.updateContact(unverifiedContactId, {
      status: "GRADUATED",
    })

    return newContact
  }

  /**
   * Import multiple contacts from CSV data
   */
  static async importContacts(contacts: any[]) {
    const { data, error } = await supabase.from("unverified_contacts").insert(contacts).select()

    if (error) throw error
    return data
  }

  /**
   * Get statistics about unverified contacts
   */
  static async getStatistics() {
    const { data: all } = await supabase.from("unverified_contacts").select("id", { count: "exact" })

    const { data: newContacts, count: newCount } = await supabase
      .from("unverified_contacts")
      .select("id", { count: "exact" })
      .eq("status", "NEW")

    const { data: contacted, count: contactedCount } = await supabase
      .from("unverified_contacts")
      .select("id", { count: "exact" })
      .eq("status", "CONTACTED")

    const { data: graduated, count: graduatedCount } = await supabase
      .from("unverified_contacts")
      .select("id", { count: "exact" })
      .eq("status", "GRADUATED")

    return {
      total: all?.length || 0,
      new: newCount || 0,
      contacted: contactedCount || 0,
      graduated: graduatedCount || 0,
    }
  }
}
