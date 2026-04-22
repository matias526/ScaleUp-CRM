/**
 * Diccionario de variables disponibles para templates de Pulse
 * Se utiliza para renderizar en preview y reemplazar en el contenido del mensaje
 * 
 * ESTRUCTURA:
 * {
 *   label: "Texto que verá el usuario",
 *   tag: "{{variable_name}}",
 *   source: "tabla.campo" - de dónde se obtiene el dato
 * }
 */

export interface PulseVariable {
  label: string
  tag: string
  source: string
}

export const PULSE_MESSAGE_VARIABLES: PulseVariable[] = [
  // CONTACTO
  {
    label: "Nombre del Contacto",
    tag: "{{contact_name}}",
    source: "contacts.name",
  },
  {
    label: "Email del Contacto",
    tag: "{{contact_email}}",
    source: "contacts.email",
  },
  {
    label: "Teléfono del Contacto",
    tag: "{{contact_phone}}",
    source: "contacts.phone",
  },
  {
    label: "Cargo del Contacto",
    tag: "{{contact_position}}",
    source: "contacts.position",
  },

  // EMPRESA/CLIENTE
  {
    label: "Nombre de la Empresa",
    tag: "{{company_name}}",
    source: "end_customers.name",
  },
  {
    label: "Sector de la Empresa",
    tag: "{{company_industry}}",
    source: "end_customers.industry",
  },
  {
    label: "Ciudad de la Empresa",
    tag: "{{company_city}}",
    source: "end_customers.city",
  },
  {
    label: "País de la Empresa",
    tag: "{{company_country}}",
    source: "end_customers.country",
  },

  // OPORTUNIDAD
  {
    label: "Nombre de la Oportunidad",
    tag: "{{opportunity_name}}",
    source: "opportunities.name",
  },
  {
    label: "Etapa de la Oportunidad",
    tag: "{{opportunity_stage}}",
    source: "opportunities.stage",
  },
  {
    label: "Valor de la Oportunidad",
    tag: "{{opportunity_value}}",
    source: "opportunities.value",
  },
  {
    label: "Probabilidad de la Oportunidad",
    tag: "{{opportunity_probability}}",
    source: "opportunities.probability",
  },
  {
    label: "Descripción de la Oportunidad",
    tag: "{{opportunity_description}}",
    source: "opportunities.description",
  },

  // USUARIO/AUTOR
  {
    label: "Nombre del Usuario",
    tag: "{{user_name}}",
    source: "users.first_name + users.last_name",
  },
  {
    label: "Email del Usuario",
    tag: "{{user_email}}",
    source: "users.email",
  },

  // FECHA/HORA
  {
    label: "Fecha de Hoy",
    tag: "{{today_date}}",
    source: "Sistema - fecha actual",
  },
  {
    label: "Hora Actual",
    tag: "{{current_time}}",
    source: "Sistema - hora actual",
  },
]

/**
 * Obtiene los valores de las variables basado en el contexto de una oportunidad
 */
export interface VariableValues {
  [key: string]: string | number | null
}

/**
 * Reemplaza las variables en un texto con los valores proporcionados
 */
export function replaceVariables(text: string, values: VariableValues): string {
  let result = text

  Object.entries(values).forEach(([key, value]) => {
    const tag = `{{${key}}}`
    const stringValue = value !== null && value !== undefined ? String(value) : ""
    result = result.replaceAll(tag, stringValue)
  })

  return result
}

/**
 * Genera vista previa de un mensaje reemplazando variables con valores de ejemplo
 */
export function generatePreview(text: string, values: VariableValues): string {
  return replaceVariables(text, values)
}
