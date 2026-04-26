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
 * Con encabezado con logo, contenido en caja gráfica y footer
 */
export function buildSystemEmailHtml(
  subject: string,
  content: string,
  language: SupportedLanguage = "es"
): string {
  const footerText = getSystemEmailFooter(language)
  const logoUrl = "https://scaleup-global.com/logo.png" // Reemplazar con URL real del logo

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f5f5;
      margin: 0;
      padding: 0;
    }
    .email-container {
      background-color: #ffffff;
      margin: 20px auto;
      max-width: 600px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .email-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 30px;
      text-align: center;
      color: white;
    }
    .email-header img {
      height: 40px;
      margin-bottom: 15px;
    }
    .email-header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .email-content {
      padding: 40px;
    }
    .message-box {
      background-color: #f9f9f9;
      border-left: 4px solid #667eea;
      padding: 20px;
      border-radius: 4px;
      margin: 20px 0;
    }
    .message-box p {
      margin: 0;
      line-height: 1.8;
      color: #555;
    }
    .email-footer {
      background-color: #f5f5f5;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #888;
      border-top: 1px solid #e0e0e0;
    }
    .email-footer p {
      margin: 5px 0;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Header -->
    <div class="email-header">
      <img src="${logoUrl}" alt="ScaleUp Logo">
      <h1>${escapeHtml(subject)}</h1>
    </div>
    
    <!-- Content -->
    <div class="email-content">
      <div class="message-box">
        ${content}
      </div>
    </div>
    
    <!-- Footer -->
    <div class="email-footer">
      <p>${escapeHtml(footerText)}</p>
      <p>© ${new Date().getFullYear()} ScaleUp CRM. Todos los derechos reservados.</p>
    </div>
  </div>
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
