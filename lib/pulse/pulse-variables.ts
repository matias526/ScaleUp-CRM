// Diccionario estricto de variables disponibles para Pulse Templates
export const PULSE_VARIABLES = {
  entidad: [
    { label: "Nombre Oportunidad", tag: "{{opportunity_name}}" },
    { label: "Monto Oportunidad", tag: "{{opportunity_amount}}" },
    { label: "Nombre Tech Company", tag: "{{tech_company_name}}" },
    { label: "Nombre Prospect Partner", tag: "{{prospect_partner_name}}" },
  ],
  destinatario: [
    { label: "Nombre (Receptor)", tag: "{{recipient_first_name}}" },
    { label: "Apellido (Receptor)", tag: "{{recipient_last_name}}" },
    { label: "Cargo (Receptor)", tag: "{{recipient_job_title}}" },
  ],
  emisor: [
    { label: "Nombre (Remitente)", tag: "{{sender_name}}" },
    { label: "Empresa (Remitente)", tag: "{{sender_company}}" },
  ],
}

// Obtener todas las variables disponibles (para búsqueda y validación)
export const getAllPulseVariables = () => {
  const allVars: Array<{ label: string; tag: string }> = []
  Object.values(PULSE_VARIABLES).forEach((category) => {
    allVars.push(...category)
  })
  return allVars
}

// Validar que una cadena solo contiene variables predefinidas
export const validatePulseContent = (content: string): boolean => {
  const allVars = getAllPulseVariables()
  const variablePattern = /\{\{[^}]+\}\}/g
  const foundVariables = content.match(variablePattern) || []

  return foundVariables.every((foundVar) => {
    return allVars.some((validVar) => validVar.tag === foundVar)
  })
}
