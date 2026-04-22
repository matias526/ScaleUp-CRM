import { supabase } from "@/lib/supabase/client"
import { sendEmail } from "@/lib/services/email-service"
import { replaceVariables, VariableValues } from "@/lib/pulse/pulse-message-variables"
import { v4 as uuidv4 } from "uuid"

export interface PulseMessageRecipient {
  contact_id: string
  email: string
  name: string
}

export interface PulseMessageSendOptions {
  template_id: string
  opportunity_id: string
  user_id: string
  recipients: PulseMessageRecipient[]
  scheduled_at?: string | null
  send_mode: "individual" | "group" // individual = uno a uno, group = To/CC/BCC
  to_emails: string[]
  cc_emails?: string[]
  bcc_emails?: string[]
  subject: string
  body_content: string
  variables_values: VariableValues
  attachments?: { url: string; filename: string }[]
}

/**
 * Envía un mensaje Pulse (email o WhatsApp)
 * Registra el envío en la BD y agrega una nota a la oportunidad
 */
export async function sendPulseMessage(options: PulseMessageSendOptions): Promise<{ success: boolean; message?: string; data?: any }> {
  try {
    console.log("[v0] Iniciando envío de mensaje Pulse:", {
      template_id: options.template_id,
      recipients_count: options.recipients.length,
      send_mode: options.send_mode,
    })

    // Si está programado para después, solo guardar en BD sin enviar
    if (options.scheduled_at) {
      return scheduleMessage(options)
    }

    // Enviar inmediatamente
    return await sendMessageNow(options)
  } catch (error) {
    console.error("[v0] Error en sendPulseMessage:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error desconocido",
    }
  }
}

/**
 * Envía el mensaje inmediatamente
 */
async function sendMessageNow(options: PulseMessageSendOptions): Promise<{ success: boolean; message?: string; data?: any }> {
  try {
    const subject = replaceVariables(options.subject, options.variables_values)
    const body = replaceVariables(options.body_content, options.variables_values)

    let emailResult: any = null

    // Modo grupo: un email con To/CC/BCC
    if (options.send_mode === "group") {
      console.log("[v0] Enviando en modo grupo")
      emailResult = await sendEmail({
        to: options.to_emails,
        cc: options.cc_emails?.filter((e) => e.trim()),
        bcc: options.bcc_emails?.filter((e) => e.trim()),
        subject,
        html: convertMarkdownToHtml(body),
      })

      if (!emailResult.success) {
        throw new Error(emailResult.message || "Error al enviar email")
      }
    }

    // Modo individual: un email por cada destinatario
    if (options.send_mode === "individual") {
      console.log("[v0] Enviando en modo individual a", options.recipients.length, "destinatarios")
      
      const results = []
      for (const recipient of options.recipients) {
        const individualResult = await sendEmail({
          to: [recipient.email],
          subject,
          html: convertMarkdownToHtml(body),
        })
        results.push(individualResult)

        if (!individualResult.success) {
          console.warn(`[v0] Error al enviar a ${recipient.email}:`, individualResult.message)
        }
      }

      emailResult = {
        success: results.some((r) => r.success),
        message: `Enviados: ${results.filter((r) => r.success).length}/${results.length}`,
      }
    }

    // Registrar en BD
    await logSentMessage(options, subject, body, emailResult)

    // Agregar nota a la oportunidad
    await addNoteToOpportunity(options)

    return {
      success: true,
      message: "Mensaje enviado correctamente",
      data: emailResult,
    }
  } catch (error) {
    console.error("[v0] Error en sendMessageNow:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error al enviar",
    }
  }
}

/**
 * Programa un mensaje para ser enviado después
 */
async function scheduleMessage(options: PulseMessageSendOptions): Promise<{ success: boolean; message?: string }> {
  try {
    console.log("[v0] Programando mensaje para:", options.scheduled_at)

    // TODO: Implementar lógica de programación
    // Por ahora, solo guardamos en BD indicando que está programado

    const subject = replaceVariables(options.subject, options.variables_values)
    const body = replaceVariables(options.body_content, options.variables_values)

    await logSentMessage(options, subject, body, null, "scheduled")

    return {
      success: true,
      message: `Mensaje programado para ${options.scheduled_at}`,
    }
  } catch (error) {
    console.error("[v0] Error en scheduleMessage:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error al programar",
    }
  }
}

/**
 * Registra el mensaje enviado en la BD
 */
async function logSentMessage(
  options: PulseMessageSendOptions,
  subject: string,
  body: string,
  emailResult: any,
  status: string = "sent"
): Promise<void> {
  try {
    const message_id = uuidv4()

    // Insertar el mensaje enviado
    const { error: messageError } = await supabase.from("pulse_sent_messages").insert([
      {
        id: message_id,
        template_id: options.template_id,
        opportunity_id: options.opportunity_id,
        user_id: options.user_id,
        subject,
        body_content: body,
        send_mode: options.send_mode,
        status,
        scheduled_at: options.scheduled_at,
        sent_at: status === "sent" ? new Date().toISOString() : null,
        recipients_count: options.recipients.length,
        email_result: emailResult,
      },
    ])

    if (messageError) throw messageError

    // Insertar adjuntos si existen
    if (options.attachments && options.attachments.length > 0) {
      const attachmentsData = options.attachments.map((att) => ({
        message_id,
        file_url: att.url,
        filename: att.filename,
      }))

      const { error: attachError } = await supabase.from("pulse_sent_messages_attachments").insert(attachmentsData)

      if (attachError) console.warn("[v0] Error al guardar adjuntos:", attachError)
    }

    console.log("[v0] Mensaje registrado en BD:", message_id)
  } catch (error) {
    console.error("[v0] Error al registrar mensaje:", error)
  }
}

/**
 * Agrega una nota a la oportunidad con el resumen del mensaje
 */
async function addNoteToOpportunity(options: PulseMessageSendOptions): Promise<void> {
  try {
    const recipientNames = options.recipients.map((r) => r.name).join(", ")
    const content = `Mensaje Pulse enviado a: ${recipientNames}\nAsunto: ${options.subject}\nModo: ${options.send_mode === "group" ? "Grupal" : "Individual"}`

    const { error } = await supabase.from("notes").insert([
      {
        opportunity_id: options.opportunity_id,
        user_id: options.user_id,
        content,
        is_private: false,
      },
    ])

    if (error) {
      console.warn("[v0] Error al agregar nota:", error)
    } else {
      console.log("[v0] Nota agregada a la oportunidad")
    }
  } catch (error) {
    console.error("[v0] Error en addNoteToOpportunity:", error)
  }
}

/**
 * Convierte markdown simple a HTML para el email
 */
function convertMarkdownToHtml(markdown: string): string {
  let html = markdown

  // Convertir saltos de línea a <br>
  html = html.replace(/\n/g, "<br>")

  // Convertir **bold** a <strong>
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")

  // Convertir *italic* a <em>
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>")

  // Convertir URLs a links
  html = html.replace(/https?:\/\/[^\s]+/g, '<a href="$&" style="color: #2563eb;">$&</a>')

  return `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">${html}</div>`
}
