//import { createClient } from "@/lib/supabase/server"
import { createServerClient } from "@/lib/supabase/server"
import { format, subDays } from "date-fns"
import { Resend } from "resend"

export class WeeklyReportServiceV3 {
  private static resend = new Resend(process.env.RESEND_API_KEY)

  static async sendWeeklyReport(techCompanyId: string) {
    console.log(`[WeeklyReportServiceV3] === INICIO sendWeeklyReport para ${techCompanyId} ===`)

    try {
      const supabase = createServerClient()

      // 1. Obtener tech company
      console.log(`[WeeklyReportServiceV3] 1. Obteniendo tech company...`)
      const { data: techCompany, error: techError } = await supabase
        .from("tech_companies")
        .select("id, name, logo_url")
        .eq("id", techCompanyId)
        .single()

      if (techError || !techCompany) {
        console.error(`[WeeklyReportServiceV3] Error tech company:`, techError)
        return { success: false, results: [], error: "Tech company not found" }
      }
      console.log(`[WeeklyReportServiceV3] Tech company OK:`, techCompany.name)

      // 2. Obtener destinatarios
      console.log(`[WeeklyReportServiceV3] 2. Obteniendo destinatarios...`)
      const { data: recipientData, error: recipientError } = await supabase
        .from("weekly_report_recipients")
        .select("user_id")
        .eq("tech_company_id", techCompanyId)
        .eq("is_active", true)

      if (recipientError) {
        console.error(`[WeeklyReportServiceV3] Error recipients:`, recipientError)
        return { success: false, results: [], error: "Error getting recipients" }
      }

      if (!recipientData || recipientData.length === 0) {
        console.log(`[WeeklyReportServiceV3] No recipients found`)
        return { success: false, results: [], error: "No recipients configured" }
      }

      const userIds = recipientData.map((r) => r.user_id)
      console.log(`[WeeklyReportServiceV3] Found ${userIds.length} recipient IDs`)

      // 3. Obtener datos de usuarios
      console.log(`[WeeklyReportServiceV3] 3. Obteniendo datos de usuarios...`)
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, email, first_name, last_name, preferred_language")
        .in("id", userIds)

      if (userError) {
        console.error(`[WeeklyReportServiceV3] Error users:`, userError)
        return { success: false, results: [], error: "Error getting users" }
      }

      if (!userData || userData.length === 0) {
        console.log(`[WeeklyReportServiceV3] No users found`)
        return { success: false, results: [], error: "No users found" }
      }

      console.log(
        `[WeeklyReportServiceV3] Found ${userData.length} users:`,
        userData.map((u) => u.email),
      )

      // 4. Verificar configuración de email
      if (!process.env.RESEND_API_KEY) {
        console.error(`[WeeklyReportServiceV3] RESEND_API_KEY not configured`)
        return { success: false, results: [], error: "RESEND_API_KEY not configured" }
      }

      // 5. Obtener oportunidades - usando códigos reales del CSV
      console.log(`[WeeklyReportServiceV3] 4. Obteniendo oportunidades...`)

      const oneWeekAgo = subDays(new Date(), 7)

      // Consulta con códigos reales del CSV
      const { data: opportunities, error: oppError } = await supabase
        .from("opportunities")
        .select(`
          id, 
          title, 
          estimated_value, 
          estimated_close_date, 
          created_at, 
          updated_at,
          country,
          pipeline_stages (code),
          partners (name)
        `)
        .eq("tech_company_id", techCompanyId)
        .order("created_at", { ascending: false })

      if (oppError) {
        console.error(`[WeeklyReportServiceV3] Error opportunities:`, oppError)
        return { success: false, results: [], error: `Error getting opportunities: ${oppError.message}` }
      }

      const allOpportunities = opportunities || []
      console.log(`[WeeklyReportServiceV3] Found ${allOpportunities.length} opportunities`)

      // 6. Obtener actividad de la semana
      const { data: weeklyTasks } = await supabase
        .from("tasks")
        .select("opportunity_id")
        .eq("tech_company_id", techCompanyId)
        .gte("created_at", oneWeekAgo.toISOString())

      const { data: weeklyNotes } = await supabase
        .from("notes")
        .select("opportunity_id")
        .gte("created_at", oneWeekAgo.toISOString())

      const opportunitiesWithActivity = new Set([
        ...(weeklyTasks || []).map((t) => t.opportunity_id),
        ...(weeklyNotes || []).map((n) => n.opportunity_id),
      ])

      // 7. Clasificar oportunidades - usando códigos reales del CSV
      const newOpportunities = allOpportunities.filter((opp) => new Date(opp.created_at) >= oneWeekAgo)
      const existingOpportunities = allOpportunities.filter((opp) => new Date(opp.created_at) < oneWeekAgo)

      // Estados cerrados basados en códigos reales del CSV
      const closedStages = ["Won", "Lost"]
      const frozenStages = ["Freeze"]
      const closedOrFrozenOpportunities = allOpportunities.filter((opp) =>
        [...closedStages, ...frozenStages].includes(opp.pipeline_stages?.code || ""),
      )
      const openOpportunities = allOpportunities.filter(
        (opp) => ![...closedStages, ...frozenStages].includes(opp.pipeline_stages?.code || ""),
      )

      const withActivity = openOpportunities.filter(
        (opp) => opportunitiesWithActivity.has(opp.id) || (opp.updated_at && new Date(opp.updated_at) >= oneWeekAgo),
      ).length

      const withoutActivity = openOpportunities.length - withActivity

      // 8. Generar datos del reporte
      const reportData = {
        techCompany,
        summary: {
          totalOpportunities: allOpportunities.length,
          openOpportunities: openOpportunities.length,
          newThisWeek: newOpportunities.length,
          closedThisWeek: closedOrFrozenOpportunities.filter(
            (opp) => opp.updated_at && new Date(opp.updated_at) >= oneWeekAgo,
          ).length,
          withActivity,
          withoutActivity,
        },
        opportunities: {
          new: newOpportunities.slice(0, 20),
          existing: existingOpportunities.slice(0, 20),
          closed: closedOrFrozenOpportunities.slice(0, 10),
        },
        generatedAt: new Date(),
      }

      // 9. Generar HTML
      const htmlContent = this.generateEnhancedHtml(reportData)

      // 10. Enviar emails
      console.log(`[WeeklyReportServiceV3] 5. Enviando emails...`)
      const results = []
      const emailFrom = process.env.NEXT_PUBLIC_EMAIL_FROM || "ScaleUp CRM <no-reply@scaleup-global.com>"

      for (const user of userData) {
        try {
          console.log(`[WeeklyReportServiceV3] Enviando a ${user.email}`)

          const { data, error } = await this.resend.emails.send({
            from: emailFrom,
            to: [user.email],
            subject: `${techCompany.name} - Reporte Semanal (${reportData.summary.openOpportunities} oportunidades abiertas)`,
            html: htmlContent,
          })

          if (error) {
            console.error(`[WeeklyReportServiceV3] Error enviando a ${user.email}:`, error)
            results.push({
              email: user.email,
              success: false,
              message: error.message,
            })
          } else {
            console.log(`[WeeklyReportServiceV3] Email enviado exitosamente a ${user.email}`)
            results.push({
              email: user.email,
              success: true,
              message: "Email sent successfully",
            })
          }

          // Pausa entre emails
          await new Promise((resolve) => setTimeout(resolve, 1000))
        } catch (error) {
          console.error(`[WeeklyReportServiceV3] Error inesperado enviando a ${user.email}:`, error)
          results.push({
            email: user.email,
            success: false,
            message: error instanceof Error ? error.message : "Unknown error",
          })
        }
      }

      const successCount = results.filter((r) => r.success).length
      console.log(`[WeeklyReportServiceV3] Completado: ${successCount}/${results.length} emails enviados`)

      return {
        success: successCount > 0,
        results,
        summary: reportData.summary,
      }
    } catch (error) {
      console.error(`[WeeklyReportServiceV3] Error general:`, error)
      return {
        success: false,
        results: [],
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  private static generateEnhancedHtml(reportData: any): string {
    const { techCompany, summary, opportunities, generatedAt } = reportData
    const formattedDate = format(generatedAt, "dd/MM/yyyy")
    const scaleupBlue = "#0055b8"

    const formatCurrency = (amount?: number) => {
      if (!amount) return "-"
      return new Intl.NumberFormat("es-ES", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount)
    }

    // Función para traducir códigos reales del CSV a nombres en español
    const getStageDisplayName = (code?: string) => {
      if (!code) return "Sin etapa"

      // Mapeo basado en los códigos reales del CSV que me pasaste
      const stageNames: { [key: string]: string } = {
        "Pre-Lead": "Pre-Lead",
        Engagement: "Compromiso",
        "Initial Communication": "Comunicación Inicial",
        Won: "Ganado",
        Lost: "Perdido",
        Freeze: "Congelado",
        Quotation: "Cotización",
        Lead: "Lead",
      }

      return stageNames[code] || code
    }

    const generateOpportunityTable = (opps: any[], title: string, bgColor: string) => {
      if (!opps || opps.length === 0) {
        return `
          <div style="margin: 20px 0;">
            <h3 style="color: ${scaleupBlue}; margin-bottom: 10px;">${title}</h3>
            <p style="color: #666; font-style: italic;">No hay oportunidades en esta categoría.</p>
          </div>
        `
      }

      const rows = opps
        .map(
          (opp) => `
        <tr style="border-bottom: 1px solid #e0e0e0;">
          <td style="padding: 8px; border-right: 1px solid #e0e0e0;">${opp.country || "-"}</td>
          <td style="padding: 8px; border-right: 1px solid #e0e0e0; font-weight: 500;">${opp.title}</td>
          <td style="padding: 8px; border-right: 1px solid #e0e0e0; text-align: right;">${formatCurrency(opp.estimated_value)}</td>
          <td style="padding: 8px; border-right: 1px solid #e0e0e0;">${opp.estimated_close_date ? format(new Date(opp.estimated_close_date), "dd/MM/yyyy") : "-"}</td>
          <td style="padding: 8px; border-right: 1px solid #e0e0e0;">${opp.partners?.name || "Sin Partner"}</td>
          <td style="padding: 8px;">${getStageDisplayName(opp.pipeline_stages?.code)}</td>
        </tr>
      `,
        )
        .join("")

      return `
        <div style="margin: 30px 0;">
          <h3 style="color: ${scaleupBlue}; margin-bottom: 15px; padding: 10px; background-color: ${bgColor}; border-radius: 4px;">
            ${title} (${opps.length})
          </h3>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #e0e0e0; background-color: white;">
            <thead>
              <tr style="background-color: #f8f9fa;">
                <th style="padding: 10px; text-align: left; border-right: 1px solid #e0e0e0;">País</th>
                <th style="padding: 10px; text-align: left; border-right: 1px solid #e0e0e0;">Oportunidad</th>
                <th style="padding: 10px; text-align: left; border-right: 1px solid #e0e0e0;">Monto</th>
                <th style="padding: 10px; text-align: left; border-right: 1px solid #e0e0e0;">Fecha Cierre</th>
                <th style="padding: 10px; text-align: left; border-right: 1px solid #e0e0e0;">Partner</th>
                <th style="padding: 10px; text-align: left;">Etapa</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>
      `
    }

    // Generar gráfico simple SVG
    const generateChart = () => {
      const data = [
        { label: "Abiertas", value: summary.openOpportunities, color: scaleupBlue },
        { label: "Nuevas", value: summary.newThisWeek, color: "#28a745" },
        { label: "Con Actividad", value: summary.withActivity, color: "#17a2b8" },
        { label: "Cerradas", value: summary.closedThisWeek, color: "#ffc107" },
      ]

      const maxValue = Math.max(...data.map((d) => d.value), 1)
      const chartWidth = 400
      const chartHeight = 150

      const bars = data
        .map((item, index) => {
          const barHeight = (item.value / maxValue) * 100
          const x = 50 + index * 80
          const y = 120 - barHeight

          return `
          <rect x="${x}" y="${y}" width="60" height="${barHeight}" fill="${item.color}" rx="3"/>
          <text x="${x + 30}" y="${y - 5}" text-anchor="middle" font-size="12" font-weight="bold">${item.value}</text>
          <text x="${x + 30}" y="140" text-anchor="middle" font-size="10" fill="#666">${item.label}</text>
        `
        })
        .join("")

      return `
        <svg width="${chartWidth}" height="${chartHeight}" style="margin: 20px 0;">
          ${bars}
        </svg>
      `
    }

    return `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
        <div style="background-color: ${scaleupBlue}; color: white; padding: 20px; border-radius: 8px;">
          <h1 style="margin: 0; font-size: 24px;">📊 Reporte Semanal - ${techCompany.name}</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Fecha: ${formattedDate}</p>
        </div>
        
        <div style="background-color: white; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; margin-top: 20px;">
          <h2 style="color: ${scaleupBlue}; margin-top: 0;">📈 Resumen Ejecutivo</h2>
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin: 20px 0;">
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center;">
              <h3 style="margin: 0 0 5px 0; color: ${scaleupBlue}; font-size: 24px;">${summary.totalOpportunities}</h3>
              <p style="margin: 0; color: #666; font-size: 12px;">Total Oportunidades</p>
            </div>
            <div style="background-color: #e8f5e8; padding: 15px; border-radius: 8px; text-align: center;">
              <h3 style="margin: 0 0 5px 0; color: #28a745; font-size: 24px;">${summary.openOpportunities}</h3>
              <p style="margin: 0; color: #666; font-size: 12px;">Abiertas</p>
            </div>
            <div style="background-color: #e3f2fd; padding: 15px; border-radius: 8px; text-align: center;">
              <h3 style="margin: 0 0 5px 0; color: #1976d2; font-size: 24px;">${summary.newThisWeek}</h3>
              <p style="margin: 0; color: #666; font-size: 12px;">Nuevas esta semana</p>
            </div>
            <div style="background-color: #fff3e0; padding: 15px; border-radius: 8px; text-align: center;">
              <h3 style="margin: 0 0 5px 0; color: #f57c00; font-size: 24px;">${summary.closedThisWeek}</h3>
              <p style="margin: 0; color: #666; font-size: 12px;">Cerradas esta semana</p>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0;">
            <div style="background-color: #e8f5e8; padding: 15px; border-radius: 8px; text-align: center;">
              <h3 style="margin: 0 0 5px 0; color: #28a745; font-size: 20px;">${summary.withActivity}</h3>
              <p style="margin: 0; color: #666; font-size: 11px;">Con actividad esta semana</p>
            </div>
            <div style="background-color: #ffebee; padding: 15px; border-radius: 8px; text-align: center;">
              <h3 style="margin: 0 0 5px 0; color: #d32f2f; font-size: 20px;">${summary.withoutActivity}</h3>
              <p style="margin: 0; color: #666; font-size: 11px;">Sin actividad esta semana</p>
            </div>
          </div>

          <!-- Gráfico -->
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h3 style="color: ${scaleupBlue}; margin-bottom: 10px;">📊 Distribución</h3>
            ${generateChart()}
          </div>

          <!-- Listados -->
          ${generateOpportunityTable(opportunities.new, "🆕 Oportunidades Nuevas (esta semana)", "#e8f5e8")}
          ${generateOpportunityTable(opportunities.existing, "📋 Oportunidades Existentes", "#f8f9fa")}
          ${generateOpportunityTable(opportunities.closed, "✅ Oportunidades Cerradas/Congeladas (esta semana)", "#fff3e0")}
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666; text-align: center;">
            Este reporte fue generado automáticamente por ScaleUp CRM el ${formattedDate}.
            <br>
            <strong>Actividad:</strong> Incluye cambios de estado, creación de tareas o notas en la última semana.
            <br>
            <strong>Estados:</strong> Pre-Lead, Compromiso, Comunicación Inicial, Lead, Cotización, Ganado, Perdido, Congelado
          </div>
        </div>
      </div>
    `
  }
}
