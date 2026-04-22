// Función para enviar emails usando Resend
export async function sendEmail(emailData: {
  to: string[]
  cc?: string[]
  bcc?: string[]
  subject: string
  html: string
  from?: string
  replyTo?: string
  partnerName?: string
  techCompanyName?: string
}): Promise<{ success: boolean; message?: string; data?: any }> {
  try {
    console.log("Preparando envío de email a:", emailData.to)
    console.log("Asunto:", emailData.subject)

    // Validar que haya destinatarios válidos
    if (!emailData.to || !Array.isArray(emailData.to) || emailData.to.length === 0) {
      console.error("No se proporcionaron destinatarios válidos")
      return {
        success: false,
        message: "No se proporcionaron destinatarios válidos",
      }
    }

    // Filtrar destinatarios nulos o vacíos
    const validRecipients = emailData.to.filter((email) => email && typeof email === "string" && email.trim() !== "")

    if (validRecipients.length === 0) {
      console.error("No hay destinatarios válidos después de filtrar")
      return {
        success: false,
        message: "No hay destinatarios válidos",
      }
    }

    // Usar el email por defecto si no se proporciona
    const from = emailData.from || process.env.NEXT_PUBLIC_EMAIL_FROM || "ScaleUp CRM <no-reply@scaleup-global.com>"

    // Enviar el email usando la API route
    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: validRecipients,
          cc: emailData.cc,
          bcc: emailData.bcc,
          subject: emailData.subject,
          html: emailData.html,
          from,
          replyTo: emailData.replyTo,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Error en la respuesta de la API:", errorData)
        throw new Error(errorData.message || "Error al enviar el email")
      }

      const result = await response.json()
      console.log("Email enviado correctamente:", result)
      return { success: true, data: result.data }
    } catch (fetchError) {
      console.error("Error en la petición fetch:", fetchError)
      return {
        success: false,
        message: fetchError instanceof Error ? fetchError.message : "Error al enviar el email",
      }
    }
  } catch (error) {
    console.error("Error general al enviar email:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error al enviar el email",
    }
  }
}
    }

    // Filtrar destinatarios nulos o vacíos
    const validRecipients = emailData.to.filter((email) => email && typeof email === "string" && email.trim() !== "")

    if (validRecipients.length === 0) {
      console.error("No hay destinatarios válidos después de filtrar")
      return {
        success: false,
        message: "No hay destinatarios válidos",
      }
    }

    // Usar el email por defecto si no se proporciona uno
    const from = emailData.from || process.env.NEXT_PUBLIC_EMAIL_FROM || "ScaleUp CRM <no-reply@scaleup-global.com>"

    // Enviar el email usando la API route
    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: validRecipients,
          subject: emailData.subject,
          html: emailData.html,
          from,
          replyTo: emailData.replyTo,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Error en la respuesta de la API:", errorData)
        throw new Error(errorData.message || "Error al enviar el email")
      }

      const result = await response.json()
      console.log("Email enviado correctamente:", result)
      return { success: true, data: result.data }
    } catch (fetchError) {
      console.error("Error en la petición fetch:", fetchError)
      return {
        success: false,
        message: fetchError instanceof Error ? fetchError.message : "Error al enviar el email",
      }
    }
  } catch (error) {
    console.error("Error general al enviar email:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error al enviar el email",
    }
  }
}

// Función para generar el HTML del reporte semanal
export function generateWeeklyReportEmailHtml(data: {
  techCompanyName: string
  weekStart: string
  weekEnd: string
  currentWeekStats: {
    totalOpportunities: number
    newOpportunities: number
    closedOpportunities: number
    totalValue: number
    averageValue: number
  }
  previousWeekStats: {
    totalOpportunities: number
    newOpportunities: number
    closedOpportunities: number
    totalValue: number
    averageValue: number
  }
  opportunities: Array<{
    title: string
    endCustomer: string
    stage: string
    value: number
    probability: number
    partner: string
  }>
  topPartners: Array<{
    name: string
    opportunitiesCount: number
    totalValue: number
  }>
}): string {
  const { techCompanyName, weekStart, weekEnd, currentWeekStats, previousWeekStats, opportunities, topPartners } = data

  // Calcular cambios porcentuales
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return Math.round(((current - previous) / previous) * 100)
  }

  const opportunitiesChange = calculateChange(currentWeekStats.totalOpportunities, previousWeekStats.totalOpportunities)
  const newOpportunitiesChange = calculateChange(currentWeekStats.newOpportunities, previousWeekStats.newOpportunities)
  const valueChange = calculateChange(currentWeekStats.totalValue, previousWeekStats.totalValue)

  // Estilos CSS inline para compatibilidad con clientes de email
  const styles = {
    container:
      "font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;",
    header:
      "background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;",
    title: "font-size: 28px; font-weight: bold; margin: 0; text-shadow: 0 2px 4px rgba(0,0,0,0.3);",
    subtitle: "font-size: 16px; margin: 10px 0 0; opacity: 0.9;",
    statsGrid:
      "display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px;",
    statCard:
      "background: white; padding: 25px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center;",
    statValue: "font-size: 32px; font-weight: bold; color: #333; margin-bottom: 5px;",
    statLabel: "font-size: 14px; color: #666; margin-bottom: 10px;",
    statChange: "font-size: 12px; font-weight: bold; padding: 4px 8px; border-radius: 20px;",
    positiveChange: "background-color: #d4edda; color: #155724;",
    negativeChange: "background-color: #f8d7da; color: #721c24;",
    neutralChange: "background-color: #e2e3e5; color: #383d41;",
    section:
      "background: white; padding: 25px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-bottom: 20px;",
    sectionTitle:
      "font-size: 20px; font-weight: bold; color: #333; margin-bottom: 20px; border-bottom: 2px solid #667eea; padding-bottom: 10px;",
    table: "width: 100%; border-collapse: collapse;",
    tableHeader:
      "background-color: #f8f9fa; font-weight: bold; padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;",
    tableCell: "padding: 12px; border-bottom: 1px solid #dee2e6;",
    footer: "text-align: center; margin-top: 30px; padding: 20px; color: #666; font-size: 12px;",
  }

  // Generar cambio con estilo
  const renderChange = (change: number) => {
    const isPositive = change > 0
    const isNegative = change < 0
    const changeStyle = isPositive ? styles.positiveChange : isNegative ? styles.negativeChange : styles.neutralChange
    const arrow = isPositive ? "↗" : isNegative ? "↘" : "→"
    return `<span style="${styles.statChange}; ${changeStyle}">${arrow} ${Math.abs(change)}%</span>`
  }

  // Formatear moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return `
    <div style="${styles.container}">
      <div style="${styles.header}">
        <h1 style="${styles.title}">Reporte Semanal - ${techCompanyName}</h1>
        <p style="${styles.subtitle}">${weekStart} - ${weekEnd}</p>
      </div>

      <div style="${styles.statsGrid}">
        <div style="${styles.statCard}">
          <div style="${styles.statValue}">${currentWeekStats.totalOpportunities}</div>
          <div style="${styles.statLabel}">Total Oportunidades</div>
          ${renderChange(opportunitiesChange)}
        </div>
        
        <div style="${styles.statCard}">
          <div style="${styles.statValue}">${currentWeekStats.newOpportunities}</div>
          <div style="${styles.statLabel}">Nuevas Oportunidades</div>
          ${renderChange(newOpportunitiesChange)}
        </div>
        
        <div style="${styles.statCard}">
          <div style="${styles.statValue}">${formatCurrency(currentWeekStats.totalValue)}</div>
          <div style="${styles.statLabel}">Valor Total</div>
          ${renderChange(valueChange)}
        </div>
        
        <div style="${styles.statCard}">
          <div style="${styles.statValue}">${formatCurrency(currentWeekStats.averageValue)}</div>
          <div style="${styles.statLabel}">Valor Promedio</div>
        </div>
      </div>

      <div style="${styles.section}">
        <h2 style="${styles.sectionTitle}">Oportunidades Activas</h2>
        <table style="${styles.table}">
          <thead>
            <tr>
              <th style="${styles.tableHeader}">Oportunidad</th>
              <th style="${styles.tableHeader}">Cliente Final</th>
              <th style="${styles.tableHeader}">Partner</th>
              <th style="${styles.tableHeader}">Etapa</th>
              <th style="${styles.tableHeader}">Valor</th>
              <th style="${styles.tableHeader}">Probabilidad</th>
            </tr>
          </thead>
          <tbody>
            ${opportunities
              .map(
                (opp) => `
              <tr>
                <td style="${styles.tableCell}">${opp.title}</td>
                <td style="${styles.tableCell}">${opp.endCustomer}</td>
                <td style="${styles.tableCell}">${opp.partner}</td>
                <td style="${styles.tableCell}">${opp.stage}</td>
                <td style="${styles.tableCell}">${formatCurrency(opp.value)}</td>
                <td style="${styles.tableCell}">${opp.probability}%</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
      </div>

      <div style="${styles.section}">
        <h2 style="${styles.sectionTitle}">Top Partners</h2>
        <table style="${styles.table}">
          <thead>
            <tr>
              <th style="${styles.tableHeader}">Partner</th>
              <th style="${styles.tableHeader}">Oportunidades</th>
              <th style="${styles.tableHeader}">Valor Total</th>
            </tr>
          </thead>
          <tbody>
            ${topPartners
              .map(
                (partner) => `
              <tr>
                <td style="${styles.tableCell}">${partner.name}</td>
                <td style="${styles.tableCell}">${partner.opportunitiesCount}</td>
                <td style="${styles.tableCell}">${formatCurrency(partner.totalValue)}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
      </div>

      <div style="${styles.footer}">
        <p>Este es un email automático generado por el sistema CRM ScaleUp.</p>
        <p>Para más información, accede al <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://crm.scaleup-global.com"}" style="color: #667eea;">panel de control</a></p>
      </div>
    </div>
  `
}
