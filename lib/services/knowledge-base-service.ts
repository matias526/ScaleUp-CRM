import { createClient } from "@/lib/supabase/client"

export interface KnowledgeBaseQuestion {
  id: string
  question: string
  answer: string
  tech_company_id: string
  created_by: string
  created_at: string
  updated_at: string
  last_modified_by: string | null
  is_approved: boolean
  approved_at: string | null
  approved_by: string | null
  version: number
  tech_company?: {
    id: string
    name: string
    logo_url: string | null
  }
  creator?: {
    id: string
    first_name: string
    last_name: string
  }
  approver?: {
    id: string
    first_name: string
    last_name: string
  }
  labels?: KnowledgeBaseLabel[]
  attachments?: KnowledgeBaseAttachment[]
}

export interface KnowledgeBaseLabel {
  id: string
  name: string
  color: string | null
  created_at: string
}

export interface KnowledgeBaseAttachment {
  id: string
  question_id: string
  file_name: string
  file_url: string
  file_type: string
  file_size: number
  uploaded_by: string
  created_at: string
}

export interface KnowledgeBaseTechCompanyApprover {
  id: string
  tech_company_id: string
  user_id: string
  created_at: string
  tech_company?: {
    id: string
    name: string
  }
  user?: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
}

export class KnowledgeBaseService {
  /**
   * Obtener todas las preguntas con filtros opcionales
   */
  static async getQuestions(filters?: {
    tech_company_id?: string
    label_id?: string
    search?: string
    approved_only?: boolean
  }): Promise<KnowledgeBaseQuestion[]> {
    const supabase = createClient()

    let query = supabase
      .from("knowledge_base_questions")
      .select(
        `
        *,
        tech_company:tech_companies(id, name, logo_url),
        creator:users!knowledge_base_questions_created_by_fkey(id, first_name, last_name),
        approver:users!knowledge_base_questions_approved_by_fkey(id, first_name, last_name)
      `,
      )
      .order("created_at", { ascending: false })

    // Aplicar filtros
    if (filters?.tech_company_id) {
      query = query.eq("tech_company_id", filters.tech_company_id)
    }

    if (filters?.approved_only) {
      query = query.eq("is_approved", true)
    }

    if (filters?.search) {
      query = query.or(`question.ilike.%${filters.search}%,answer.ilike.%${filters.search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching questions:", error)
      throw error
    }

    // Si hay filtro por label, necesitamos hacer una consulta adicional
    if (filters?.label_id && data) {
      const questionsWithLabel = await Promise.all(
        data.map(async (question) => {
          const { data: labels } = await supabase
            .from("knowledge_base_question_labels")
            .select("label_id")
            .eq("question_id", question.id)
            .eq("label_id", filters.label_id)

          return labels && labels.length > 0 ? question : null
        }),
      )

      return questionsWithLabel.filter((q) => q !== null) as KnowledgeBaseQuestion[]
    }

    return data || []
  }

  /**
   * Obtener una pregunta por ID con todos sus detalles
   */
  static async getQuestionById(id: string): Promise<KnowledgeBaseQuestion | null> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("knowledge_base_questions")
      .select(
        `
        *,
        tech_company:tech_companies(id, name, logo_url),
        creator:users!knowledge_base_questions_created_by_fkey(id, first_name, last_name),
        approver:users!knowledge_base_questions_approved_by_fkey(id, first_name, last_name)
      `,
      )
      .eq("id", id)
      .single()

    if (error) {
      console.error("Error fetching question:", error)
      return null
    }

    // Obtener labels
    const { data: questionLabels } = await supabase
      .from("knowledge_base_question_labels")
      .select("label:knowledge_base_labels(*)")
      .eq("question_id", id)

    // Obtener attachments
    const { data: attachments } = await supabase.from("knowledge_base_attachments").select("*").eq("question_id", id)

    return {
      ...data,
      labels: questionLabels?.map((ql: any) => ql.label) || [],
      attachments: attachments || [],
    }
  }

  /**
   * Obtener todos los labels
   */
  static async getLabels(): Promise<KnowledgeBaseLabel[]> {
    const supabase = createClient()

    const { data, error } = await supabase.from("knowledge_base_labels").select("*").order("name")

    if (error) {
      console.error("Error fetching labels:", error)
      throw error
    }

    return data || []
  }

  /**
   * Obtener aprobadores por TechCompany
   */
  static async getApproversByTechCompany(tech_company_id: string): Promise<KnowledgeBaseTechCompanyApprover[]> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("knowledge_base_tech_company_approvers")
      .select(
        `
        *,
        user:users(id, first_name, last_name, email)
      `,
      )
      .eq("tech_company_id", tech_company_id)

    if (error) {
      console.error("Error fetching approvers:", error)
      throw error
    }

    return data || []
  }

  /**
   * Verificar si el usuario actual puede aprobar preguntas de una TechCompany
   */
  static async canUserApprove(user_id: string, tech_company_id: string): Promise<boolean> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("knowledge_base_tech_company_approvers")
      .select("id")
      .eq("user_id", user_id)
      .eq("tech_company_id", tech_company_id)
      .single()

    return !error && data !== null
  }

  /**
   * Obtener todas las TechCompanies activas
   */
  static async getTechCompanies(): Promise<Array<{ id: string; name: string; logo_url: string | null }>> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("tech_companies")
      .select("id, name, logo_url")
      .eq("is_active", true)
      .order("name")

    if (error) {
      console.error("Error fetching tech companies:", error)
      throw error
    }

    return data || []
  }
}
