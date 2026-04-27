import { supabase } from "@/lib/supabase/client"

export interface ProspectPartner {
  id: string
  name: string
  code?: string
  main_country_id?: string
  website?: string
  address?: string
  lead_source?: string
  converted_at?: string
  converted_partner_id?: string
  created_at?: string
  updated_at?: string
  is_active: boolean
}

export interface ProspectPartnerFilters {
  searchTerm?: string
  leadSource?: string
  status?: string
}

export interface Contact {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  position?: string
  department?: string
  linkedin_url?: string
  notes?: string
  preferred_language?: string
  prospect_id?: string
}

export class ProspectPartnerService {
  static async getProspectPartners(
    page: number = 1,
    pageSize: number = 10,
    filters?: ProspectPartnerFilters
  ): Promise<{ data: ProspectPartner[]; total: number }> {
    try {
      let query = supabase
        .from("prospect_partners")
        .select("*", { count: "exact" })
        .eq("is_active", true)
        .order("created_at", { ascending: false })

      if (filters?.searchTerm) {
        query = query.or(
          `name.ilike.%${filters.searchTerm}%,code.ilike.%${filters.searchTerm}%,website.ilike.%${filters.searchTerm}%`
        )
      }

      if (filters?.leadSource) {
        query = query.eq("lead_source", filters.leadSource)
      }

      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      const { data, error, count } = await query.range(from, to)

      if (error) throw error

      return {
        data: data || [],
        total: count || 0,
      }
    } catch (error) {
      console.error("[v0] Error getting prospect partners:", error)
      throw error
    }
  }

  static async getProspectPartnerById(id: string): Promise<ProspectPartner | null> {
    try {
      const { data, error } = await supabase
        .from("prospect_partners")
        .select("*")
        .eq("id", id)
        .eq("is_active", true)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("[v0] Error getting prospect partner:", error)
      throw error
    }
  }

  static async createProspectPartner(partner: Partial<ProspectPartner>): Promise<ProspectPartner> {
    try {
      const { data, error } = await supabase
        .from("prospect_partners")
        .insert([
          {
            name: partner.name,
            code: partner.code,
            main_country_id: partner.main_country_id,
            website: partner.website,
            address: partner.address,
            lead_source: partner.lead_source,
            is_active: true,
          },
        ])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("[v0] Error creating prospect partner:", error)
      throw error
    }
  }

  static async updateProspectPartner(id: string, partner: Partial<ProspectPartner>): Promise<ProspectPartner> {
    try {
      const { data, error } = await supabase
        .from("prospect_partners")
        .update({
          name: partner.name,
          code: partner.code,
          main_country_id: partner.main_country_id,
          website: partner.website,
          address: partner.address,
          lead_source: partner.lead_source,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("[v0] Error updating prospect partner:", error)
      throw error
    }
  }

  static async deleteProspectPartner(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("prospect_partners")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", id)

      if (error) throw error
    } catch (error) {
      console.error("[v0] Error deleting prospect partner:", error)
      throw error
    }
  }

  static async getContactsByProspectPartner(prospectPartnerId: string): Promise<Contact[]> {
    try {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .eq("prospect_id", prospectPartnerId)
        .eq("is_active", true)
        .order("first_name", { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("[v0] Error getting contacts:", error)
      throw error
    }
  }

  static async getOpportunitiesByProspectPartner(prospectPartnerId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from("opportunities")
        .select("id, title, estimated_value, created_at")
        .eq("prospect_id", prospectPartnerId)
        .order("created_at", { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("[v0] Error getting opportunities:", error)
      return []
    }
  }

  static async addContactToProspectPartner(contact: Partial<Contact>): Promise<Contact> {
    try {
      const { data, error } = await supabase
        .from("contacts")
        .insert([
          {
            first_name: contact.first_name,
            last_name: contact.last_name,
            email: contact.email,
            phone: contact.phone,
            position: contact.position,
            department: contact.department,
            linkedin_url: contact.linkedin_url,
            notes: contact.notes,
            preferred_language: contact.preferred_language || "es",
            prospect_id: contact.prospect_id,
            is_active: true,
          },
        ])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("[v0] Error adding contact:", error)
      throw error
    }
  }

  // Get all countries for dropdown selectors
  static async getAllCountries(): Promise<{ id: string; name: string; code: string }[]> {
    try {
      console.log("[v0] Obteniendo todos los países")

      const { data, error } = await supabase
        .from("countries")
        .select("id, name, code")
        .order("name", { ascending: true })

      if (error) {
        console.error("[v0] Error al obtener países:", error)
        return []
      }

      console.log(`[v0] Se encontraron ${data?.length || 0} países`)
      return data || []
    } catch (error) {
      console.error("[v0] Error inesperado al obtener países:", error)
      return []
    }
  }
}
