// Variables disponibles para usar en templates de Pulse
export const PULSE_TEMPLATE_VARIABLES = [
  { name: "contact_name", label: "Nombre del Contacto", example: "Juan Pérez" },
  { name: "contact_email", label: "Email del Contacto", example: "juan@example.com" },
  { name: "opportunity_name", label: "Nombre de la Oportunidad", example: "Proyecto X" },
  { name: "opportunity_value", label: "Valor de la Oportunidad", example: "$10,000" },
  { name: "company_name", label: "Nombre de la Empresa", example: "Tech Corp" },
  { name: "user_name", label: "Nombre del Usuario", example: "María García" },
  { name: "current_date", label: "Fecha Actual", example: "21/04/2026" },
  { name: "next_step", label: "Próximo Paso", example: "Llamada programada" },
] as const

export type PulseVariableName = typeof PULSE_TEMPLATE_VARIABLES[number]["name"]

// Función para obtener el tag de variable
export const getVariableTag = (variableName: string): string => {
  return `{{${variableName}}}`
}

// Función para obtener todas las variables disponibles como tags
export const getAllVariableTags = (): string[] => {
  return PULSE_TEMPLATE_VARIABLES.map((v) => getVariableTag(v.name))
}
