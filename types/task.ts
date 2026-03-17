export interface Task {
  id: string
  title: string
  description?: string | null
  status: "pending" | "in_progress" | "completed" | "cancelled"
  due_date?: string | null
  task_type_id?: string | null
  assigned_to: string
  assigned_by?: string | null
  tech_company_id?: string | null
  partner_id?: string | null
  opportunity_id?: string | null
  parent_task_id?: string | null
  created_at: string
  updated_at?: string | null
  priority?: "low" | "medium" | "high" | null

  // Relaciones
  assigned_to_user?: {
    id: string
    first_name: string
    last_name: string
  }
  assigned_by_user?: {
    id: string
    first_name: string
    last_name: string
  }
  tech_company?: {
    id: string
    name: string
  }
  partner?: {
    id: string
    name: string
  }
  opportunity?: {
    id: string
    title: string
  }
  task_type?: {
    id: string
    name: string
    code?: string
  }
}

export interface TaskType {
  id: string
  name: string
  code?: string
}

export interface TaskInsert {
  title: string
  description?: string | null
  status: "pending" | "in_progress" | "completed" | "cancelled"
  due_date?: Date | null
  task_type_id?: string | null
  assigned_to: string
  assigned_by?: string | null
  tech_company_id?: string | null
  partner_id?: string | null
  opportunity_id?: string | null
  parent_task_id?: string | null
}

export interface TaskUpdate {
  title?: string
  description?: string | null
  status?: "pending" | "in_progress" | "completed" | "cancelled"
  due_date?: Date | null
  task_type_id?: string | null
  assigned_to: string
  tech_company_id?: string | null
  partner_id?: string | null
  opportunity_id?: string | null
  updated_at?: string
}

export const taskStatusOptions = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
]
