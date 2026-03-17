import { createClient } from "@/lib/supabase/server"
import { format, addDays, startOfDay, endOfDay } from "date-fns"
import { es, enUS, pt } from "date-fns/locale"
import { Resend } from "resend"

export interface DailyEmailData {
  user: {
    id: string
    email: string
    first_name: string
    last_name: string
    preferred_language: string
  }
  upcomingTasks: any[]
  newAssignedTasks: any[]
  newAssignedOpportunities: any[]
  stats: {
    totalUpcomingTasks: number
    overdueTasks: number
    newTasksCount: number
    newOpportunitiesCount: number
  }
}

export class DailyEmailService {
  private static resend = new Resend(process.env.RESEND_API_KEY)

  /**
   * Obtiene todos los usuarios de ScaleUp con roles Admin y BDD
   */
  static async getScaleUpUsers() {
    const supabase = createClient()

    try {
      // Query corregido - usar el SQL directo o la sintaxis correcta de Supabase
      const { data, error } = await supabase
        .from("users")
        .select(`
        id, email, first_name, last_name, preferred_language,
        roles!inner (code)
      `)
        .eq("is_active", true)
        .in("roles.code", ["Admin", "BDD"]) // Corregido: mayúsculas y usar inner join

      if (error) {
        console.error("Error al obtener usuarios de ScaleUp:", error)
        return []
      }

      console.log("Usuarios obtenidos del query:", data?.length || 0)
      console.log(
        "Usuarios con roles:",
        data?.map((u) => ({ email: u.email, role: u.roles?.code })),
      )

      return (
        data?.map((user) => ({
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          preferred_language: user.preferred_language || "es",
          role_code: user.roles?.code,
        })) || []
      )
    } catch (error) {
      console.error("Error inesperado al obtener usuarios:", error)
      return []
    }
  }

  /**
   * Obtiene los datos para el email diario de un usuario específico
   */
  static async getDailyEmailData(userId: string): Promise<DailyEmailData | null> {
    const supabase = createClient()

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

      // Fechas para los filtros
      const today = new Date()
      const todayStart = startOfDay(today)
      const threeDaysFromNow = endOfDay(addDays(today, 3))
      const yesterdayStart = startOfDay(addDays(today, -1)) // Para tareas nuevas

      // 1. Tareas próximas a vencer (asignadas a él o que él asignó, no finalizadas)
      const { data: upcomingTasks, error: tasksError } = await supabase
        .from("tasks")
        .select(`
          id, title, description, due_date, status, priority, created_at,
          assigned_to_user:users!tasks_assigned_to_fkey(id, first_name, last_name),
          assigned_by_user:users!tasks_assigned_by_fkey(id, first_name, last_name),
          opportunity:opportunities(id, title, partner:partners(id, name), tech_company:tech_companies(id, name)),
          tech_company:tech_companies(id, name),
          partner:partners(id, name)
        `)
        .or(`assigned_to.eq.${userId},assigned_by.eq.${userId}`)
        .not("status", "in", "(completed,cancelled)")
        .or(`due_date.lte.${threeDaysFromNow.toISOString()},due_date.lt.${todayStart.toISOString()}`)
        .order("due_date", { ascending: true, nullsLast: true })

      // 2. Tareas nuevas asignadas a él (creadas en las últimas 24 horas)
      const { data: newAssignedTasks, error: newTasksError } = await supabase
        .from("tasks")
        .select(`
          id, title, description, due_date, status, priority, created_at,
          assigned_by_user:users!tasks_assigned_by_fkey(id, first_name, last_name),
          opportunity:opportunities(id, title, partner:partners(id, name), tech_company:tech_companies(id, name)),
          tech_company:tech_companies(id, name),
          partner:partners(id, name)
        `)
        .eq("assigned_to", userId)
        .gte("created_at", yesterdayStart.toISOString())
        .order("created_at", { ascending: false })

      // 3. Oportunidades nuevas asignadas a él (que no haya creado él)
      const { data: newAssignedOpportunities, error: oppError } = await supabase
        .from("opportunities")
        .select(`
          id, title, description, estimated_close_date, validation_status, created_at,
          stage:pipeline_stages(id, code, display_order),
          tech_company:tech_companies(id, name, logo_url),
          partner:partners(id, name, logo_url),
          end_customer:end_customers(id, name),
          created_by_user:users!opportunities_created_by_fkey(id, first_name, last_name)
        `)
        .eq("assigned_to", userId)
        .neq("created_by", userId)
        .gte("created_at", yesterdayStart.toISOString())
        .order("created_at", { ascending: false })

      if (tasksError) {
        console.error(`Error al obtener tareas próximas para ${userId}:`, tasksError)
      }
      if (newTasksError) {
        console.error(`Error al obtener tareas nuevas para ${userId}:`, newTasksError)
      }
      if (oppError) {
        console.error(`Error al obtener oportunidades nuevas para ${userId}:`, oppError)
      }

      // Calcular estadísticas
      const overdueTasks = (upcomingTasks || []).filter(
        (task) => task.due_date && new Date(task.due_date) < todayStart,
      ).length

      const stats = {
        totalUpcomingTasks: (upcomingTasks || []).length,
        overdueTasks,
        newTasksCount: (newAssignedTasks || []).length,
        newOpportunitiesCount: (newAssignedOpportunities || []).length,
      }

      return {
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          preferred_language: user.preferred_language || "es",
        },
        upcomingTasks: upcomingTasks || [],
        newAssignedTasks: newAssignedTasks || [],
        newAssignedOpportunities: newAssignedOpportunities || [],
        stats,
      }
    } catch (error) {
      console.error(`Error inesperado al obtener datos para ${userId}:`, error)
      return null
    }
  }

  /**
   * Genera el HTML del email diario
   */
  static generateDailyEmailHtml(data: DailyEmailData, isDebug = false): string {
    const { user, upcomingTasks, newAssignedTasks, newAssignedOpportunities, stats } = data
    const language = user.preferred_language || "es"

    // Seleccionar locale para fechas
    const getLocale = () => {
      switch (language) {
        case "en":
          return enUS
        case "pt":
          return pt
        case "es":
        default:
          return es
      }
    }

    const locale = getLocale()

    // Traducciones básicas
    const translations = {
      es: {
        title: "Lista de Tareas Diarias",
        greeting: `Hola ${user.first_name}`,
        subtitle: "Aquí tienes tu resumen diario de actividades pendientes",
        upcomingTasks: "Tareas Próximas a Vencer",
        newTasks: "Tareas Nuevas Asignadas",
        newOpportunities: "Oportunidades Nuevas Asignadas",
        dueDate: "Vence",
        assignedBy: "Asignada por",
        createdBy: "Creada por",
        priority: "Prioridad",
        status: "Estado",
        noItems: "No hay elementos para mostrar",
        overdue: "VENCIDA",
        today: "Hoy",
        tomorrow: "Mañana",
        days: "días",
        estimatedClose: "Cierre estimado",
        stage: "Etapa",
        footer: "Este es un email automático generado por ScaleUp CRM. No responder a este email.",
        debugNote: "MODO DEBUG: Este email contiene la información de",
        relatedTo: "Relacionada con",
        opportunity: "Oportunidad",
        partner: "Partner",
        techCompany: "Tech Company",
      },
      en: {
        title: "Daily Task List",
        greeting: `Hello ${user.first_name}`,
        subtitle: "Here's your daily summary of pending activities",
        upcomingTasks: "Upcoming Tasks",
        newTasks: "New Assigned Tasks",
        newOpportunities: "New Assigned Opportunities",
        dueDate: "Due",
        assignedBy: "Assigned by",
        createdBy: "Created by",
        priority: "Priority",
        status: "Status",
        noItems: "No items to show",
        overdue: "OVERDUE",
        today: "Today",
        tomorrow: "Tomorrow",
        days: "days",
        estimatedClose: "Estimated close",
        stage: "Stage",
        footer: "This is an automatic email generated by ScaleUp CRM. Do not reply to this email.",
        debugNote: "DEBUG MODE: This email contains information for",
        relatedTo: "Related to",
        opportunity: "Opportunity",
        partner: "Partner",
        techCompany: "Tech Company",
      },
      pt: {
        title: "Lista de Tarefas Diárias",
        greeting: `Olá ${user.first_name}`,
        subtitle: "Aqui está seu resumo diário de atividades pendentes",
        upcomingTasks: "Tarefas Próximas ao Vencimento",
        newTasks: "Novas Tarefas Atribuídas",
        newOpportunities: "Novas Oportunidades Atribuídas",
        dueDate: "Vencimento",
        assignedBy: "Atribuída por",
        createdBy: "Criada por",
        priority: "Prioridade",
        status: "Status",
        noItems: "Nenhum item para mostrar",
        overdue: "VENCIDA",
        today: "Hoje",
        tomorrow: "Amanhã",
        days: "dias",
        estimatedClose: "Fechamento estimado",
        stage: "Etapa",
        footer: "Este é um email automático gerado pelo ScaleUp CRM. Não responda a este email.",
        debugNote: "MODO DEBUG: Este email contém informações para",
        relatedTo: "Relacionado com",
        opportunity: "Oportunidade",
        partner: "Parceiro",
        techCompany: "Tech Company",
      },
    }

    const t = translations[language as keyof typeof translations] || translations.es

    // Función para formatear fechas
    const formatDate = (date: string | Date) => {
      if (!date) return ""
      const dateObj = typeof date === "string" ? new Date(date) : date
      return format(dateObj, "PPP", { locale })
    }

    // Función para calcular días hasta vencimiento
    const getDaysUntilDue = (dueDate: string) => {
      if (!dueDate) return ""
      const due = new Date(dueDate)
      const today = new Date()
      const diffTime = due.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays < 0) return t.overdue
      if (diffDays === 0) return t.today
      if (diffDays === 1) return t.tomorrow
      return `${diffDays} ${t.days}`
    }

    // Función para generar información de relación mejorada
    const getRelationInfo = (task: any) => {
      const relations = []

      if (task.opportunity) {
        relations.push(`${t.opportunity}: ${task.opportunity.title}`)
        if (task.opportunity.partner) {
          relations.push(`${t.partner}: ${task.opportunity.partner.name}`)
        }
        if (task.opportunity.tech_company) {
          relations.push(`${t.techCompany}: ${task.opportunity.tech_company.name}`)
        }
      } else {
        if (task.partner) {
          relations.push(`${t.partner}: ${task.partner.name}`)
        }
        if (task.tech_company) {
          relations.push(`${t.techCompany}: ${task.tech_company.name}`)
        }
      }

      if (relations.length === 0) return ""

      return `
        <div style="font-size: 12px; color: #666; margin-top: 8px; padding: 8px; background-color: #f8f9fa; border-radius: 4px;">
          <div style="font-weight: bold; margin-bottom: 4px;">${t.relatedTo}:</div>
          ${relations.map((relation) => `<div style="margin-left: 8px;">• ${relation}</div>`).join("")}
        </div>
      `
    }

    // Color azul de ScaleUp
    const scaleupBlue = "#0055b8"

    // Estilos CSS - Alineado a la izquierda
    const styles = {
      container: "font-family: Arial, sans-serif; max-width: 600px; padding: 20px; background-color: #f9f9f9;",
      header: `background-color: ${scaleupBlue}; color: white; padding: 30px 20px; border-radius: 8px 8px 0 0; position: relative;`,
      logo: "position: absolute; top: 20px; right: 20px;",
      title: "font-size: 28px; font-weight: bold; margin: 0 0 10px 0;",
      date: "font-size: 16px; margin: 0; opacity: 0.9;",
      content: "background-color: white; padding: 20px; border-radius: 0 0 8px 8px;",
      greeting: "font-size: 18px; font-weight: 600; margin-bottom: 10px; color: #333;",
      subtitle: "font-size: 16px; margin-bottom: 20px; color: #666;",
      debugAlert:
        "background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin-bottom: 20px; color: #856404;",
      section: "margin-bottom: 30px;",
      sectionTitle: `font-size: 18px; font-weight: bold; color: ${scaleupBlue}; margin-bottom: 15px; border-bottom: 2px solid ${scaleupBlue}; padding-bottom: 5px;`,
      taskCard:
        "border: 1px solid #e0e0e0; border-radius: 6px; padding: 15px; margin-bottom: 10px; background-color: #fafafa;",
      taskTitle: "font-size: 16px; font-weight: bold; margin-bottom: 8px; color: #333;",
      taskMeta: "font-size: 14px; color: #666; margin-bottom: 5px;",
      overdue: "color: #dc3545; font-weight: bold;",
      priority: "display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: bold;",
      priorityHigh: "background-color: #dc3545; color: white;",
      priorityMedium: "background-color: #ffc107; color: black;",
      priorityLow: "background-color: #28a745; color: white;",
      noItems: "text-align: center; color: #666; font-style: italic; padding: 20px;",
      footer:
        "margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666; text-align: center;",
    }

    // Fecha actual
    const today = format(new Date(), "PPP", { locale })

    // URL del logo de ScaleUp (usando URL absoluta)
    const logoUrl = "https://crm.scaleup-global.com/images/scaleup-logo-white.png"

    // Generar HTML para tareas próximas
    const upcomingTasksHtml =
      upcomingTasks.length > 0
        ? upcomingTasks
            .map((task) => {
              const dueInfo = getDaysUntilDue(task.due_date)
              const isOverdue = dueInfo === t.overdue

              return `
          <div style="${styles.taskCard}">
            <div style="${styles.taskTitle}">${task.title}</div>
            ${task.description ? `<div style="${styles.taskMeta}">${task.description}</div>` : ""}
            <div style="${styles.taskMeta}">
              <strong>${t.dueDate}:</strong> 
              <span style="${isOverdue ? styles.overdue : ""}">${dueInfo}</span>
              ${task.due_date ? ` (${formatDate(task.due_date)})` : ""}
            </div>
            ${
              task.assigned_by_user
                ? `
              <div style="${styles.taskMeta}">
                <strong>${t.assignedBy}:</strong> ${task.assigned_by_user.first_name} ${task.assigned_by_user.last_name}
              </div>
            `
                : ""
            }
            ${
              task.priority
                ? `
              <div style="${styles.taskMeta}">
                <span style="${styles.priority}; ${
                  task.priority === "high"
                    ? styles.priorityHigh
                    : task.priority === "medium"
                      ? styles.priorityMedium
                      : styles.priorityLow
                }">${task.priority.toUpperCase()}</span>
              </div>
            `
                : ""
            }
            ${getRelationInfo(task)}
          </div>
        `
            })
            .join("")
        : `<div style="${styles.noItems}">${t.noItems}</div>`

    // Generar HTML para tareas nuevas
    const newTasksHtml =
      newAssignedTasks.length > 0
        ? newAssignedTasks
            .map(
              (task) => `
        <div style="${styles.taskCard}">
          <div style="${styles.taskTitle}">${task.title}</div>
          ${task.description ? `<div style="${styles.taskMeta}">${task.description}</div>` : ""}
          ${
            task.due_date
              ? `
            <div style="${styles.taskMeta}">
              <strong>${t.dueDate}:</strong> ${formatDate(task.due_date)}
            </div>
          `
              : ""
          }
          ${
            task.assigned_by_user
              ? `
            <div style="${styles.taskMeta}">
              <strong>${t.assignedBy}:</strong> ${task.assigned_by_user.first_name} ${task.assigned_by_user.last_name}
            </div>
          `
              : ""
          }
          ${getRelationInfo(task)}
        </div>
      `,
            )
            .join("")
        : `<div style="${styles.noItems}">${t.noItems}</div>`

    // Generar HTML para oportunidades nuevas
    const newOpportunitiesHtml =
      newAssignedOpportunities.length > 0
        ? newAssignedOpportunities
            .map(
              (opp) => `
        <div style="${styles.taskCard}">
          <div style="${styles.taskTitle}">${opp.title}</div>
          ${opp.description ? `<div style="${styles.taskMeta}">${opp.description}</div>` : ""}
          ${
            opp.estimated_close_date
              ? `
            <div style="${styles.taskMeta}">
              <strong>${t.estimatedClose}:</strong> ${formatDate(opp.estimated_close_date)}
            </div>
          `
              : ""
          }
          ${
            opp.stage
              ? `
            <div style="${styles.taskMeta}">
              <strong>${t.stage}:</strong> ${opp.stage.code}
            </div>
          `
              : ""
          }
          ${
            opp.created_by_user
              ? `
            <div style="${styles.taskMeta}">
              <strong>${t.createdBy}:</strong> ${opp.created_by_user.first_name} ${opp.created_by_user.last_name}
            </div>
          `
              : ""
          }
          ${
            opp.partner || opp.tech_company
              ? `
            <div style="font-size: 12px; color: #666; margin-top: 8px; padding: 8px; background-color: #f8f9fa; border-radius: 4px;">
              <div style="font-weight: bold; margin-bottom: 4px;">${t.relatedTo}:</div>
              ${opp.partner ? `<div style="margin-left: 8px;">• ${t.partner}: ${opp.partner.name}</div>` : ""}
              ${opp.tech_company ? `<div style="margin-left: 8px;">• ${t.techCompany}: ${opp.tech_company.name}</div>` : ""}
            </div>
          `
              : ""
          }
        </div>
      `,
            )
            .join("")
        : `<div style="${styles.noItems}">${t.noItems}</div>`

    // HTML completo
    return `
      <div style="${styles.container}">
        <div style="${styles.header}">
          <div style="${styles.logo}">
            <img src="${logoUrl}" alt="ScaleUp Logo" style="height: 40px; width: auto;" />
          </div>
          <h1 style="${styles.title}">${t.title}</h1>
          <p style="${styles.date}">${today}</p>
        </div>
        
        <div style="${styles.content}">
          ${
            isDebug
              ? `
            <div style="${styles.debugAlert}">
              <strong>⚠️ ${t.debugNote} ${user.first_name} ${user.last_name} (${user.email})</strong>
            </div>
          `
              : ""
          }
          
          <div style="${styles.greeting}">${t.greeting}</div>
          <div style="${styles.subtitle}">${t.subtitle}</div>

          <!-- Oportunidades nuevas -->
          <div style="${styles.section}">
            <h2 style="${styles.sectionTitle}">${t.newOpportunities}</h2>
            ${newOpportunitiesHtml}
          </div>

          <!-- Tareas nuevas -->
          <div style="${styles.section}">
            <h2 style="${styles.sectionTitle}">${t.newTasks}</h2>
            ${newTasksHtml}
          </div>

          <!-- Tareas próximas a vencer -->
          <div style="${styles.section}">
            <h2 style="${styles.sectionTitle}">${t.upcomingTasks}</h2>
            ${upcomingTasksHtml}
          </div>

          <div style="${styles.footer}">
            ${t.footer}
          </div>
        </div>
      </div>
    `
  }

  /**
   * Envía el email diario a un usuario específico usando RESEND directamente
   */
  static async sendDailyEmail(userId: string, isDebug = false): Promise<{ success: boolean; message?: string }> {
    try {
      console.log(`[DailyEmail] Iniciando envío para usuario: ${userId} (Debug: ${isDebug})`)

      // Verificar que RESEND esté configurado
      if (!process.env.RESEND_API_KEY) {
        console.error("[DailyEmail] RESEND_API_KEY no está configurada")
        return { success: false, message: "RESEND_API_KEY no está configurada" }
      }

      const emailData = await this.getDailyEmailData(userId)

      if (!emailData) {
        console.log(`[DailyEmail] No se pudieron obtener datos para usuario: ${userId}`)
        return { success: false, message: "No se pudieron obtener los datos del usuario" }
      }

      console.log(`[DailyEmail] Datos obtenidos para ${emailData.user.email}:`, {
        upcomingTasks: emailData.stats.totalUpcomingTasks,
        newTasks: emailData.stats.newTasksCount,
        newOpportunities: emailData.stats.newOpportunitiesCount,
      })

      // En modo debug, siempre enviar. En modo normal, solo si hay contenido relevante
      const hasContent =
        emailData.stats.totalUpcomingTasks > 0 ||
        emailData.stats.newTasksCount > 0 ||
        emailData.stats.newOpportunitiesCount > 0

      if (!isDebug && !hasContent) {
        console.log(`[DailyEmail] No hay contenido relevante para ${emailData.user.email}, omitiendo email`)
        return { success: true, message: "No hay contenido relevante para enviar" }
      }

      const htmlContent = this.generateDailyEmailHtml(emailData, isDebug)
      const today = format(new Date(), "dd/MM/yyyy")
      const subject = `ScaleUp - ToDo List ${today}${isDebug ? " (DEBUG)" : ""}`

      const defaultFrom = process.env.NEXT_PUBLIC_EMAIL_FROM || "ScaleUp CRM <no-reply@scaleup-global.com>"

      // En modo debug, enviar a matias@scaleup-global.com, en modo normal al usuario
      const recipientEmail = isDebug ? "matias@scaleup-global.com" : emailData.user.email

      console.log(`[DailyEmail] Enviando email a ${recipientEmail} con subject: ${subject}`)

      // Enviar usando RESEND directamente
      const { data, error } = await this.resend.emails.send({
        from: defaultFrom,
        to: [recipientEmail],
        subject: subject,
        html: htmlContent,
        reply_to: defaultFrom,
      })

      if (error) {
        console.error(`[DailyEmail] Error al enviar email con RESEND:`, error)
        return {
          success: false,
          message: error.message || "Error al enviar el email",
        }
      }

      console.log(`[DailyEmail] Email enviado exitosamente a ${recipientEmail}:`, data)
      return { success: true, message: `Email enviado exitosamente a ${recipientEmail}` }
    } catch (error) {
      console.error(`[DailyEmail] Error inesperado al enviar email a usuario ${userId}:`, error)
      return {
        success: false,
        message: error instanceof Error ? error.message : "Error desconocido",
      }
    }
  }

  /**
   * Envía emails diarios a todos los usuarios de ScaleUp
   */
  static async sendDailyEmailsToAllUsers(): Promise<{
    success: boolean
    results: Array<{ userId: string; email: string; success: boolean; message?: string }>
  }> {
    try {
      const users = await this.getScaleUpUsers()
      const results = []

      console.log(`[DailyEmail] Iniciando envío de emails diarios a ${users.length} usuarios`)

      for (const user of users) {
        console.log(`[DailyEmail] Enviando email diario a ${user.email}...`)
        const result = await this.sendDailyEmail(user.id, false) // Modo normal, no debug

        results.push({
          userId: user.id,
          email: user.email,
          success: result.success,
          message: result.message,
        })

        // Pequeña pausa entre emails para evitar rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }

      const successCount = results.filter((r) => r.success).length
      console.log(`[DailyEmail] Proceso completado: ${successCount}/${users.length} emails enviados exitosamente`)

      return {
        success: true,
        results,
      }
    } catch (error) {
      console.error("[DailyEmail] Error al enviar emails diarios:", error)
      return {
        success: false,
        results: [],
      }
    }
  }
}
