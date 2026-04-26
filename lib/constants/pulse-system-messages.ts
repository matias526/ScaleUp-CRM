// Mensajes de footer para emails del sistema
export const SYSTEM_EMAIL_FOOTERS = {
  es: "Este email fue enviado automáticamente desde el sistema CRM de ScaleUp.",
  en: "This email was sent automatically from the ScaleUp CRM system.",
  pt: "Este email foi enviado automaticamente do sistema CRM do ScaleUp.",
}

export type SupportedLanguage = "es" | "en" | "pt"

export function getSystemEmailFooter(language: SupportedLanguage): string {
  return SYSTEM_EMAIL_FOOTERS[language] || SYSTEM_EMAIL_FOOTERS.es
}

/**
 * Construye un email HTML profesional para Pulse Messages del sistema
 * Usando el mismo formato que daily-email-service (encabezado azul, contenido limpio, footer)
 */
export function buildSystemEmailHtml(
  subject: string,
  content: string,
  language: SupportedLanguage = "es"
): string {
  const footerText = getSystemEmailFooter(language)
  const logoUrl = "https://crm.scaleup-global.com/images/scaleup-logo-white.png"

  // Colores del esquema
  const colors = {
    primary: "#0055b8",
    text: "#1f2937",
    textMuted: "#6b7280",
    border: "#e5e7eb",
    background: "#f9fafb",
    white: "#ffffff",
  }

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
                    <div style="font-size: 24px; font-weight: 700; color: ${colors.white}; margin-bottom: 4px;">${escapeHtml(subject)}</div>
                  </td>
                  <td align="right" valign="top">
                    <img src="${logoUrl}" alt="ScaleUp" style="height: 32px; width: auto;" />
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="background-color: ${colors.white}; padding: 24px; border-radius: 0 0 8px 8px;">
              <div style="font-size: 14px; line-height: 1.6; color: ${colors.text}; margin-bottom: 24px;">
                ${content}
              </div>
              
              <!-- Footer -->
              <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid ${colors.border}; text-align: center; font-size: 12px; color: ${colors.textMuted};">
                <p style="margin: 5px 0;">${footerText}</p>
                <p style="margin: 5px 0;">© ${new Date().getFullYear()} ScaleUp CRM. Todos los derechos reservados.</p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

/**
 * Escapa caracteres HTML para prevenir inyección
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }
  return text.replace(/[&<>"']/g, (char) => map[char])
}
