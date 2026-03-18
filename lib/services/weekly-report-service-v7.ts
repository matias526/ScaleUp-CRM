//import { createClient } from "@/lib/supabase/server"
import { createServerClient } from "@/lib/supabase/server"
import { format, subDays } from "date-fns"
import { Resend } from "resend"

export class WeeklyReportServiceV7 {
  private static resend = new Resend(process.env.RESEND_API_KEY)

  static async sendWeeklyReport(techCompanyId: string) {
    console.log(`[WeeklyReportServiceV7] === INICIO sendWeeklyReport para ${techCompanyId} ===`)

    try {
      const supabase = createServerClient()

      // 1. Obtener tech company
      console.log(`[WeeklyReportServiceV7] 1. Obteniendo tech company...`)
      const { data: techCompany, error: techError } = await supabase
        .from("tech_companies")
        .select("id, name, logo_url")
        .eq("id", techCompanyId)
        .single()

      if (techError || !techCompany) {
        console.error(`[WeeklyReportServiceV7] Error tech company:`, techError)
        return { success: false, results: [], error: "Tech company not found" }
      }
      console.log(`[WeeklyReportServiceV7] Tech company OK:`, techCompany.name)

      // 2. Obtener destinatarios
      console.log(`[WeeklyReportServiceV7] 2. Obteniendo destinatarios...`)
      const { data: recipientData, error: recipientError } = await supabase
        .from("weekly_report_recipients")
        .select("user_id")
        .eq("tech_company_id", techCompanyId)
        .eq("is_active", true)

      if (recipientError) {
        console.error(`[WeeklyReportServiceV7] Error recipients:`, recipientError)
        return { success: false, results: [], error: "Error getting recipients" }
      }

      if (!recipientData || recipientData.length === 0) {
        console.log(`[WeeklyReportServiceV7] No recipients found`)
        return { success: false, results: [], error: "No recipients configured" }
      }

      const userIds = recipientData.map((r) => r.user_id)
      console.log(`[WeeklyReportServiceV7] Found ${userIds.length} recipient IDs`)

      // 3. Obtener datos de usuarios
      console.log(`[WeeklyReportServiceV7] 3. Obteniendo datos de usuarios...`)
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, email, first_name, last_name, preferred_language")
        .in("id", userIds)

      if (userError) {
        console.error(`[WeeklyReportServiceV7] Error users:`, userError)
        return { success: false, results: [], error: "Error getting users" }
      }

      if (!userData || userData.length === 0) {
        console.log(`[WeeklyReportServiceV7] No users found`)
        return { success: false, results: [], error: "No users found" }
      }

      console.log(
        `[WeeklyReportServiceV7] Found ${userData.length} users:`,
        userData.map((u) => u.email),
      )

      // 4. Verificar configuración de email
      if (!process.env.RESEND_API_KEY) {
        console.error(`[WeeklyReportServiceV7] RESEND_API_KEY not configured`)
        return { success: false, results: [], error: "RESEND_API_KEY not configured" }
      }

      // 5. Obtener oportunidades con partners
      console.log(`[WeeklyReportServiceV7] 4. Obteniendo oportunidades...`)

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
        console.error(`[WeeklyReportServiceV7] Error opportunities:`, oppError)
        return { success: false, results: [], error: `Error getting opportunities: ${oppError.message}` }
      }

      const allOpportunities = opportunities || []
      console.log(`[WeeklyReportServiceV7] Found ${allOpportunities.length} opportunities`)

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

      // 10. Calcular valores totales
      const calculateTotalValue = (opportunities: any[]) => {
        return opportunities.reduce((total, opp) => total + (opp.estimated_value || 0), 0)
      }

      const totalActiveValue = calculateTotalValue(activeOpportunities)
      const totalNewValue = calculateTotalValue(newOpportunities)
      const totalWonValue = calculateTotalValue(wonThisWeek)

      // 11. Generar datos del reporte
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
          totalActiveValue,
          totalNewValue,
          totalWonValue,
        },
        opportunitiesByPartner: {
          new: newByPartner,
          existing: existingByPartner,
          won: wonByPartner,
          inactive: inactiveByPartner,
        },
        generatedAt: new Date(),
      }

      // 12. Generar HTML
      const htmlContent = this.generateEnhancedHtml(reportData)

      // 13. Enviar emails
      console.log(`[WeeklyReportServiceV7] 5. Enviando emails...`)
      const results = []
      const emailFrom = process.env.NEXT_PUBLIC_EMAIL_FROM || "ScaleUp CRM <no-reply@scaleup-global.com>"

      // Generar subject con fecha
      const reportDate = format(new Date(), "dd/MM/yyyy")
      const emailSubject = `${techCompany.name} - Reporte Semanal ${reportDate} (${reportData.summary.totalActiveOpportunities} oportunidades activas)`

      for (const user of userData) {
        try {
          console.log(`[WeeklyReportServiceV7] Enviando a ${user.email}`)

          const { data, error } = await this.resend.emails.send({
            from: emailFrom,
            to: [user.email],
            subject: emailSubject,
            html: htmlContent,
          })

          if (error) {
            console.error(`[WeeklyReportServiceV7] Error enviando a ${user.email}:`, error)
            results.push({
              email: user.email,
              success: false,
              message: error.message,
            })
          } else {
            console.log(`[WeeklyReportServiceV7] Email enviado exitosamente a ${user.email}`)
            results.push({
              email: user.email,
              success: true,
              message: "Email sent successfully",
            })
          }

          // Pausa entre emails
          await new Promise((resolve) => setTimeout(resolve, 1000))
        } catch (error) {
          console.error(`[WeeklyReportServiceV7] Error inesperado enviando a ${user.email}:`, error)
          results.push({
            email: user.email,
            success: false,
            message: error instanceof Error ? error.message : "Unknown error",
          })
        }
      }

      const successCount = results.filter((r) => r.success).length
      console.log(`[WeeklyReportServiceV7] Completado: ${successCount}/${results.length} emails enviados`)

      return {
        success: successCount > 0,
        results,
        summary: reportData.summary,
      }
    } catch (error) {
      console.error(`[WeeklyReportServiceV7] Error general:`, error)
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
        return `<p style="color: #666; font-style: italic; text-align: center; padding: 20px;">No hay oportunidades en esta categoría.</p>`
      }

      const rows = opps
        .map(
          (opp) => `
        <tr style="border-bottom: 1px solid #e0e0e0;">
          <td style="padding: 12px; border-right: 1px solid #e0e0e0; width: 80px; text-align: center;">${opp.country || "-"}</td>
          <td style="padding: 12px; border-right: 1px solid #e0e0e0; width: 300px; font-weight: 500;">${opp.title}</td>
          ${showEndCustomer ? `<td style="padding: 12px; border-right: 1px solid #e0e0e0; width: 200px;">${opp.end_customers?.name || "-"}</td>` : ""}
          <td style="padding: 12px; border-right: 1px solid #e0e0e0; width: 120px; text-align: right; font-weight: 600; color: ${scaleupBlue};">${formatCurrency(opp.estimated_value)}</td>
          <td style="padding: 12px; width: 100px; text-align: center;">${opp.estimated_close_date ? format(new Date(opp.estimated_close_date), "dd/MM/yyyy") : "-"}</td>
        </tr>
      `,
        )
        .join("")

      return `
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #e0e0e0; background-color: white; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <thead>
            <tr style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);">
              <th style="padding: 15px; text-align: center; border-right: 1px solid #e0e0e0; font-size: 13px; font-weight: 600; color: #495057; width: 80px;">País</th>
              <th style="padding: 15px; text-align: left; border-right: 1px solid #e0e0e0; font-size: 13px; font-weight: 600; color: #495057; width: 300px;">Oportunidad</th>
              ${showEndCustomer ? `<th style="padding: 15px; text-align: left; border-right: 1px solid #e0e0e0; font-size: 13px; font-weight: 600; color: #495057; width: 200px;">Cliente Final</th>` : ""}
              <th style="padding: 15px; text-align: center; border-right: 1px solid #e0e0e0; font-size: 13px; font-weight: 600; color: #495057; width: 120px;">Monto</th>
              <th style="padding: 15px; text-align: center; font-size: 13px; font-weight: 600; color: #495057; width: 100px;">Fecha Cierre</th>
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

      // Obtener logo del partner con dimensiones proporcionales
      const partnerLogo = partnerLogos[partnerName]
      const partnerIcon = partnerLogo
        ? `<img src="${partnerLogo}" alt="${partnerName}" style="height: 32px; width: auto; max-width: 120px; border-radius: 6px; object-fit: contain; margin-right: 12px; background-color: white; padding: 4px;">`
        : partnerName === "Sin Partner"
          ? `<span style="font-size: 24px; margin-right: 12px;">🏢</span>`
          : `<span style="font-size: 24px; margin-right: 12px;">🤝</span>`

      return `
        <div style="margin: 30px 0; border: 2px solid ${scaleupBlue}; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, ${scaleupBlue} 0%, #003d82 100%); color: white; padding: 20px; display: flex; align-items: center;">
            ${partnerIcon}
            <h2 style="margin: 0; font-size: 20px; font-weight: 600;">${partnerName}</h2>
          </div>
          <div style="padding: 25px; background-color: #fafbfc;">
            ${
              partnerData.new && partnerData.new.length > 0
                ? `
              <div style="margin-bottom: 25px;">
                <h3 style="color: ${scaleupBlue}; margin-bottom: 15px; font-size: 16px; font-weight: 600; display: flex; align-items: center;">
                  <span style="font-size: 20px; margin-right: 8px;">🆕</span>
                  Nuevas esta semana (${partnerData.new.length})
                </h3>
                ${generateOpportunityTable(partnerData.new)}
              </div>
            `
                : ""
            }
            
            ${
              partnerData.existing && partnerData.existing.length > 0
                ? `
              <div style="margin-bottom: 25px;">
                <h3 style="color: ${scaleupBlue}; margin-bottom: 15px; font-size: 16px; font-weight: 600; display: flex; align-items: center;">
                  <span style="font-size: 20px; margin-right: 8px;">📋</span>
                  En progreso (${partnerData.existing.length})
                </h3>
                ${generateOpportunityTable(partnerData.existing)}
              </div>
            `
                : ""
            }
            
            ${
              partnerData.won && partnerData.won.length > 0
                ? `
              <div style="margin-bottom: 25px;">
                <h3 style="color: #28a745; margin-bottom: 15px; font-size: 16px; font-weight: 600; display: flex; align-items: center;">
                  <span style="font-size: 20px; margin-right: 8px;">🏆</span>
                  Ganadas esta semana (${partnerData.won.length})
                </h3>
                ${generateOpportunityTable(partnerData.won)}
              </div>
            `
                : ""
            }
            
            ${
              partnerData.inactive && partnerData.inactive.length > 0
                ? `
              <div style="margin-bottom: 25px;">
                <h3 style="color: #dc3545; margin-bottom: 15px; font-size: 16px; font-weight: 600; display: flex; align-items: center;">
                  <span style="font-size: 20px; margin-right: 8px;">❄️</span>
                  Congeladas/Perdidas esta semana (${partnerData.inactive.length})
                </h3>
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
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 900px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <!-- Header con logos alineados -->
        <div style="background: linear-gradient(135deg, ${scaleupBlue} 0%, #003d82 100%); color: white; padding: 30px; border-radius: 15px; text-align: center; box-shadow: 0 6px 12px rgba(0,0,0,0.15); position: relative; display: flex; align-items: center; justify-content: space-between;">
          <!-- Logo ScaleUp (izquierda) -->
          <div style="flex: 0 0 auto;">
            <img src="/images/design-mode/scaleup-logo-white.png" alt="ScaleUp" style="height: 45px; object-fit: contain;">
          </div>
          
          <!-- Contenido central -->
          <div style="flex: 1; text-align: center; margin: 0 30px;">
            <h1 style="margin: 0; font-size: 28px; font-weight: 700;">📊 Reporte Semanal</h1>
            <p style="margin: 8px 0 0 0; opacity: 0.85; font-size: 15px;">Generado el ${formattedDate}</p>
          </div>
          
          <!-- Logo Tech Company (derecha) -->
          <div style="flex: 0 0 auto;">
            ${
              techCompany.logo_url
                ? `<img src="${techCompany.logo_url}" alt="${techCompany.name}" style="height: 45px; width: auto; max-width: 120px; object-fit: contain; background-color: white; padding: 8px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">`
                : `<div style="width: 45px; height: 45px; background-color: rgba(255,255,255,0.2); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 20px;">🏢</div>`
            }
          </div>
        </div>
        
        <!-- Resumen Ejecutivo COMPACTO -->
        <div style="background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%); padding: 20px; border-radius: 12px; margin-top: 20px; box-shadow: 0 3px 6px rgba(0,0,0,0.1); border: 1px solid #e9ecef;">
          <!-- Título compacto -->
          <div style="text-align: center; margin-bottom: 15px;">
            <h2 style="color: ${scaleupBlue}; margin: 0; font-size: 18px; font-weight: 700;">📈 Resumen Ejecutivo</h2>
          </div>
          
          <!-- KPIs en una sola fila compacta -->
          <div style="display: flex; justify-content: space-between; gap: 10px; margin-bottom: 15px;">
            <div style="flex: 1; background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); padding: 12px; border-radius: 8px; text-align: center; border-left: 3px solid ${scaleupBlue};">
              <div style="font-size: 20px; font-weight: 800; color: ${scaleupBlue}; margin-bottom: 2px;">${summary.totalActiveOpportunities}</div>
              <div style="font-size: 9px; color: #1565c0; font-weight: 600; text-transform: uppercase;">Activas</div>
              <div style="font-size: 8px; color: #1976d2; font-weight: 500;">${formatCurrency(summary.totalActiveValue)}</div>
            </div>
            
            <div style="flex: 1; background: linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%); padding: 12px; border-radius: 8px; text-align: center; border-left: 3px solid #28a745;">
              <div style="font-size: 20px; font-weight: 800; color: #28a745; margin-bottom: 2px;">${summary.newThisWeek}</div>
              <div style="font-size: 9px; color: #2e7d32; font-weight: 600; text-transform: uppercase;">Nuevas</div>
              <div style="font-size: 8px; color: #388e3c; font-weight: 500;">${formatCurrency(summary.totalNewValue)}</div>
            </div>
            
            <div style="flex: 1; background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%); padding: 12px; border-radius: 8px; text-align: center; border-left: 3px solid #ff9800;">
              <div style="font-size: 20px; font-weight: 800; color: #f57c00; margin-bottom: 2px;">${summary.wonThisWeek}</div>
              <div style="font-size: 9px; color: #ef6c00; font-weight: 600; text-transform: uppercase;">Ganadas</div>
              <div style="font-size: 8px; color: #f57c00; font-weight: 500;">${formatCurrency(summary.totalWonValue)}</div>
            </div>
            
            <div style="flex: 1; background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%); padding: 12px; border-radius: 8px; text-align: center; border-left: 3px solid #dc3545;">
              <div style="font-size: 20px; font-weight: 800; color: #dc3545; margin-bottom: 2px;">${summary.inactiveThisWeek}</div>
              <div style="font-size: 9px; color: #c62828; font-weight: 600; text-transform: uppercase;">Inactivas</div>
              <div style="font-size: 8px; color: #d32f2f; font-weight: 500;">Esta semana</div>
            </div>
          </div>

          <!-- Actividad en una sola fila muy compacta -->
          <div style="display: flex; gap: 10px;">
            <div style="flex: 1; background: linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%); padding: 10px; border-radius: 8px; text-align: center;">
              <span style="font-size: 16px; font-weight: 800; color: #28a745; margin-right: 5px;">${summary.withActivity}</span>
              <span style="font-size: 9px; color: #2e7d32; font-weight: 600;">CON ACTIVIDAD</span>
            </div>
            <div style="flex: 1; background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%); padding: 10px; border-radius: 8px; text-align: center;">
              <span style="font-size: 16px; font-weight: 800; color: #dc3545; margin-right: 5px;">${summary.withoutActivity}</span>
              <span style="font-size: 9px; color: #c62828; font-weight: 600;">SIN ACTIVIDAD</span>
            </div>
          </div>
        </div>

        <!-- Secciones por Partner -->
        <div style="margin-top: 25px;">
          <div style="text-align: center; margin-bottom: 25px;">
            <h2 style="color: ${scaleupBlue}; font-size: 22px; margin: 0; font-weight: 700; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 26px; margin-right: 10px;">🤝</span>
              Oportunidades por Partner
            </h2>
            <div style="width: 60px; height: 3px; background: linear-gradient(90deg, ${scaleupBlue}, #007bff); margin: 12px auto; border-radius: 2px;"></div>
          </div>
          ${partnerSections}
        </div>

        <!-- Footer -->
        <div style="margin-top: 30px; padding: 20px; background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%); border-radius: 12px; text-align: center; border-top: 3px solid ${scaleupBlue}; box-shadow: 0 3px 6px rgba(0,0,0,0.1);">
          <p style="margin: 0; font-size: 12px; color: #666; line-height: 1.5;">
            Este reporte fue generado automáticamente por <strong style="color: ${scaleupBlue};">ScaleUp CRM</strong> el ${formattedDate}.<br>
            <strong>Actividad:</strong> Incluye cambios de estado, creación de tareas o notas en la última semana.<br>
            <strong>Nota:</strong> Las oportunidades congeladas o perdidas solo se muestran la semana que cambiaron a ese estado.
          </p>
        </div>
      </div>
    `
  }
}
