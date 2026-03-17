import { createClient } from "@/lib/supabase/client"

export interface WeeklyReportRecipient {
  id: string
  tech_company_id: string
  user_id: string
  is_active: boolean
  created_at: string
  updated_at: string
  tech_company?: {
    id: string
    name: string
  }
  user?: {
    id: string
    email: string
    first_name: string
    last_name: string
  }
}

export interface CreateWeeklyReportRecipientData {
  tech_company_id: string
  user_id: string
  is_active?: boolean
}

export class WeeklyReportRecipientsService {
  private supabase = createClient()

  async getRecipients(): Promise<WeeklyReportRecipient[]> {
    const { data, error } = await this.supabase
      .from("weekly_report_recipients")
      .select(`
        *,
        tech_company:tech_companies(id, name),
        user:users(id, email, first_name, last_name)
      `)
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching weekly report recipients:", error)
      throw error
    }

    return data || []
  }

  async getRecipientsByTechCompany(techCompanyId: string): Promise<WeeklyReportRecipient[]> {
    const { data, error } = await this.supabase
      .from("weekly_report_recipients")
      .select(`
        *,
        tech_company:tech_companies(id, name),
        user:users(id, email, first_name, last_name)
      `)
      .eq("tech_company_id", techCompanyId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching recipients by tech company:", error)
      throw error
    }

    return data || []
  }

  async createRecipient(data: CreateWeeklyReportRecipientData): Promise<WeeklyReportRecipient> {
    const { data: result, error } = await this.supabase
      .from("weekly_report_recipients")
      .insert({
        ...data,
        is_active: data.is_active ?? true,
      })
      .select(`
        *,
        tech_company:tech_companies(id, name),
        user:users(id, email, first_name, last_name)
      `)
      .single()

    if (error) {
      console.error("Error creating weekly report recipient:", error)
      throw error
    }

    return result
  }

  async updateRecipient(id: string, updates: Partial<CreateWeeklyReportRecipientData>): Promise<WeeklyReportRecipient> {
    const { data, error } = await this.supabase
      .from("weekly_report_recipients")
      .update(updates)
      .eq("id", id)
      .select(`
        *,
        tech_company:tech_companies(id, name),
        user:users(id, email, first_name, last_name)
      `)
      .single()

    if (error) {
      console.error("Error updating weekly report recipient:", error)
      throw error
    }

    return data
  }

  async deleteRecipient(id: string): Promise<void> {
    const { error } = await this.supabase.from("weekly_report_recipients").delete().eq("id", id)

    if (error) {
      console.error("Error deleting weekly report recipient:", error)
      throw error
    }
  }

  async toggleRecipientStatus(id: string): Promise<WeeklyReportRecipient> {
    // First get current status
    const { data: current, error: fetchError } = await this.supabase
      .from("weekly_report_recipients")
      .select("is_active")
      .eq("id", id)
      .single()

    if (fetchError) {
      console.error("Error fetching current recipient status:", fetchError)
      throw fetchError
    }

    // Toggle the status
    const { data, error } = await this.supabase
      .from("weekly_report_recipients")
      .update({ is_active: !current.is_active })
      .eq("id", id)
      .select(`
        *,
        tech_company:tech_companies(id, name),
        user:users(id, email, first_name, last_name)
      `)
      .single()

    if (error) {
      console.error("Error toggling recipient status:", error)
      throw error
    }

    return data
  }
}

export const weeklyReportRecipientsService = new WeeklyReportRecipientsService()
