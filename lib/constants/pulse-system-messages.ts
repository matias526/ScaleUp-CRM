// Mensajes de footer para emails del sistema
export const SYSTEM_EMAIL_FOOTERS = {
  es: "\n\n---\nEste email fue enviado automáticamente desde el sistema CRM de ScaleUp.",
  en: "\n\n---\nThis email was sent automatically from the ScaleUp CRM system.",
  pt: "\n\n---\nEste email foi enviado automaticamente do sistema CRM do ScaleUp.",
}

export type SupportedLanguage = "es" | "en" | "pt"

export function getSystemEmailFooter(language: SupportedLanguage): string {
  return SYSTEM_EMAIL_FOOTERS[language] || SYSTEM_EMAIL_FOOTERS.es
}
