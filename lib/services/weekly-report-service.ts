import { createClient } from "@/lib/supabase/server"
import { format, startOfWeek, endOfWeek, subWeeks } from "date-fns"
import { es, enUS, pt } from "date-fns/locale"
import { Resend } from "resend"

export interface WeeklyReportData {
  techCompany: {
    id: string
    name: string
    logo_url?: string
  }
  period: {
    start: Date
    end: Date
    previousStart: Date
    previousEnd: Date
  }
  summary: {
    openOpportunities: number
    withActivity: number
    withoutActivity: number
    closedThisWeek: number
    previousOpenOpportunities: number
    previousClosedOpportunities: number
  }
  opportunitiesByPartner: {
    [partnerName: string]: {
      new: OpportunityData[]
      existing: OpportunityData[]
      closedWon: OpportunityData[]
      closedLost: OpportunityData[]
    }
  }
  recipients: {
    id: string
    email: string
    first_name: string
    last_name: string
    preferred_language: string
  }[]
}

export interface OpportunityData {
  id: string
  title: string
  country?: string
  estimated_value?: number
  estimated_close_date?: string
  stage_name?: string
  partner_name?: string
  custom_fields?: { [key: string]: any }
  created_at: string
  updated_at?: string
}

export class WeeklyReportService {
  private static resend = new Resend(process.env.RESEND_API_KEY)

  static async getTechCompaniesWithRecipients(): Promise<string[]> {
    const supabase = createClient()

    try {
      const { data, error } = await supabase
        .from("weekly_report_recipients")
        .select("tech_company_id")
        .eq("is_active", true)

      if (error) {
        console.error("Error al obtener tech companies con destinatarios:", error)
        return []
      }

      const uniqueIds = [...new Set(data.map((item) => item.tech_company_id))]
      return uniqueIds
    } catch (error) {
      console.error("Error inesperado al obtener tech companies:", error)
      return []
    }
  }

  static async getRecipients(techCompanyId: string) {
    console.log(`[WeeklyReportService] Obteniendo destinatarios para tech company: ${techCompanyId}`)
    const supabase = createClient()

    try {
      // Primero obtener los IDs de usuarios
      const { data: recipientData, error: recipientError } = await supabase
        .from("weekly_report_recipients")
        .select("user_id")
        .eq("tech_company_id", techCompanyId)
        .eq("is_active", true)

      if (recipientError) {
        console.error(`[WeeklyReportService] Error al obtener recipients:`, recipientError)
        return []
      }

      console.log(`[WeeklyReportService] Recipients encontrados:`, recipientData)

      if (!recipientData || recipientData.length === 0) {
        console.log(`[WeeklyReportService] No hay recipients activos para tech company ${techCompanyId}`)
        return []
      }

      const userIds = recipientData.map((r) => r.user_id)
      console.log(`[WeeklyReportService] User IDs:`, userIds)

      // Ahora obtener los datos de usuarios
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, email, first_name, last_name, preferred_language")
        .in("id", userIds)

      if (userError) {
        console.error(`[WeeklyReportService] Error al obtener users:`, userError)
        return []
      }

      console.log(`[WeeklyReportService] User data encontrada:`, userData)

      const recipients = userData.map((user) => ({
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        preferred_language: user.preferred_language || "es",
      }))

      console.log(`[WeeklyReportService] Destinatarios procesados:`, recipients)
      return recipients
    } catch (error) {
      console.error(`[WeeklyReportService] Error inesperado al obtener destinatarios:`, error)
      return []
    }
  }

  static async generateWeeklyReportData(techCompanyId: string, weekDate?: Date): Promise<WeeklyReportData | null> {
    const supabase = createClient()

    try {
      console.log(`[WeeklyReportService] Generando datos para tech company: ${techCompanyId}`)

      // Definir el período de la semana (lunes a domingo)
      const referenceDate = weekDate || new Date()
      const weekStart = startOfWeek(referenceDate, { weekStartsOn: 1 })
      const weekEnd = endOfWeek(referenceDate, { weekStartsOn: 1 })
      const previousWeekStart = startOfWeek(subWeeks(referenceDate, 1), { weekStartsOn: 1 })
      const previousWeekEnd = endOfWeek(subWeeks(referenceDate, 1), { weekStartsOn: 1 })

      // Obtener información de la tech company
      const { data: techCompany, error: techError } = await supabase
        .from("tech_companies")
        .select("id, name, logo_url")
        .eq("id", techCompanyId)
        .single()

      if (techError || !techCompany) {
        console.error(`[WeeklyReportService] Error al obtener tech company ${techCompanyId}:`, techError)
        return null
      }

      console.log(`[WeeklyReportService] Tech company encontrada:`, techCompany)

      // Obtener destinatarios
      const recipients = await this.getRecipients(techCompanyId)
      if (recipients.length === 0) {
        console.log(`[WeeklyReportService] No hay destinatarios configurados para tech company ${techCompanyId}`)
        return null
      }

      console.log(`[WeeklyReportService] ${recipients.length} destinatarios encontrados`)

      // Obtener todas las oportunidades de la tech company
      const { data: allOpportunities, error: oppError } = await supabase
        .from("opportunities")
        .select(`
          id, title, estimated_value, estimated_close_date, created_at, updated_at,
          country, validation_status,
          pipeline_stages (id, code, name),
          partners (id, name),
          end_customers (id, name)
        `)
        .eq("tech_company_id", techCompanyId)
        .order("created_at", { ascending: false })

      if (oppError) {
        console.error(
          `[WeeklyReportService] Error al obtener oportunidades para tech company ${techCompanyId}:`,
          oppError,
        )
        return null
      }

      const opportunities = allOpportunities || []
      console.log(`[WeeklyReportService] Encontradas ${opportunities.length} oportunidades`)

      // Clasificar oportunidades
      const newOpportunities: OpportunityData[] = []
      const existingOpportunities: OpportunityData[] = []
      const closedWonOpportunities: OpportunityData[] = []
      const closedLostOpportunities: OpportunityData[] = []

      let openOpportunities = 0
      let withActivity = 0
      const withoutActivity = 0
      let closedThisWeek = 0

      // Procesar cada oportunidad
      for (const opp of opportunities) {
        const createdAt = new Date(opp.created_at)
        const isNewThisWeek = createdAt >= weekStart && createdAt <= weekEnd
        const isClosedWon = opp.pipeline_stages?.code?.toLowerCase() === "won"
        const isClosedLost = opp.pipeline_stages?.code?.toLowerCase() === "lost"
        const isClosed = isClosedWon || isClosedLost

        const opportunityData: OpportunityData = {
          id: opp.id,
          title: opp.title,
          country: opp.country,
          estimated_value: opp.estimated_value,
          estimated_close_date: opp.estimated_close_date,
          stage_name: opp.pipeline_stages?.name || opp.pipeline_stages?.code,
          partner_name: opp.partners?.name,
          custom_fields: {},
          created_at: opp.created_at,
          updated_at: opp.updated_at,
        }

        // Clasificar por estado y período
        if (isNewThisWeek) {
          if (isClosed) {
            if (isClosedWon) {
              closedWonOpportunities.push(opportunityData)
              closedThisWeek++
            } else {
              closedLostOpportunities.push(opportunityData)
              closedThisWeek++
            }
          } else {
            newOpportunities.push(opportunityData)
            openOpportunities++
          }
        } else if (isClosed) {
          // Verificar si se cerró esta semana
          const updatedAt = opp.updated_at ? new Date(opp.updated_at) : createdAt
          if (updatedAt >= weekStart && updatedAt <= weekEnd) {
            if (isClosedWon) {
              closedWonOpportunities.push(opportunityData)
            } else {
              closedLostOpportunities.push(opportunityData)
            }
            closedThisWeek++
          }
        } else {
          // Oportunidad existente y abierta
          existingOpportunities.push(opportunityData)
          openOpportunities++
          // Por simplicidad, asumimos que todas tienen actividad
          withActivity++
        }
      }

      // Agrupar por partner
      const opportunitiesByPartner: { [partnerName: string]: any } = {}

      const allOpportunitiesForGrouping = [
        ...newOpportunities,
        ...existingOpportunities,
        ...closedWonOpportunities,
        ...closedLostOpportunities,
      ]

      allOpportunitiesForGrouping.forEach((opp) => {
        const partnerName = opp.partner_name || "Sin Partner"

        if (!opportunitiesByPartner[partnerName]) {
          opportunitiesByPartner[partnerName] = {
            new: [],
            existing: [],
            closedWon: [],
            closedLost: [],
          }
        }

        if (newOpportunities.includes(opp)) {
          opportunitiesByPartner[partnerName].new.push(opp)
        } else if (existingOpportunities.includes(opp)) {
          opportunitiesByPartner[partnerName].existing.push(opp)
        } else if (closedWonOpportunities.includes(opp)) {
          opportunitiesByPartner[partnerName].closedWon.push(opp)
        } else if (closedLostOpportunities.includes(opp)) {
          opportunitiesByPartner[partnerName].closedLost.push(opp)
        }
      })

      console.log(`[WeeklyReportService] Datos procesados: ${openOpportunities} abiertas, ${closedThisWeek} cerradas`)

      return {
        techCompany: {
          id: techCompany.id,
          name: techCompany.name,
          logo_url: techCompany.logo_url,
        },
        period: {
          start: weekStart,
          end: weekEnd,
          previousStart: previousWeekStart,
          previousEnd: previousWeekEnd,
        },
        summary: {
          openOpportunities,
          withActivity,
          withoutActivity,
          closedThisWeek,
          previousOpenOpportunities: 0, // Simplificado por ahora
          previousClosedOpportunities: 0,
        },
        opportunitiesByPartner,
        recipients,
      }
    } catch (error) {
      console.error(
        `[WeeklyReportService] Error al generar datos del reporte para tech company ${techCompanyId}:`,
        error,
      )
      return null
    }
  }

  static generateWeeklyReportHtml(data: WeeklyReportData, language = "es"): string {
    const { techCompany, period, summary, opportunitiesByPartner } = data

    const locale = language === "en" ? enUS : language === "pt" ? pt : es

    const translations = {
      es: {
        title: "Reporte Semanal de Oportunidades",
        subtitle: "Resumen de oportunidades y actividades para",
        period: "Período",
        summary: "Resumen Ejecutivo",
        openOpportunities: "Oportunidades Abiertas",
        withActivity: "Con actividad esta semana",
        withoutActivity: "Sin actividad esta semana",
        closedThisWeek: "Oportunidades cerradas esta semana",
        newOpportunities: "Oportunidades Nuevas",
        existingOpportunities: "Oportunidades Existentes",
        closedWon: "Cerradas Ganadas",
        closedLost: "Cerradas Perdidas",
        country: "País",
        opportunityName: "Nombre de Oportunidad",
        amount: "Monto",
        estimatedClose: "Fecha Estimada de Cierre",
        partner: "Partner",
        noOpportunities: "No se encontraron oportunidades para este período",
        footer: "Este es un reporte semanal automático generado por ScaleUp CRM. No responder a este email.",
      },
      en: {
        title: "Weekly Opportunities Report",
        subtitle: "Summary of opportunities and activities for",
        period: "Period",
        summary: "Executive Summary",
        openOpportunities: "Open Opportunities",
        withActivity: "With activity this week",
        withoutActivity: "Without activity this week",
        closedThisWeek: "Opportunities closed this week",
        newOpportunities: "New Opportunities",
        existingOpportunities: "Existing Opportunities",
        closedWon: "Closed Won",
        closedLost: "Closed Lost",
        country: "Country",
        opportunityName: "Opportunity Name",
        amount: "Amount",
        estimatedClose: "Estimated Close Date",
        partner: "Partner",
        noOpportunities: "No opportunities found for this period",
        footer: "This is an automated weekly report generated by ScaleUp CRM. Do not reply to this email.",
      },
    }

    const t = translations[language as keyof typeof translations] || translations.es
    const scaleupBlue = "#0055b8"

    const formatDate = (date: Date) => format(date, "PPP", { locale })
    const periodText = `${formatDate(period.start)} - ${formatDate(period.end)}`

    const formatCurrency = (amount?: number) => {
      if (!amount) return "-"
      return new Intl.NumberFormat(language === "en" ? "en-US" : "es-ES", {
        style: "currency",
        currency: "USD",
      }).format(amount)
    }

    const generateOpportunityTable = (opportunities: OpportunityData[], title: string) => {
      if (opportunities.length === 0) {
        return `
          <div style="margin-bottom: 30px;">
            <h3 style="color: ${scaleupBlue}; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid ${scaleupBlue}; padding-bottom: 5px;">
              ${title}
            </h3>
            <p style="text-align: center; color: #666; font-style: italic; padding: 20px;">
              ${t.noOpportunities}
            </p>
          </div>
        `
      }

      const tableRows = opportunities
        .map((opp) => {
          return `
          <tr style="border-bottom: 1px solid #e0e0e0;">
            <td style="padding: 12px 8px; border-right: 1px solid #e0e0e0;">${opp.country || "-"}</td>
            <td style="padding: 12px 8px; border-right: 1px solid #e0e0e0; font-weight: 500;">
              ${opp.title}
            </td>
            <td style="padding: 12px 8px; border-right: 1px solid #e0e0e0; text-align: right;">
              ${formatCurrency(opp.estimated_value)}
            </td>
            <td style="padding: 12px 8px; border-right: 1px solid #e0e0e0;">
              ${opp.estimated_close_date ? format(new Date(opp.estimated_close_date), "PP", { locale }) : "-"}
            </td>
            <td style="padding: 12px 8px;">${opp.partner_name || "-"}</td>
          </tr>
        `
        })
        .join("")

      return `
        <div style="margin-bottom: 30px;">
          <h3 style="color: ${scaleupBlue}; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid ${scaleupBlue}; padding-bottom: 5px;">
            ${title} (${opportunities.length})
          </h3>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #e0e0e0; background-color: white;">
            <thead>
              <tr style="background-color: #f8f9fa;">
                <th style="padding: 12px 8px; text-align: left; border-right: 1px solid #e0e0e0; font-weight: 600;">${t.country}</th>
                <th style="padding: 12px 8px; text-align: left; border-right: 1px solid #e0e0e0; font-weight: 600;">${t.opportunityName}</th>
                <th style="padding: 12px 8px; text-align: left; border-right: 1px solid #e0e0e0; font-weight: 600;">${t.amount}</th>
                <th style="padding: 12px 8px; text-align: left; border-right: 1px solid #e0e0e0; font-weight: 600;">${t.estimatedClose}</th>
                <th style="padding: 12px 8px; text-align: left; font-weight: 600;">${t.partner}</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </div>
      `
    }

    const partnerSections = Object.entries(opportunitiesByPartner)
      .map(([partnerName, partnerOpps]) => {
        return `
        <div style="margin-bottom: 40px; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
          <div style="background-color: ${scaleupBlue}; color: white; padding: 15px;">
            <h2 style="margin: 0; font-size: 20px;">${partnerName}</h2>
          </div>
          <div style="padding: 20px;">
            ${generateOpportunityTable(partnerOpps.new, t.newOpportunities)}
            ${generateOpportunityTable(partnerOpps.existing, t.existingOpportunities)}
            ${generateOpportunityTable(partnerOpps.closedWon, t.closedWon)}
            ${generateOpportunityTable(partnerOpps.closedLost, t.closedLost)}
          </div>
        </div>
      `
      })
      .join("")

    return `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
        <div style="background-color: ${scaleupBlue}; color: white; padding: 30px 20px; border-radius: 8px 8px 0 0;">
          <h1 style="font-size: 28px; font-weight: bold; margin: 0 0 10px 0;">${t.title}</h1>
          <p style="font-size: 16px; margin: 0; opacity: 0.9;">${t.subtitle} ${techCompany.name}</p>
          <p style="font-size: 14px; margin: 10px 0 0 0; opacity: 0.8;">${t.period}: ${periodText}</p>
        </div>

        <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px;">
          <div style="margin-bottom: 40px;">
            <h2 style="color: ${scaleupBlue}; font-size: 22px; margin-bottom: 20px; border-bottom: 2px solid ${scaleupBlue}; padding-bottom: 5px;">
              ${t.summary}
            </h2>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 20px;">
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center;">
                <div style="font-size: 32px; font-weight: bold; color: ${scaleupBlue};">${summary.openOpportunities}</div>
                <div style="font-size: 14px; color: #666; margin-top: 5px;">${t.openOpportunities}</div>
              </div>
              
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center;">
                <div style="font-size: 32px; font-weight: bold; color: #28a745;">${summary.withActivity}</div>
                <div style="font-size: 14px; color: #666; margin-top: 5px;">${t.withActivity}</div>
              </div>
              
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center;">
                <div style="font-size: 32px; font-weight: bold; color: #ffc107;">${summary.withoutActivity}</div>
                <div style="font-size: 14px; color: #666; margin-top: 5px;">${t.withoutActivity}</div>
              </div>
              
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center;">
                <div style="font-size: 32px; font-weight: bold; color: #17a2b8;">${summary.closedThisWeek}</div>
                <div style="font-size: 14px; color: #666; margin-top: 5px;">${t.closedThisWeek}</div>
              </div>
            </div>
          </div>

          ${partnerSections}

          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666; text-align: center;">
            ${t.footer}
          </div>
        </div>
      </div>
    `
  }

  static async debugWeeklyReportData(techCompanyId: string) {
    console.log(`[DEBUG] === INICIO DEBUG para ${techCompanyId} ===`)
    const supabase = createClient()

    try {
      // 1. Verificar tech company
      console.log(`[DEBUG] 1. Verificando tech company...`)
      const { data: techCompany, error: techError } = await supabase
        .from("tech_companies")
        .select("id, name, logo_url")
        .eq("id", techCompanyId)
        .single()

      if (techError) {
        console.error(`[DEBUG] Error tech company:`, techError)
        return { step: 1, error: techError }
      }
      console.log(`[DEBUG] Tech company OK:`, techCompany)

      // 2. Verificar destinatarios
      console.log(`[DEBUG] 2. Verificando destinatarios...`)
      const recipients = await this.getRecipients(techCompanyId)
      console.log(`[DEBUG] Recipients:`, recipients)

      if (recipients.length === 0) {
        console.log(`[DEBUG] No hay destinatarios`)
        return { step: 2, error: "No recipients" }
      }

      // 3. Verificar oportunidades
      console.log(`[DEBUG] 3. Verificando oportunidades...`)
      const { data: opportunities, error: oppError } = await supabase
        .from("opportunities")
        .select("id, title, created_at, tech_company_id")
        .eq("tech_company_id", techCompanyId)
        .limit(5)

      if (oppError) {
        console.error(`[DEBUG] Error oportunidades:`, oppError)
        return { step: 3, error: oppError }
      }
      console.log(`[DEBUG] Oportunidades (primeras 5):`, opportunities)

      return {
        step: "success",
        techCompany,
        recipients: recipients.length,
        opportunities: opportunities?.length || 0,
      }
    } catch (error) {
      console.error(`[DEBUG] Error general:`, error)
      return { step: "catch", error }
    }
  }

  static async sendWeeklyReport(
    techCompanyId: string,
    weekDate?: Date,
  ): Promise<{
    success: boolean
    results: Array<{ email: string; success: boolean; message?: string }>
    error?: string
  }> {
    try {
      console.log(`[WeeklyReportService] === INICIO sendWeeklyReport para ${techCompanyId} ===`)

      // DEBUG: Verificar qué está pasando
      const debugResult = await this.debugWeeklyReportData(techCompanyId)
      console.log(`[WeeklyReportService] Debug result:`, debugResult)

      if (debugResult.step !== "success") {
        return {
          success: false,
          results: [],
          error: `Debug failed at step ${debugResult.step}: ${JSON.stringify(debugResult.error)}`,
        }
      }

      if (!process.env.RESEND_API_KEY) {
        console.error("[WeeklyReportService] RESEND_API_KEY no está configurada")
        return { success: false, results: [], error: "RESEND_API_KEY no está configurada" }
      }

      const reportData = await this.generateWeeklyReportData(techCompanyId, weekDate)

      if (!reportData) {
        console.log(`[WeeklyReportService] No se pudieron generar datos para tech company: ${techCompanyId}`)
        return { success: false, results: [], error: "No se pudieron generar datos del reporte" }
      }

      if (reportData.recipients.length === 0) {
        console.log(`[WeeklyReportService] No hay destinatarios para tech company: ${techCompanyId}`)
        return { success: false, results: [], error: "No hay destinatarios configurados" }
      }

      // Por ahora, solo devolver éxito sin enviar emails reales
      console.log(`[WeeklyReportService] Todo OK, ${reportData.recipients.length} destinatarios encontrados`)

      return {
        success: true,
        results: reportData.recipients.map((r) => ({
          email: r.email,
          success: true,
          message: "Debug mode - no email sent",
        })),
      }
    } catch (error) {
      console.error(`[WeeklyReportService] Error al enviar reporte para tech company ${techCompanyId}:`, error)
      return {
        success: false,
        results: [],
        error: error instanceof Error ? error.message : "Error desconocido",
      }
    }
  }
}
