import { createServerClient } from "@/lib/supabase/server"
import { format, addDays, startOfDay } from "date-fns"
import { es, enUS, pt } from "date-fns/locale"
import { Resend } from "resend"

// Roles de ScaleUp que pueden ver compromisos semanales
const SCALEUP_ROLES = ["Admin", "BDD"]

interface TaskWithDetails {
  id: string
  title: string
  description: string | null
  due_date: string | null
  status: string
  priority: string | null
  is_commitment: boolean
  created_at: string
  assigned_to: string
  assigned_by: string
  assigned_to_user: { id: string; first_name: string; last_name: string } | null
  assigned_by_user: { id: string; first_name: string; last_name: string } | null
  opportunity: { id: string; title: string; partner: { id: string; name: string } | null; tech_company: { id: string; name: string } | null } | null
  tech_company: { id: string; name: string } | null
  partner: { id: string; name: string } | null
}

interface CategorizedTasks {
  // Mis tareas (soy responsable)
  myTasks: {
    commitments: {
      overdue: TaskWithDetails[]
      dueSoon: TaskWithDetails[]
      other: TaskWithDetails[]
    }
    regular: {
      overdue: TaskWithDetails[]
      dueSoon: TaskWithDetails[]
      other: TaskWithDetails[]
    }
  }
  // Tareas que asigné a otros
  assignedToOthers: {
    commitments: {
      overdue: TaskWithDetails[]
      dueSoon: TaskWithDetails[]
      other: TaskWithDetails[]
    }
    regular: {
      overdue: TaskWithDetails[]
      dueSoon: TaskWithDetails[]
      other: TaskWithDetails[]
    }
  }
}

export interface DailyEmailData {
  user: {
    id: string
    email: string
    first_name: string
    last_name: string
    preferred_language: string
    role_code: string | null
  }
  tasks: CategorizedTasks
  isScaleUpUser: boolean
  stats: {
    totalMyTasks: number
    totalAssignedToOthers: number
    overdueCount: number
  }
}

export class DailyEmailService {
  private static resend = new Resend(process.env.RESEND_API_KEY)

  /**
   * Obtiene todos los usuarios que deben recibir el email diario
   * Criterio: is_active = true AND receive_daily_email = true
   */
  static async getUsersForDailyEmail() {
    const supabase = createServerClient()

    try {
      const { data, error } = await supabase
        .from("users")
        .select(`
          id, email, first_name, last_name, preferred_language,
          roles (code)
        `)
        .eq("is_active", true)
        .eq("receive_daily_email", true)

      if (error) {
        console.error("Error al obtener usuarios para email diario:", error)
        return []
      }

      console.log("Usuarios para email diario:", data?.length || 0)

      return (
        data?.map((user) => ({
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          preferred_language: user.preferred_language || "es",
          role_code: (user.roles as any)?.code || null,
        })) || []
      )
    } catch (error) {
      console.error("Error inesperado al obtener usuarios:", error)
      return []
    }
  }

  /**
   * Categoriza las tareas según los criterios:
   * - Mis tareas vs tareas que asigné a otros
   * - Compromisos semanales vs regulares (solo para ScaleUp)
   * - Vencidas, próximas a vencer, otras
   */
  private static categorizeTasks(
    tasks: TaskWithDetails[],
    userId: string,
    isScaleUpUser: boolean
  ): CategorizedTasks {
    const today = startOfDay(new Date())
    const threeDaysFromNow = addDays(today, 3)

    const result: CategorizedTasks = {
      myTasks: {
        commitments: { overdue: [], dueSoon: [], other: [] },
        regular: { overdue: [], dueSoon: [], other: [] },
      },
      assignedToOthers: {
        commitments: { overdue: [], dueSoon: [], other: [] },
        regular: { overdue: [], dueSoon: [], other: [] },
      },
    }

    for (const task of tasks) {
      // Determinar si es mi tarea o si la asigné a otro
      const isMyTask = task.assigned_to === userId
      const targetGroup = isMyTask ? result.myTasks : result.assignedToOthers

      // Determinar si es compromiso (solo para ScaleUp)
      const isCommitment = isScaleUpUser && task.is_commitment
      const categoryGroup = isCommitment ? targetGroup.commitments : targetGroup.regular

      // Determinar urgencia basada en fecha de vencimiento
      if (task.due_date) {
        const dueDate = new Date(task.due_date)
        if (dueDate < today) {
          categoryGroup.overdue.push(task)
        } else if (dueDate <= threeDaysFromNow) {
          categoryGroup.dueSoon.push(task)
        } else {
          categoryGroup.other.push(task)
        }
      } else {
        // Sin fecha de vencimiento va a "other"
        categoryGroup.other.push(task)
      }
    }

    // Ordenar cada grupo por fecha de vencimiento
    const sortByDueDate = (a: TaskWithDetails, b: TaskWithDetails) => {
      if (!a.due_date) return 1
      if (!b.due_date) return -1
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
    }

    // Ordenar todos los arrays
    for (const group of [result.myTasks, result.assignedToOthers]) {
      for (const category of [group.commitments, group.regular]) {
        category.overdue.sort(sortByDueDate)
        category.dueSoon.sort(sortByDueDate)
        category.other.sort(sortByDueDate)
      }
    }

    return result
  }

  /**
   * Cuenta el total de tareas en un grupo categorizado
   */
  private static countTasksInGroup(group: CategorizedTasks["myTasks"]): number {
    return (
      group.commitments.overdue.length +
      group.commitments.dueSoon.length +
      group.commitments.other.length +
      group.regular.overdue.length +
      group.regular.dueSoon.length +
      group.regular.other.length
    )
  }

  /**
   * Obtiene los datos para el email diario de un usuario específico
   */
  static async getDailyEmailData(userId: string, roleCode: string | null): Promise<DailyEmailData | null> {
    const supabase = createServerClient()

    try {
      // Obtener información del usuario
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("id, email, first_name, last_name, preferred_language")
        .eq("id", userId)
        .single()

      if (userError || !user) {
        console.error(`Error al obtener usuario ${userId}:`, userError)
        return null
      }

      const isScaleUpUser = roleCode ? SCALEUP_ROLES.includes(roleCode) : false

      // Obtener todas las tareas pendientes donde el usuario es responsable o asignador
      const { data: tasks, error: tasksError } = await supabase
        .from("tasks")
        .select(`
          id, title, description, due_date, status, priority, is_commitment, created_at,
          assigned_to, assigned_by,
          assigned_to_user:users!tasks_assigned_to_fkey(id, first_name, last_name),
          assigned_by_user:users!tasks_assigned_by_fkey(id, first_name, last_name),
          opportunity:opportunities(id, title, partner:partners(id, name), tech_company:tech_companies(id, name)),
          tech_company:tech_companies(id, name),
          partner:partners(id, name)
        `)
        .or(`assigned_to.eq.${userId},assigned_by.eq.${userId}`)
        .not("status", "in", "(completed,cancelled)")
        .order("due_date", { ascending: true, nullsFirst: false })

      if (tasksError) {
        console.error(`Error al obtener tareas para ${userId}:`, tasksError)
      }

      // Filtrar las tareas donde el usuario asignó a OTROS (no a sí mismo)
      const relevantTasks = (tasks || []).filter((task: any) => {
        // Si es mi tarea (soy responsable), incluirla
        if (task.assigned_to === userId) return true
        // Si la asigné a otro (no a mí mismo), incluirla
        if (task.assigned_by === userId && task.assigned_to !== userId) return true
        return false
      }) as TaskWithDetails[]

      // Categorizar las tareas
      const categorizedTasks = this.categorizeTasks(relevantTasks, userId, isScaleUpUser)

      // Calcular estadísticas
      const totalMyTasks = this.countTasksInGroup(categorizedTasks.myTasks)
      const totalAssignedToOthers = this.countTasksInGroup(categorizedTasks.assignedToOthers)
      
      const overdueCount = 
        categorizedTasks.myTasks.commitments.overdue.length +
        categorizedTasks.myTasks.regular.overdue.length +
        categorizedTasks.assignedToOthers.commitments.overdue.length +
        categorizedTasks.assignedToOthers.regular.overdue.length

      return {
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          preferred_language: user.preferred_language || "es",
          role_code: roleCode,
        },
        tasks: categorizedTasks,
        isScaleUpUser,
        stats: {
          totalMyTasks,
          totalAssignedToOthers,
          overdueCount,
        },
      }
    } catch (error) {
      console.error(`Error inesperado al obtener datos para ${userId}:`, error)
      return null
    }
  }

  /**
   * Genera el HTML del email diario con la nueva estructura
   */
  static generateDailyEmailHtml(data: DailyEmailData, isDebug = false): string {
    const { user, tasks, isScaleUpUser, stats } = data
    const language = user.preferred_language || "es"

    // Seleccionar locale para fechas
    const getLocale = () => {
      switch (language) {
        case "en": return enUS
        case "pt": return pt
        default: return es
      }
    }
    const locale = getLocale()

    // Traducciones
    const translations = {
      es: {
        title: "Tareas Pendientes",
        greeting: `Hola ${user.first_name}`,
        myTasks: "Mis Tareas",
        assignedToOthers: "Tareas que Asigné",
        commitments: "Compromisos Semanales",
        overdue: "Vencidas",
        dueSoon: "Próximas a Vencer",
        otherTasks: "Otras Tareas",
        dueDate: "Vence",
        assignedTo: "Asignada a",
        assignedBy: "Asignada por",
        priority: "Prioridad",
        noTasks: "Sin tareas pendientes",
        relatedTo: "Relacionada con",
        opportunity: "Oportunidad",
        partner: "Partner",
        techCompany: "Tech Company",
        footer: "Este es un email automático generado por ScaleUp CRM.",
        debugNote: "MODO DEBUG: Email de prueba para",
        overdueLabel: "VENCIDA",
        today: "Hoy",
        tomorrow: "Mañana",
        days: "días",
      },
      en: {
        title: "Pending Tasks",
        greeting: `Hello ${user.first_name}`,
        myTasks: "My Tasks",
        assignedToOthers: "Tasks I Assigned",
        commitments: "Weekly Commitments",
        overdue: "Overdue",
        dueSoon: "Due Soon",
        otherTasks: "Other Tasks",
        dueDate: "Due",
        assignedTo: "Assigned to",
        assignedBy: "Assigned by",
        priority: "Priority",
        noTasks: "No pending tasks",
        relatedTo: "Related to",
        opportunity: "Opportunity",
        partner: "Partner",
        techCompany: "Tech Company",
        footer: "This is an automatic email generated by ScaleUp CRM.",
        debugNote: "DEBUG MODE: Test email for",
        overdueLabel: "OVERDUE",
        today: "Today",
        tomorrow: "Tomorrow",
        days: "days",
      },
      pt: {
        title: "Tarefas Pendentes",
        greeting: `Olá ${user.first_name}`,
        myTasks: "Minhas Tarefas",
        assignedToOthers: "Tarefas que Atribuí",
        commitments: "Compromissos Semanais",
        overdue: "Vencidas",
        dueSoon: "Prestes a Vencer",
        otherTasks: "Outras Tarefas",
        dueDate: "Vencimento",
        assignedTo: "Atribuída a",
        assignedBy: "Atribuída por",
        priority: "Prioridade",
        noTasks: "Sem tarefas pendentes",
        relatedTo: "Relacionado com",
        opportunity: "Oportunidade",
        partner: "Parceiro",
        techCompany: "Tech Company",
        footer: "Este é um email automático gerado pelo ScaleUp CRM.",
        debugNote: "MODO DEBUG: Email de teste para",
        overdueLabel: "VENCIDA",
        today: "Hoje",
        tomorrow: "Amanhã",
        days: "dias",
      },
    }

    const t = translations[language as keyof typeof translations] || translations.es

    // Colores
    const colors = {
      primary: "#0055b8",
      overdue: "#dc2626",
      dueSoon: "#f59e0b",
      commitment: "#7c3aed",
      text: "#1f2937",
      textMuted: "#6b7280",
      border: "#e5e7eb",
      background: "#f9fafb",
      white: "#ffffff",
    }

    // Función para formatear fechas
    const formatDate = (date: string | null) => {
      if (!date) return ""
      return format(new Date(date), "d MMM", { locale })
    }

    // Función para obtener el label de urgencia
    const getUrgencyLabel = (dueDate: string | null): { text: string; color: string } | null => {
      if (!dueDate) return null
      const due = new Date(dueDate)
      const today = startOfDay(new Date())
      const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

      if (diffDays < 0) return { text: t.overdueLabel, color: colors.overdue }
      if (diffDays === 0) return { text: t.today, color: colors.overdue }
      if (diffDays === 1) return { text: t.tomorrow, color: colors.dueSoon }
      if (diffDays <= 3) return { text: `${diffDays} ${t.days}`, color: colors.dueSoon }
      return null
    }

    // Función para generar el HTML de una tarea
    const renderTask = (task: TaskWithDetails, showAssignedTo: boolean) => {
      const urgency = getUrgencyLabel(task.due_date)
      const relations: string[] = []
      
      if (task.opportunity) {
        relations.push(`${t.opportunity}: ${task.opportunity.title}`)
      }
      if (task.partner) {
        relations.push(`${t.partner}: ${task.partner.name}`)
      }
      if (task.tech_company) {
        relations.push(`${t.techCompany}: ${task.tech_company.name}`)
      }

      return `
        <tr>
          <td style="padding: 12px 16px; border-bottom: 1px solid ${colors.border};">
            <div style="margin-bottom: 4px;">
              <span style="font-weight: 600; color: ${colors.text};">${task.title}</span>
              ${urgency ? `<span style="margin-left: 8px; padding: 2px 8px; background-color: ${urgency.color}; color: white; font-size: 11px; font-weight: 600; border-radius: 4px;">${urgency.text}</span>` : ''}
              ${task.is_commitment && isScaleUpUser ? `<span style="margin-left: 8px; padding: 2px 8px; background-color: ${colors.commitment}; color: white; font-size: 11px; font-weight: 600; border-radius: 4px;">CS</span>` : ''}
            </div>
            ${task.due_date ? `<div style="font-size: 13px; color: ${colors.textMuted};">${t.dueDate}: ${formatDate(task.due_date)}</div>` : ''}
            ${showAssignedTo && task.assigned_to_user ? `<div style="font-size: 13px; color: ${colors.textMuted};">${t.assignedTo}: ${task.assigned_to_user.first_name} ${task.assigned_to_user.last_name}</div>` : ''}
            ${!showAssignedTo && task.assigned_by_user ? `<div style="font-size: 13px; color: ${colors.textMuted};">${t.assignedBy}: ${task.assigned_by_user.first_name} ${task.assigned_by_user.last_name}</div>` : ''}
            ${relations.length > 0 ? `<div style="font-size: 12px; color: ${colors.textMuted}; margin-top: 4px;">${relations.join(' • ')}</div>` : ''}
          </td>
        </tr>
      `
    }

    // Función para renderizar un grupo de tareas con título
    const renderTaskGroup = (
      tasksList: TaskWithDetails[],
      title: string,
      showAssignedTo: boolean,
      highlightColor?: string
    ): string => {
      if (tasksList.length === 0) return ''
      
      return `
        <tr>
          <td style="padding: 8px 16px; background-color: ${highlightColor || colors.background};">
            <span style="font-size: 12px; font-weight: 600; color: ${highlightColor ? colors.white : colors.textMuted}; text-transform: uppercase; letter-spacing: 0.5px;">${title}</span>
          </td>
        </tr>
        ${tasksList.map(task => renderTask(task, showAssignedTo)).join('')}
      `
    }

    // Generar sección de "Mis Tareas"
    const renderMyTasks = (): string => {
      if (stats.totalMyTasks === 0) return ''
      
      const sections: string[] = []
      
      // Compromisos semanales (solo ScaleUp)
      if (isScaleUpUser) {
        const commitmentOverdue = renderTaskGroup(tasks.myTasks.commitments.overdue, `${t.commitments} - ${t.overdue}`, false, colors.overdue)
        const commitmentDueSoon = renderTaskGroup(tasks.myTasks.commitments.dueSoon, `${t.commitments} - ${t.dueSoon}`, false, colors.dueSoon)
        const commitmentOther = renderTaskGroup(tasks.myTasks.commitments.other, t.commitments, false, colors.commitment)
        sections.push(commitmentOverdue, commitmentDueSoon, commitmentOther)
      }
      
      // Tareas regulares
      const regularOverdue = renderTaskGroup(tasks.myTasks.regular.overdue, t.overdue, false, colors.overdue)
      const regularDueSoon = renderTaskGroup(tasks.myTasks.regular.dueSoon, t.dueSoon, false, colors.dueSoon)
      const regularOther = renderTaskGroup(tasks.myTasks.regular.other, t.otherTasks, false)
      sections.push(regularOverdue, regularDueSoon, regularOther)
      
      const content = sections.filter(s => s).join('')
      if (!content) return ''
      
      return `
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px; border: 1px solid ${colors.border}; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="padding: 16px; background-color: ${colors.primary};">
              <span style="font-size: 16px; font-weight: 700; color: ${colors.white};">${t.myTasks}</span>
              <span style="margin-left: 8px; padding: 2px 8px; background-color: rgba(255,255,255,0.2); color: white; font-size: 12px; border-radius: 12px;">${stats.totalMyTasks}</span>
            </td>
          </tr>
          ${content}
        </table>
      `
    }

    // Generar sección de "Tareas que Asigné"
    const renderAssignedToOthers = (): string => {
      if (stats.totalAssignedToOthers === 0) return ''
      
      const sections: string[] = []
      
      // Compromisos semanales (solo ScaleUp)
      if (isScaleUpUser) {
        const commitmentOverdue = renderTaskGroup(tasks.assignedToOthers.commitments.overdue, `${t.commitments} - ${t.overdue}`, true, colors.overdue)
        const commitmentDueSoon = renderTaskGroup(tasks.assignedToOthers.commitments.dueSoon, `${t.commitments} - ${t.dueSoon}`, true, colors.dueSoon)
        const commitmentOther = renderTaskGroup(tasks.assignedToOthers.commitments.other, t.commitments, true, colors.commitment)
        sections.push(commitmentOverdue, commitmentDueSoon, commitmentOther)
      }
      
      // Tareas regulares
      const regularOverdue = renderTaskGroup(tasks.assignedToOthers.regular.overdue, t.overdue, true, colors.overdue)
      const regularDueSoon = renderTaskGroup(tasks.assignedToOthers.regular.dueSoon, t.dueSoon, true, colors.dueSoon)
      const regularOther = renderTaskGroup(tasks.assignedToOthers.regular.other, t.otherTasks, true)
      sections.push(regularOverdue, regularDueSoon, regularOther)
      
      const content = sections.filter(s => s).join('')
      if (!content) return ''
      
      return `
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px; border: 1px solid ${colors.border}; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="padding: 16px; background-color: ${colors.textMuted};">
              <span style="font-size: 16px; font-weight: 700; color: ${colors.white};">${t.assignedToOthers}</span>
              <span style="margin-left: 8px; padding: 2px 8px; background-color: rgba(255,255,255,0.2); color: white; font-size: 12px; border-radius: 12px;">${stats.totalAssignedToOthers}</span>
            </td>
          </tr>
          ${content}
        </table>
      `
    }

    // Fecha actual
    const today = format(new Date(), "EEEE, d 'de' MMMM", { locale })

    // HTML completo
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: ${colors.background}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" style="padding: 24px 16px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px;">
                <!-- Header -->
                <tr>
                  <td style="background-color: ${colors.primary}; padding: 24px; border-radius: 8px 8px 0 0;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td>
                          <div style="font-size: 24px; font-weight: 700; color: ${colors.white}; margin-bottom: 4px;">${t.title}</div>
                          <div style="font-size: 14px; color: rgba(255,255,255,0.8);">${today}</div>
                        </td>
                        <td align="right" valign="top">
                          <img src="https://crm.scaleup-global.com/images/scaleup-logo-white.png" alt="ScaleUp" style="height: 32px; width: auto;" />
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="background-color: ${colors.white}; padding: 24px; border-radius: 0 0 8px 8px;">
                    ${isDebug ? `
                      <div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 12px; border-radius: 6px; margin-bottom: 16px;">
                        <strong>${t.debugNote}:</strong> ${user.first_name} ${user.last_name} (${user.email})
                      </div>
                    ` : ''}
                    
                    <div style="font-size: 18px; font-weight: 600; color: ${colors.text}; margin-bottom: 16px;">${t.greeting},</div>
                    
                    ${renderMyTasks()}
                    ${renderAssignedToOthers()}
                    
                    <!-- Footer -->
                    <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid ${colors.border}; text-align: center; font-size: 12px; color: ${colors.textMuted};">
                      ${t.footer}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  }

  /**
   * Envía el email diario a un usuario específico
   */
  static async sendDailyEmail(
    userId: string,
    roleCode: string | null,
    isDebug = false
  ): Promise<{ success: boolean; message?: string; skipped?: boolean }> {
    try {
      console.log(`[DailyEmail] Iniciando envío para usuario: ${userId} (Debug: ${isDebug})`)

      if (!process.env.RESEND_API_KEY) {
        console.error("[DailyEmail] RESEND_API_KEY no está configurada")
        return { success: false, message: "RESEND_API_KEY no está configurada" }
      }

      const emailData = await this.getDailyEmailData(userId, roleCode)

      if (!emailData) {
        console.log(`[DailyEmail] No se pudieron obtener datos para usuario: ${userId}`)
        return { success: false, message: "No se pudieron obtener los datos del usuario" }
      }

      // Verificar si hay tareas pendientes
      const hasTasks = emailData.stats.totalMyTasks > 0 || emailData.stats.totalAssignedToOthers > 0

      if (!hasTasks && !isDebug) {
        console.log(`[DailyEmail] Sin tareas pendientes para ${emailData.user.email}, omitiendo email`)
        return { success: true, skipped: true, message: "Sin tareas pendientes" }
      }

      console.log(`[DailyEmail] Datos para ${emailData.user.email}:`, {
        myTasks: emailData.stats.totalMyTasks,
        assignedToOthers: emailData.stats.totalAssignedToOthers,
        overdue: emailData.stats.overdueCount,
      })

      const htmlContent = this.generateDailyEmailHtml(emailData, isDebug)
      const todayFormatted = format(new Date(), "dd/MM/yyyy")
      const subject = `ScaleUp - Tareas Pendientes ${todayFormatted}${isDebug ? " (DEBUG)" : ""}`

      const defaultFrom = process.env.NEXT_PUBLIC_EMAIL_FROM || "ScaleUp CRM <no-reply@scaleup-global.com>"
      const recipientEmail = isDebug ? "matias@scaleup-global.com" : emailData.user.email

      console.log(`[DailyEmail] Enviando email a ${recipientEmail}`)

      const { data, error } = await this.resend.emails.send({
        from: defaultFrom,
        to: [recipientEmail],
        subject: subject,
        html: htmlContent,
        reply_to: defaultFrom,
      })

      if (error) {
        console.error(`[DailyEmail] Error al enviar email:`, error)
        return { success: false, message: error.message || "Error al enviar el email" }
      }

      console.log(`[DailyEmail] Email enviado exitosamente a ${recipientEmail}:`, data)
      return { success: true, message: `Email enviado a ${recipientEmail}` }
    } catch (error) {
      console.error(`[DailyEmail] Error inesperado:`, error)
      return { success: false, message: error instanceof Error ? error.message : "Error desconocido" }
    }
  }

  /**
   * Envía emails diarios a todos los usuarios configurados
   */
  static async sendDailyEmailsToAllUsers(): Promise<{
    success: boolean
    results: Array<{ userId: string; email: string; success: boolean; skipped?: boolean; message?: string }>
  }> {
    try {
      const users = await this.getUsersForDailyEmail()
      const results = []

      console.log(`[DailyEmail] Iniciando envío a ${users.length} usuarios`)

      for (const user of users) {
        console.log(`[DailyEmail] Procesando ${user.email}...`)
        const result = await this.sendDailyEmail(user.id, user.role_code, false)

        results.push({
          userId: user.id,
          email: user.email,
          success: result.success,
          skipped: result.skipped,
          message: result.message,
        })

        // Pausa entre emails para evitar rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500))
      }

      const sentCount = results.filter((r) => r.success && !r.skipped).length
      const skippedCount = results.filter((r) => r.skipped).length
      console.log(`[DailyEmail] Completado: ${sentCount} enviados, ${skippedCount} omitidos (sin tareas)`)

      return { success: true, results }
    } catch (error) {
      console.error("[DailyEmail] Error al enviar emails:", error)
      return { success: false, results: [] }
    }
  }

  // Mantener método legacy para compatibilidad
  static async getScaleUpUsers() {
    return this.getUsersForDailyEmail()
  }
}
