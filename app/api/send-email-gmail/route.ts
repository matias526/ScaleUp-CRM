import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { google } from "googleapis"

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID!,
  process.env.GOOGLE_CLIENT_SECRET!,
  process.env.GOOGLE_REDIRECT_URI!,
)

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] === INICIO ENVÍO DE EMAIL VIA GMAIL ===")

    const { to, cc, bcc, subject, html, replyTo, userId, attachment_ids } = await request.json()

    console.log("[v0] Datos recibidos:", {
      to,
      cc,
      bcc,
      subject: subject?.substring(0, 50),
      userId,
      htmlLength: html?.length,
      attachmentIdsCount: attachment_ids?.length || 0,
    })

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "userId es requerido" },
        { status: 400 },
      )
    }

    const supabase = createServerClient()

    // Obtener tokens de usuario
    console.log("[v0] Obteniendo tokens para usuario:", userId)
    const { data: userData, error: userError } = await (supabase
      .from("user_gmail_tokens")
      .select("refresh_token, access_token, expiry_date")
      .eq("user_id", userId)
      .single() as any)

    if (userError || !userData) {
      console.error("[v0] Error obteniendo tokens:", userError)
      return NextResponse.json(
        { success: false, message: "No hay tokens de Gmail para este usuario" },
        { status: 401 },
      )
    }

    console.log("[v0] Tokens encontrados, configurando OAuth2")

    // Configurar OAuth2 con tokens
    oauth2Client.setCredentials({
      refresh_token: userData.refresh_token,
      access_token: userData.access_token,
      expiry_date: userData.expiry_date ? new Date(userData.expiry_date).getTime() : undefined,
    })

    // Si el token está expirado, refrescar
    const { credentials } = await oauth2Client.refreshAccessToken()
    console.log("[v0] Tokens refrescados/validados")

    // Obtener email del usuario
    const { data: userProfile } = await (supabase
      .auth.admin.getUserById(userId) as any)
    const userEmail = userProfile?.user?.email

    if (!userEmail) {
      return NextResponse.json(
        { success: false, message: "No se encontró email del usuario" },
        { status: 400 },
      )
    }

    console.log("[v0] Email del usuario:", userEmail)

    // Descargar attachments si hay IDs
    const attachments = []
    if (attachment_ids && attachment_ids.length > 0) {
      console.log("[v0] Descargando", attachment_ids.length, "attachments")

      for (const attId of attachment_ids) {
        try {
          const { data: attachmentData, error: attError } = await (supabase
            .from("pulse_message_attachments")
            .select("file_url, file_name")
            .eq("id", attId)
            .single() as any)

          if (attError || !attachmentData) {
            console.warn(`[v0] Error obteniendo attachment ${attId}:`, attError)
            continue
          }

          attachments.push({
            filename: attachmentData.file_name,
            url: attachmentData.file_url,
          })
        } catch (error) {
          console.warn("[v0] Error procesando attachment ID:", attId, error)
          continue
        }
      }

      console.log("[v0] Attachments obtenidos:", attachments.length)
    }

    // Construir el mensaje MIME
    console.log("[v0] Constructing MIME message...")
    const mimeMessage = await buildMimeMessage({
      to,
      cc,
      bcc,
      subject,
      html,
      from: userEmail,
      replyTo,
      attachments,
    })

    console.log("[v0] MIME message construido, tamaño:", mimeMessage.length)

    // Enviar via Gmail API
    const gmail = google.gmail({ version: "v1", auth: oauth2Client })

    const encodedMessage = Buffer.from(mimeMessage).toString("base64").replace(/\+/g, "-").replace(/\//g, "_")

    console.log("[v0] Enviando mensaje a Gmail API...")
    const result = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedMessage,
      },
    })

    console.log("[v0] Mensaje enviado exitosamente:", result.data.id)

    // Registrar relación de attachments si hay
    if (attachment_ids && attachment_ids.length > 0) {
      console.log("[v0] Registrando relación de attachments...")
      // Aquí se registraría en pulse_sent_messages_attachments
      // pero necesitaríamos un log_id que viene de otra parte
    }

    return NextResponse.json({
      success: true,
      message: "Email enviado via Gmail",
      messageId: result.data.id,
    })
  } catch (error) {
    console.error("[v0] Error en send-email-gmail:", error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Error al enviar email",
      },
      { status: 500 },
    )
  }
}

// Función para construir un mensaje MIME con attachments en Base64
async function buildMimeMessage(data: {
  to: string[]
  cc?: string[]
  bcc?: string[]
  subject: string
  html: string
  from: string
  replyTo?: string
  attachments?: Array<{ filename: string; url: string }>
}): Promise<string> {
  console.log("[v0] buildMimeMessage called with:", {
    to: data.to,
    cc: data.cc,
    bcc: data.bcc,
    subject: data.subject?.substring(0, 50),
    from: data.from,
    replyTo: data.replyTo,
    attachmentsCount: data.attachments?.length || 0,
  })

  const boundary = "==boundary_" + Math.random().toString(36).substr(2, 9)

  const headers = [
    `From: ${data.from}`,
    `To: ${data.to.join(", ")}`,
    `Subject: ${data.subject}`,
    "MIME-Version: 1.0",
  ]

  // Si hay attachments, usar multipart/mixed, sino text/html
  if (data.attachments && data.attachments.length > 0) {
    headers.push(`Content-Type: multipart/mixed; boundary="${boundary}"`)
  } else {
    headers.push("Content-Type: text/html; charset=UTF-8")
  }

  if (data.cc && data.cc.length > 0) {
    headers.push(`Cc: ${data.cc.join(", ")}`)
  }

  if (data.replyTo) {
    headers.push(`Reply-To: ${data.replyTo}`)
  }

  let body = data.html

  // Si hay attachments, construir multipart con Base64
  if (data.attachments && data.attachments.length > 0) {
    const parts: string[] = []

    // Agregar el HTML como primera parte
    parts.push(`--${boundary}`)
    parts.push("Content-Type: text/html; charset=UTF-8")
    parts.push("Content-Transfer-Encoding: 7bit")
    parts.push("")
    parts.push(data.html)

    // Agregar cada attachment descargado y convertido a Base64
    for (const attachment of data.attachments) {
      console.log(`[v0] Descargando attachment: ${attachment.filename} desde ${attachment.url}`)

      try {
        // Descargar el archivo
        const response = await fetch(attachment.url)

        if (!response.ok) {
          console.warn(`[v0] Error descargando ${attachment.filename}: ${response.status}`)
          continue
        }

        // Convertir a Buffer y luego a Base64
        const arrayBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const base64Content = buffer.toString("base64")

        console.log(`[v0] Attachment convertido a Base64: ${attachment.filename} (${base64Content.length} caracteres)`)

        // Agregar el attachment al MIME
        parts.push(`--${boundary}`)
        parts.push(`Content-Type: application/octet-stream; name="${attachment.filename}"`)
        parts.push(`Content-Disposition: attachment; filename="${attachment.filename}"`)
        parts.push("Content-Transfer-Encoding: base64")
        parts.push("")

        // Agregar el contenido Base64 en líneas de máximo 76 caracteres (estándar MIME)
        for (let i = 0; i < base64Content.length; i += 76) {
          parts.push(base64Content.substring(i, i + 76))
        }
        parts.push("")
      } catch (error) {
        console.warn(`[v0] Error procesando attachment ${attachment.filename}:`, error)
        continue
      }
    }

    // Cerrar el boundary
    parts.push(`--${boundary}--`)
    body = parts.join("\r\n")
  }

  const mimeMessage = headers.join("\r\n") + "\r\n\r\n" + body

  console.log("[v0] Headers constructed:")
  headers.forEach((h, i) => console.log(`  [${i}]: ${h}`))

  return mimeMessage
}
