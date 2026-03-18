//import { createClient } from "@/lib/supabase/server"
import { createServerClient } from "@/lib/supabase/server"
import { format, subDays } from "date-fns"
import { Resend } from "resend"

export class WeeklyReportServiceV5 {
  private static resend = new Resend(process.env.RESEND_API_KEY)

  static async sendWeeklyReport(techCompanyId: string) {
    console.log(`[WeeklyReportServiceV5] === INICIO sendWeeklyReport para ${techCompanyId} ===`)

    try {
      const supabase = createServerClient()

      // 1. Obtener tech company
      console.log(`[WeeklyReportServiceV5] 1. Obteniendo tech company...`)
      const { data: techCompany, error: techError } = await supabase
        .from("tech_companies")
        .select("id, name, logo_url")
        .eq("id", techCompanyId)
        .single()

      if (techError || !techCompany) {
        console.error(`[WeeklyReportServiceV5] Error tech company:`, techError)
        return { success: false, results: [], error: "Tech company not found" }
      }
      console.log(`[WeeklyReportServiceV5] Tech company OK:`, techCompany.name)

      // 2. Obtener destinatarios
      console.log(`[WeeklyReportServiceV5] 2. Obteniendo destinatarios...`)
      const { data: recipientData, error: recipientError } = await supabase
        .from("weekly_report_recipients")
        .select("user_id")
        .eq("tech_company_id", techCompanyId)
        .eq("is_active", true)

      if (recipientError) {
        console.error(`[WeeklyReportServiceV5] Error recipients:`, recipientError)
        return { success: false, results: [], error: "Error getting recipients" }
      }

      if (!recipientData || recipientData.length === 0) {
        console.log(`[WeeklyReportServiceV5] No recipients found`)
        return { success: false, results: [], error: "No recipients configured" }
      }

      const userIds = recipientData.map((r) => r.user_id)
      console.log(`[WeeklyReportServiceV5] Found ${userIds.length} recipient IDs`)

      // 3. Obtener datos de usuarios
      console.log(`[WeeklyReportServiceV5] 3. Obteniendo datos de usuarios...`)
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, email, first_name, last_name, preferred_language")
        .in("id", userIds)

      if (userError) {
        console.error(`[WeeklyReportServiceV5] Error users:`, userError)
        return { success: false, results: [], error: "Error getting users" }
      }

      if (!userData || userData.length === 0) {
        console.log(`[WeeklyReportServiceV5] No users found`)
        return { success: false, results: [], error: "No users found" }
      }

      console.log(
        `[WeeklyReportServiceV5] Found ${userData.length} users:`,
        userData.map((u) => u.email),
      )

      // 4. Verificar configuración de email
      if (!process.env.RESEND_API_KEY) {
        console.error(`[WeeklyReportServiceV5] RESEND_API_KEY not configured`)
        return { success: false, results: [], error: "RESEND_API_KEY not configured" }
      }

      // 5. Obtener oportunidades con partners
      console.log(`[WeeklyReportServiceV5] 4. Obteniendo oportunidades...`)

      const oneWeekAgo = subDays(new Date(), 7)

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
          partners (name, logo_url),
          end_customers (name)
        `)
        .eq("tech_company_id", techCompanyId)
        .order("created_at", { ascending: false })

      if (oppError) {
        console.error(`[WeeklyReportServiceV5] Error opportunities:`, oppError)
        return { success: false, results: [], error: `Error getting opportunities: ${oppError.message}` }
      }

      const allOpportunities = opportunities || []
      console.log(`[WeeklyReportServiceV5] Found ${allOpportunities.length} opportunities`)

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

      // 7. Clasificar oportunidades - NUEVA LÓGICA
      const inactiveStages = ["Freeze", "Lost"]

      // Separar oportunidades activas de inactivas
      const activeOpportunities = allOpportunities.filter(
        (opp) => !inactiveStages.includes(opp.pipeline_stages?.code || ""),
      )

      // Oportunidades que se movieron a Freeze/Lost esta semana
      const recentlyInactiveOpportunities = allOpportunities.filter((opp) => {
        const isInactive = inactiveStages.includes(opp.pipeline_stages?.code || "")
        const wasUpdatedThisWeek = opp.updated_at && new Date(opp.updated_at) >= oneWeekAgo
        return isInactive && wasUpdatedThisWeek
      })

      // Clasificar solo las oportunidades activas
      const newOpportunities = activeOpportunities.filter((opp) => new Date(opp.created_at) >= oneWeekAgo)
      const existingOpportunities = activeOpportunities.filter((opp) => new Date(opp.created_at) < oneWeekAgo)

      // Oportunidades ganadas esta semana
      const wonThisWeek = allOpportunities.filter((opp) => {
        const isWon = opp.pipeline_stages?.code === "Won"
        const wasUpdatedThisWeek = opp.updated_at && new Date(opp.updated_at) >= oneWeekAgo
        return isWon && wasUpdatedThisWeek
      })

      const withActivity = activeOpportunities.filter(
        (opp) => opportunitiesWithActivity.has(opp.id) || (opp.updated_at && new Date(opp.updated_at) >= oneWeekAgo),
      ).length

      const withoutActivity = activeOpportunities.length - withActivity

      // 8. Agrupar por Partner
      const groupByPartner = (opportunities: any[]) => {
        const grouped: { [key: string]: any[] } = {}

        opportunities.forEach((opp) => {
          const partnerName = opp.partners?.name || "Sin Partner"
          if (!grouped[partnerName]) {
            grouped[partnerName] = []
          }
          grouped[partnerName].push(opp)
        })

        return grouped
      }

      const newByPartner = groupByPartner(newOpportunities)
      const existingByPartner = groupByPartner(existingOpportunities)
      const wonByPartner = groupByPartner(wonThisWeek)
      const inactiveByPartner = groupByPartner(recentlyInactiveOpportunities)

      // 9. Obtener información de partners únicos para logos
      const allPartnerNames = new Set([
        ...Object.keys(newByPartner),
        ...Object.keys(existingByPartner),
        ...Object.keys(wonByPartner),
        ...Object.keys(inactiveByPartner),
      ])

      // Obtener logos de partners
      const partnerLogos: { [key: string]: string } = {}
      if (allPartnerNames.size > 0) {
        const partnerNamesArray = Array.from(allPartnerNames).filter((name) => name !== "Sin Partner")
        if (partnerNamesArray.length > 0) {
          const { data: partnersData } = await supabase
            .from("partners")
            .select("name, logo_url")
            .in("name", partnerNamesArray)

          if (partnersData) {
            partnersData.forEach((partner) => {
              if (partner.logo_url) {
                partnerLogos[partner.name] = partner.logo_url
              }
            })
          }
        }
      }

      // 10. Generar datos del reporte
      const reportData = {
        techCompany,
        partnerLogos,
        summary: {
          totalActiveOpportunities: activeOpportunities.length,
          newThisWeek: newOpportunities.length,
          wonThisWeek: wonThisWeek.length,
          inactiveThisWeek: recentlyInactiveOpportunities.length,
          withActivity,
          withoutActivity,
        },
        opportunitiesByPartner: {
          new: newByPartner,
          existing: existingByPartner,
          won: wonByPartner,
          inactive: inactiveByPartner,
        },
        generatedAt: new Date(),
      }

      // 11. Generar HTML
      const htmlContent = this.generateEnhancedHtml(reportData)

      // 12. Enviar emails
      console.log(`[WeeklyReportServiceV5] 5. Enviando emails...`)
      const results = []
      const emailFrom = process.env.NEXT_PUBLIC_EMAIL_FROM || "ScaleUp CRM <no-reply@scaleup-global.com>"

      for (const user of userData) {
        try {
          console.log(`[WeeklyReportServiceV5] Enviando a ${user.email}`)

          const { data, error } = await this.resend.emails.send({
            from: emailFrom,
            to: [user.email],
            subject: `${techCompany.name} - Reporte Semanal (${reportData.summary.totalActiveOpportunities} oportunidades activas)`,
            html: htmlContent,
          })

          if (error) {
            console.error(`[WeeklyReportServiceV5] Error enviando a ${user.email}:`, error)
            results.push({
              email: user.email,
              success: false,
              message: error.message,
            })
          } else {
            console.log(`[WeeklyReportServiceV5] Email enviado exitosamente a ${user.email}`)
            results.push({
              email: user.email,
              success: true,
              message: "Email sent successfully",
            })
          }

          // Pausa entre emails
          await new Promise((resolve) => setTimeout(resolve, 1000))
        } catch (error) {
          console.error(`[WeeklyReportServiceV5] Error inesperado enviando a ${user.email}:`, error)
          results.push({
            email: user.email,
            success: false,
            message: error instanceof Error ? error.message : "Unknown error",
          })
        }
      }

      const successCount = results.filter((r) => r.success).length
      console.log(`[WeeklyReportServiceV5] Completado: ${successCount}/${results.length} emails enviados`)

      return {
        success: successCount > 0,
        results,
        summary: reportData.summary,
      }
    } catch (error) {
      console.error(`[WeeklyReportServiceV5] Error general:`, error)
      return {
        success: false,
        results: [],
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  private static generateEnhancedHtml(reportData: any): string {
    const { techCompany, partnerLogos, summary, opportunitiesByPartner, generatedAt } = reportData
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

    const generateOpportunityTable = (opps: any[], showEndCustomer = true) => {
      if (!opps || opps.length === 0) {
        return `<p style="color: #666; font-style: italic; text-align: center; padding: 10px;">No hay oportunidades en esta categoría.</p>`
      }

      const rows = opps
        .map(
          (opp) => `
        <tr style="border-bottom: 1px solid #e0e0e0;">
          <td style="padding: 8px; border-right: 1px solid #e0e0e0;">${opp.country || "-"}</td>
          <td style="padding: 8px; border-right: 1px solid #e0e0e0; font-weight: 500;">${opp.title}</td>
          ${showEndCustomer ? `<td style="padding: 8px; border-right: 1px solid #e0e0e0;">${opp.end_customers?.name || "-"}</td>` : ""}
          <td style="padding: 8px; border-right: 1px solid #e0e0e0; text-align: right;">${formatCurrency(opp.estimated_value)}</td>
          <td style="padding: 8px;">${opp.estimated_close_date ? format(new Date(opp.estimated_close_date), "dd/MM/yyyy") : "-"}</td>
        </tr>
      `,
        )
        .join("")

      return `
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #e0e0e0; background-color: white; margin-bottom: 15px;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="padding: 10px; text-align: left; border-right: 1px solid #e0e0e0; font-size: 12px;">País</th>
              <th style="padding: 10px; text-align: left; border-right: 1px solid #e0e0e0; font-size: 12px;">Oportunidad</th>
              ${showEndCustomer ? `<th style="padding: 10px; text-align: left; border-right: 1px solid #e0e0e0; font-size: 12px;">Cliente Final</th>` : ""}
              <th style="padding: 10px; text-align: left; border-right: 1px solid #e0e0e0; font-size: 12px;">Monto</th>
              <th style="padding: 10px; text-align: left; font-size: 12px;">Fecha Cierre</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      `
    }

    const generatePartnerSection = (partnerName: string, partnerData: any) => {
      const hasData =
        (partnerData.new && partnerData.new.length > 0) ||
        (partnerData.existing && partnerData.existing.length > 0) ||
        (partnerData.won && partnerData.won.length > 0) ||
        (partnerData.inactive && partnerData.inactive.length > 0)

      if (!hasData) return ""

      // Obtener logo del partner
      const partnerLogo = partnerLogos[partnerName]
      const partnerIcon = partnerLogo
        ? `<img src="${partnerLogo}" alt="${partnerName}" style="width: 24px; height: 24px; border-radius: 4px; object-fit: cover; margin-right: 8px;">`
        : partnerName === "Sin Partner"
          ? "🏢"
          : "🤝"

      return `
        <div style="margin: 30px 0; border: 2px solid ${scaleupBlue}; border-radius: 8px; overflow: hidden;">
          <div style="background-color: ${scaleupBlue}; color: white; padding: 15px; display: flex; align-items: center;">
            ${partnerIcon}
            <h2 style="margin: 0; font-size: 18px;">${partnerName}</h2>
          </div>
          <div style="padding: 20px; background-color: #fafafa;">
            ${
              partnerData.new && partnerData.new.length > 0
                ? `
              <div style="margin-bottom: 20px;">
                <h3 style="color: ${scaleupBlue}; margin-bottom: 10px; font-size: 14px;">🆕 Nuevas esta semana (${partnerData.new.length})</h3>
                ${generateOpportunityTable(partnerData.new)}
              </div>
            `
                : ""
            }
            
            ${
              partnerData.existing && partnerData.existing.length > 0
                ? `
              <div style="margin-bottom: 20px;">
                <h3 style="color: ${scaleupBlue}; margin-bottom: 10px; font-size: 14px;">📋 En progreso (${partnerData.existing.length})</h3>
                ${generateOpportunityTable(partnerData.existing)}
              </div>
            `
                : ""
            }
            
            ${
              partnerData.won && partnerData.won.length > 0
                ? `
              <div style="margin-bottom: 20px;">
                <h3 style="color: #28a745; margin-bottom: 10px; font-size: 14px;">🏆 Ganadas esta semana (${partnerData.won.length})</h3>
                ${generateOpportunityTable(partnerData.won)}
              </div>
            `
                : ""
            }
            
            ${
              partnerData.inactive && partnerData.inactive.length > 0
                ? `
              <div style="margin-bottom: 20px;">
                <h3 style="color: #dc3545; margin-bottom: 10px; font-size: 14px;">❄️ Congeladas/Perdidas esta semana (${partnerData.inactive.length})</h3>
                ${generateOpportunityTable(partnerData.inactive)}
              </div>
            `
                : ""
            }
          </div>
        </div>
      `
    }

    // Generar secciones por partner
    const allPartners = new Set([
      ...Object.keys(opportunitiesByPartner.new || {}),
      ...Object.keys(opportunitiesByPartner.existing || {}),
      ...Object.keys(opportunitiesByPartner.won || {}),
      ...Object.keys(opportunitiesByPartner.inactive || {}),
    ])

    // Ordenar partners: primero los que tienen nombre, luego "Sin Partner"
    const sortedPartners = Array.from(allPartners).sort((a, b) => {
      if (a === "Sin Partner") return 1
      if (b === "Sin Partner") return -1
      return a.localeCompare(b)
    })

    const partnerSections = sortedPartners
      .map((partnerName) => {
        const partnerData = {
          new: opportunitiesByPartner.new[partnerName] || [],
          existing: opportunitiesByPartner.existing[partnerName] || [],
          won: opportunitiesByPartner.won[partnerName] || [],
          inactive: opportunitiesByPartner.inactive[partnerName] || [],
        }
        return generatePartnerSection(partnerName, partnerData)
      })
      .join("")

    return `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <!-- Header con logos -->
        <div style="background: linear-gradient(135deg, ${scaleupBlue} 0%, #003d82 100%); color: white; padding: 25px; border-radius: 12px; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1); position: relative;">
          <!-- Logo ScaleUp (izquierda) -->
          <div style="position: absolute; left: 20px; top: 50%; transform: translateY(-50%);">
            <img src="https://scaleup-global.com/wp-content/uploads/2023/03/ScaleUp-blanco.png" alt="ScaleUp" style="height: 40px; object-fit: contain;">
          </div>
          
          <!-- Logo Tech Company (derecha) -->
          ${
            techCompany.logo_url
              ? `
          <div style="position: absolute; right: 20px; top: 50%; transform: translateY(-50%);">
            <img src="${techCompany.logo_url}" alt="${techCompany.name}" style="height: 40px; object-fit: contain; background-color: white; padding: 5px; border-radius: 6px;">
          </div>
          `
              : ""
          }
          
          <!-- Contenido central -->
          <div style="margin: 0 80px;">
            <h1 style="margin: 0; font-size: 26px; font-weight: 600;">📊 Reporte Semanal</h1>
            <h2 style="margin: 10px 0 0 0; font-size: 20px; font-weight: 400; opacity: 0.9;">${techCompany.name}</h2>
            <p style="margin: 10px 0 0 0; opacity: 0.8; font-size: 14px;">Generado el ${formattedDate}</p>
          </div>
        </div>
        
        <!-- Resumen Ejecutivo -->
        <div style="background-color: white; padding: 25px; border-radius: 12px; margin-top: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: ${scaleupBlue}; margin-top: 0; font-size: 20px; border-bottom: 2px solid ${scaleupBlue}; padding-bottom: 10px;">📈 Resumen Ejecutivo</h2>
          
          <!-- KPIs Grid -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 15px; margin: 20px 0;">
            <div style="background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); padding: 20px; border-radius: 10px; text-align: center; border-left: 4px solid ${scaleupBlue};">
              <h3 style="margin: 0 0 5px 0; color: ${scaleupBlue}; font-size: 28px; font-weight: 700;">${summary.totalActiveOpportunities}</h3>
              <p style="margin: 0; color: #1565c0; font-size: 12px; font-weight: 500;">Oportunidades Activas</p>
            </div>
            <div style="background: linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%); padding: 20px; border-radius: 10px; text-align: center; border-left: 4px solid #28a745;">
              <h3 style="margin: 0 0 5px 0; color: #28a745; font-size: 28px; font-weight: 700;">${summary.newThisWeek}</h3>
              <p style="margin: 0; color: #2e7d32; font-size: 12px; font-weight: 500;">Nuevas esta semana</p>
            </div>
            <div style="background: linear-gradient(135deg, #fff3e0 0%, #ffcc02 100%); padding: 20px; border-radius: 10px; text-align: center; border-left: 4px solid #ffc107;">
              <h3 style="margin: 0 0 5px 0; color: #f57c00; font-size: 28px; font-weight: 700;">${summary.wonThisWeek}</h3>
              <p style="margin: 0; color: #ef6c00; font-size: 12px; font-weight: 500;">Ganadas esta semana</p>
            </div>
            <div style="background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%); padding: 20px; border-radius: 10px; text-align: center; border-left: 4px solid #dc3545;">
              <h3 style="margin: 0 0 5px 0; color: #dc3545; font-size: 28px; font-weight: 700;">${summary.inactiveThisWeek}</h3>
              <p style="margin: 0; color: #c62828; font-size: 12px; font-weight: 500;">Inactivas esta semana</p>
            </div>
          </div>

          <!-- Actividad Grid -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0;">
            <div style="background: linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%); padding: 20px; border-radius: 10px; text-align: center;">
              <h3 style="margin: 0 0 5px 0; color: #28a745; font-size: 24px; font-weight: 700;">${summary.withActivity}</h3>
              <p style="margin: 0; color: #2e7d32; font-size: 11px; font-weight: 500;">Con actividad esta semana</p>
            </div>
            <div style="background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%); padding: 20px; border-radius: 10px; text-align: center;">
              <h3 style="margin: 0 0 5px 0; color: #dc3545; font-size: 24px; font-weight: 700;">${summary.withoutActivity}</h3>
              <p style="margin: 0; color: #c62828; font-size: 11px; font-weight: 500;">Sin actividad esta semana</p>
            </div>
          </div>
        </div>

        <!-- Secciones por Partner -->
        <div style="margin-top: 20px;">
          <h2 style="color: ${scaleupBlue}; font-size: 22px; margin-bottom: 20px; text-align: center;">🤝 Oportunidades por Partner</h2>
          ${partnerSections}
        </div>

        <!-- Footer -->
        <div style="margin-top: 40px; padding: 20px; background-color: white; border-radius: 12px; text-align: center; border-top: 3px solid ${scaleupBlue};">
          <p style="margin: 0; font-size: 12px; color: #666; line-height: 1.5;">
            Este reporte fue generado automáticamente por <strong>ScaleUp CRM</strong> el ${formattedDate}.<br>
            <strong>Actividad:</strong> Incluye cambios de estado, creación de tareas o notas en la última semana.<br>
            <strong>Nota:</strong> Las oportunidades congeladas o perdidas solo se muestran la semana que cambiaron a ese estado.
          </p>
        </div>
      </div>
    `
  }
}
