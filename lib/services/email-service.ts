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
  weekNumber: number
  year: number
  totalOpportunities: number
  totalValue: number
  closedDeals: number
  pendingFollowUps: number
  teamMembers: Array<{
    name: string
    opportunities: number
    value: number
  }>
}): string {
  const formattedValue = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(data.totalValue)

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2563eb; color: white; padding: 20px; border-radius: 5px; text-align: center; }
          .section { margin: 20px 0; padding: 15px; border-left: 4px solid #2563eb; background-color: #f9fafb; }
          .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 10px 0; }
          .stat-item { background-color: white; padding: 10px; border-radius: 5px; text-align: center; }
          .stat-value { font-size: 24px; font-weight: bold; color: #2563eb; }
          .stat-label { font-size: 12px; color: #666; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          th { background-color: #e5e7eb; padding: 10px; text-align: left; }
          td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Reporte Semanal - Semana ${data.weekNumber}, ${data.year}</h1>
          </div>

          <div class="section">
            <h2>Resumen General</h2>
            <div class="stats">
              <div class="stat-item">
                <div class="stat-value">${data.totalOpportunities}</div>
                <div class="stat-label">Oportunidades</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">${formattedValue}</div>
                <div class="stat-label">Valor Total</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">${data.closedDeals}</div>
                <div class="stat-label">Negocios Cerrados</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">${data.pendingFollowUps}</div>
                <div class="stat-label">Follow-ups Pendientes</div>
              </div>
            </div>
          </div>

          <div class="section">
            <h2>Performance del Equipo</h2>
            <table>
              <thead>
                <tr>
                  <th>Miembro</th>
                  <th>Oportunidades</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                ${data.teamMembers
                  .map(
                    (member) => `
                  <tr>
                    <td>${member.name}</td>
                    <td>${member.opportunities}</td>
                    <td>${new Intl.NumberFormat("es-AR", {
                      style: "currency",
                      currency: "ARS",
                    }).format(member.value)}</td>
                  </tr>
                `,
                  )
                  .join("")}
              </tbody>
            </table>
          </div>

          <div class="section" style="text-align: center; color: #666; font-size: 12px;">
            <p>Este es un reporte automático del sistema CRM ScaleUp. Por favor no responda a este email.</p>
          </div>
        </div>
      </body>
    </html>
  `
}
