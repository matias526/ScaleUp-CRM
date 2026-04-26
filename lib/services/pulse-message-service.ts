import { supabase } from "@/lib/supabase/client"
import { sendEmail } from "@/lib/services/email-service"
import { replaceVariables, VariableValues } from "@/lib/pulse/pulse-message-variables"
import { getSystemEmailFooter, buildSystemEmailHtml, type SupportedLanguage } from "@/lib/constants/pulse-system-messages"
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
  channel: "email" | "whatsapp"
  senderMode?: "personal" | "system" // personal = desde cuenta del usuario, system = desde Resend
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
    let body = replaceVariables(options.body_content, options.variables_values)

    console.log("[v0] ====== DEBUG FLUJO ======")
    console.log("[v0] Paso 1: Body después de replaceVariables:")
    console.log(body.substring(0, 300))
    console.log("[v0] ¿Contiene [B]?", body.includes("[B]"))
    console.log("[v0] ¿Contiene [I]?", body.includes("[I]"))
    console.log("[v0] ¿Contiene [U]?", body.includes("[U]"))
    console.log("[v0] ¿Contiene [IMG]?", body.includes("[IMG]"))

    // Si es email del sistema, construir HTML profesional con encabezado y footer
    if (options.channel === "email" && options.senderMode === "system") {
      const language = (options.variables_values?.preferred_language || "es") as SupportedLanguage
      // Construir el email HTML completo con header, contenido en caja y footer
      const bodyHtmlFinal = buildSystemEmailHtml(subject, body, language)

      console.log("[v0] Paso 2: Email del sistema - usando template profesional HTML")

      let emailResult: any = null

      console.log("[v0] Paso 4: send_mode:", options.send_mode)
      console.log("[v0] recipients:", options.recipients.length)
      console.log("[v0] to_emails:", options.to_emails?.length)

      // Modo grupo: un email con To/CC/BCC
      if (options.send_mode === "group") {
        console.log("[v0] Modo grupo: enviando con HTML profesional")

        emailResult = await sendEmail({
          to: options.to_emails,
          cc: options.cc_emails?.filter((e) => e.trim()),
          bcc: options.bcc_emails?.filter((e) => e.trim()),
          subject,
          html: bodyHtmlFinal,
          senderMode: options.senderMode || "system",
          userId: options.user_id,
        })

        console.log("[v0] Resultado de envío en grupo:", emailResult)

        if (!emailResult.success) {
          throw new Error(emailResult.message || "Error al enviar email")
        }
      }
      // Modo individual: un email por cada destinatario
      else if (options.send_mode === "individual") {
        console.log("[v0] Modo individual: enviando", options.recipients.length, "emails con HTML profesional")

        const results = []
        for (const recipient of options.recipients) {
          const individualResult = await sendEmail({
            to: [recipient.email],
            cc: options.cc_emails?.filter((e) => e.trim()),
            bcc: options.bcc_emails?.filter((e) => e.trim()),
            subject,
            html: bodyHtmlFinal,
            senderMode: options.senderMode || "system",
            userId: options.user_id,
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

      // Registrar en BD usando el body original (sin HTML profesional) para mantener limpio
      await logSentMessage(options, subject, body, emailResult)

      // Agregar nota a la oportunidad
      await addNoteToOpportunity(options, subject, body)

      return emailResult
    }

    // Para emails personales, usar el flujo normal (sin template profesional)
    // CONVERTIR TAGS A HTML UNA SOLA VEZ
    console.log("[v0] Paso 2: Llamando convertMarkdownToHtml...")
    const bodyHtml = convertMarkdownToHtml(body)

    console.log("[v0] Paso 3: Body después de convertMarkdownToHtml (primeros 500 chars):")
    console.log(bodyHtml.substring(0, 500))

    let emailResult: any = null

    console.log("[v0] Paso 4: send_mode:", options.send_mode)
    console.log("[v0] recipients:", options.recipients.length)
    console.log("[v0] to_emails:", options.to_emails?.length)

    // Modo grupo: un email con To/CC/BCC
    if (options.send_mode === "group") {
      console.log("[v0] Modo grupo: enviando con HTML convertido")

      emailResult = await sendEmail({
        to: options.to_emails,
        cc: options.cc_emails?.filter((e) => e.trim()),
        bcc: options.bcc_emails?.filter((e) => e.trim()),
        subject,
        html: bodyHtml,
        senderMode: options.senderMode || "system",
        userId: options.user_id,
      })

      console.log("[v0] Resultado de envío en grupo:", emailResult)

      if (!emailResult.success) {
        throw new Error(emailResult.message || "Error al enviar email")
      }
    }
    // Modo individual: un email por cada destinatario
    else if (options.send_mode === "individual") {
      console.log("[v0] Modo individual: enviando", options.recipients.length, "emails con HTML convertido")

      const results = []
      for (const recipient of options.recipients) {
        const individualResult = await sendEmail({
          to: [recipient.email],
          subject,
          html: bodyHtml,
          senderMode: options.senderMode || "system",
          userId: options.user_id,
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
    } else {
      console.warn("[v0] send_mode no reconocido:", options.send_mode)
    }

    // Registrar en BD usando el body HTML convertido
    await logSentMessage(options, subject, bodyHtml, emailResult)

    // Agregar nota a la oportunidad usando el body HTML convertido
    await addNoteToOpportunity(options, subject, bodyHtml)

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
    if (!options.scheduled_at) {
      return {
        success: false,
        message: "Debe especificar una fecha y hora de envío",
      }
    }

    console.log("[v0] Programando mensaje para:", options.scheduled_at)

    const subject = replaceVariables(options.subject, options.variables_values)
    const body = replaceVariables(options.body_content, options.variables_values)

    // Guardar el mensaje programado en la BD
    await logSentMessage(options, subject, body, null, "scheduled")

    // TODO: Implementar un trigger/cron que revise la BD periódicamente
    // y envíe los mensajes cuando llegue la hora programada.
    // Por ahora solo guardamos en BD con estado "scheduled"

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
  bodyHtml: string,
  emailResult: any,
  status: string = "sent"
): Promise<void> {
  try {
    // Limpiar HTML para guardar en BD: solo texto + saltos de línea
    const bodyClean = stripHtmlKeepLinebreaks(bodyHtml)

    // Mapear a la estructura real de pulse_sent_messages_logs
    const messageData = {
      opportunity_id: options.opportunity_id,
      contact_id: null,
      sender_id: options.user_id,
      channel: options.channel || "email",
      sender_type: options.senderMode === "personal" ? "personal_email" : "system",
      final_subject: subject,
      final_body: bodyClean,
      status,
      error_message: null,
      sent_at: status === "sent" ? new Date().toISOString() : null,
    }

    console.log("[v0] Guardando mensaje en BD con contenido limpio (sin HTML)")

    // Insertar en la tabla correcta y obtener el ID
    const { error: messageError, data: messageData_result } = await (supabase
      .from("pulse_sent_messages_logs" as any)
      .insert([messageData])
      .select() as any)

    console.log("[v0] Respuesta de insert:", { messageError, data: messageData_result })

    if (messageError) {
      console.error("[v0] Error detallado:", JSON.stringify(messageError, null, 2))
      throw messageError
    }

    // Obtener el ID del mensaje insertado
    const logId = messageData_result?.[0]?.id
    console.log("[v0] Mensaje registrado en BD con ID:", logId)

    // Insertar attachments si existen
    if (options.attachments && options.attachments.length > 0 && logId) {
      console.log("[v0] Guardando", options.attachments.length, "attachments")

      const attachmentsData = options.attachments.map((att) => ({
        log_id: logId,
        attachment_id: att.id, // asumiendo que att tiene un id
      }))

      console.log("[v0] Datos de attachments a insertar:", JSON.stringify(attachmentsData, null, 2))

      const { error: attachError, data: attachResult } = await (supabase
        .from("pulse_sent_messages_attachments" as any)
        .insert(attachmentsData)
        .select() as any)

      console.log("[v0] Respuesta de attachments:", { attachError, data: attachResult })

      if (attachError) {
        console.warn("[v0] Error al guardar attachments:", JSON.stringify(attachError, null, 2))
        // No fallar por esto, solo advertir
      } else {
        console.log("[v0] Attachments guardados exitosamente")
      }
    }
  } catch (error) {
    console.error("[v0] Error al registrar mensaje:", JSON.stringify(error, null, 2))
  }
}

/**
 * Agrega una nota a la oportunidad con el resumen del mensaje
 */
async function addNoteToOpportunity(
  options: PulseMessageSendOptions,
  subject?: string,
  bodyHtml?: string
): Promise<void> {
  try {
    let content: string
    if (subject && bodyHtml) {
      // Limpiar HTML: solo texto + saltos de línea (no renderizar HTML en notas)
      const bodyClean = stripHtmlKeepLinebreaks(bodyHtml)
      content = `Pulse Message: ${subject}\n\n${bodyClean}`
    } else {
      // Fallback a la lógica original si no hay subject/body
      const recipientNames = options.recipients.map((r) => r.name).join(", ")
      content = `Mensaje Pulse enviado a: ${recipientNames}\nAsunto: ${options.subject}\nModo: ${options.send_mode === "group" ? "Grupal" : "Individual"}`
    }

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
 * Limpia el HTML dejando solo el texto y convierte <br> a saltos de línea
 * Usado SOLO para guardar en notas, no para emails
 */
function stripHtmlKeepLinebreaks(htmlContent: string): string {
  // Reemplazar <br> y <br /> por saltos de línea
  let text = htmlContent.replace(/<br\s*\/?>/gi, "\n")

  // Eliminar todos los otros tags HTML
  text = text.replace(/<[^>]+>/g, "")

  // Decodificar entidades HTML si las hay
  text = text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")

  return text
}

/**
 * Convierte tags de formato [B], [I], [U], [IMG], [BR] a HTML
 */
function convertMarkdownToHtml(content: string): string {
  console.log("[v0] Convirtiendo tags a HTML")

  let html = content

  // Reemplazar [BR] por saltos de línea
  html = html.replaceAll("[BR]", "\n")

  // [IMG]url[/IMG] -> <img src="url" />
  html = html.replace(/\[IMG\](.*?)\[\/IMG\]/g, '<img src="$1" style="max-width: 100%; border-radius: 5px; margin: 10px 0;" alt="Imagen" />')

  // [B]text[/B] -> <strong>text</strong>
  html = html.replace(/\[B\](.*?)\[\/B\]/g, '<strong>$1</strong>')

  // [I]text[/I] -> <em>text</em>
  html = html.replace(/\[I\](.*?)\[\/I\]/g, '<em>$1</em>')

  // [U]text[/U] -> <u>text</u>
  html = html.replace(/\[U\](.*?)\[\/U\]/g, '<u>$1</u>')

  // Convertir saltos de línea a <br>
  html = html.replace(/\n/g, "<br>")

  // Convertir URLs a links
  html = html.replace(/https?:\/\/[^\s<]+/g, '<a href="$&" style="color: #2563eb;">$&</a>')

  console.log("[v0] Tags convertidos exitosamente")

  return `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">${html}</div>`
}
