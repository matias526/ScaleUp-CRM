/*import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] === INICIO ENVÍO DE EMAIL VIA GMAIL ===")

    const { to, cc, bcc, subject, html, replyTo, userId, attachments } = await request.json()

    console.log("[v0] Datos recibidos:", {
      to,
      cc,
      bcc,
      subject: subject?.substring(0, 50),
      userId,
      htmlLength: html?.length,
      attachmentsCount: attachments?.length || 0
    })

    // Validar userId
    if (!userId) {
      console.error("[v0] ERROR: userId no proporcionado")
      return NextResponse.json({ success: false, message: "userId requerido" }, { status: 400 })
    }

    // Obtener el access_token de la BD usando servidor client
    console.log("[v0] Buscando token para user:", userId)
    const supabase = createServerClient()
    const { data: integration, error: queryError } = await (supabase
      .from("user_email_integrations" as any)
      .select("*")
      .eq("user_id", userId)
      .eq("is_connected", true)
      .limit(1) as any)

    if (queryError) {
      console.error("[v0] Error consultando BD:", queryError)
      return NextResponse.json({
        success: false,
        message: "Error al obtener integración de email",
        error: queryError
      }, { status: 500 })
    }

    if (!integration || integration.length === 0) {
      console.error("[v0] No hay integración de email para este usuario")
      return NextResponse.json({
        success: false,
        message: "No hay integración de email conectada para este usuario"
      }, { status: 400 })
    }

    const emailIntegration = integration[0]
    let accessToken = emailIntegration.access_token
    const refreshToken = emailIntegration.refresh_token
    const userEmail = emailIntegration.email
    const tokenExpiresAt = emailIntegration.token_expires_at

    console.log("[v0] Token obtenido. Email:", userEmail)
    console.log("[v0] Token expira en:", tokenExpiresAt)

    // Verificar si el token expiró
    if (tokenExpiresAt && new Date(tokenExpiresAt) < new Date()) {
      console.log("[v0] Token expirado, refrescando...")

      if (!refreshToken) {
        console.error("[v0] ERROR: No hay refresh_token disponible")
        return NextResponse.json({
          success: false,
          message: "Token expirado y no se puede refrescar. Por favor conecta tu email nuevamente.",
        }, { status: 401 })
      }

      // Refrescar el token
      const refreshResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: process.env.GOOGLE_OAUTH_CLIENT_ID,
          client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
          refresh_token: refreshToken,
          grant_type: "refresh_token",
        }),
      })

      if (!refreshResponse.ok) {
        const error = await refreshResponse.json()
        console.error("[v0] Error refrescando token:", error)
        return NextResponse.json({
          success: false,
          message: "Error al refrescar token de Google",
          error,
        }, { status: 401 })
      }

      const newTokenData = await refreshResponse.json()
      accessToken = newTokenData.access_token

      console.log("[v0] Token refrescado exitosamente")
      console.log("[v0] Nuevo token:", accessToken?.substring(0, 20) + "...")

      // Actualizar el token en la BD
      const { error: updateError } = await (supabase
        .from("user_email_integrations" as any)
        .update({
          access_token: accessToken,
          token_expires_at: new Date(Date.now() + newTokenData.expires_in * 1000).toISOString(),
        })
        .eq("user_id", userId) as any)

      if (updateError) {
        console.error("[v0] Error actualizando token en BD:", updateError)
        // No fallar por esto, seguir intentando con el nuevo token
      }
    }

    console.log("[v0] Token válido:", accessToken?.substring(0, 20) + "...")

    // Construir el mensaje MIME
    console.log("[v0] Constructing MIME message with params:", {
      to,
      cc,
      bcc,
      subject: subject?.substring(0, 50),
      from: userEmail,
      replyTo,
      htmlLength: html?.length,
    })

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

    console.log("[v0] MIME message built, length:", mimeMessage.length)
    console.log("[v0] MIME preview (first 300 chars):")
    console.log(mimeMessage.substring(0, 300))

    // Convertir a base64
    const base64Message = Buffer.from(mimeMessage).toString("base64")
    console.log("[v0] Base64 encoded, length:", base64Message.length)

    // Enviar via Gmail API
    console.log("[v0] Calling Gmail API at: https://www.googleapis.com/gmail/v1/users/me/messages/send")
    console.log("[v0] Authorization header:", `Bearer ${accessToken?.substring(0, 20)}...`)

    const gmailResponse = await fetch("https://www.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        raw: base64Message,
      }),
    })

    console.log("[v0] Gmail API response:", gmailResponse.status, gmailResponse.statusText)

    const responseText = await gmailResponse.text()
    console.log("[v0] Gmail API response body:", responseText)

    if (!gmailResponse.ok) {
      let errorData
      try {
        errorData = JSON.parse(responseText)
      } catch {
        errorData = { raw: responseText }
      }
      console.error("[v0] ERROR de Gmail API:", JSON.stringify(errorData, null, 2))
      return NextResponse.json({
        success: false,
        message: `Error de Gmail: ${errorData.error?.message || errorData.raw || "Error desconocido"}`,
        error: errorData,
      }, { status: 400 })
    }

    let result
    try {
      result = JSON.parse(responseText)
    } catch {
      result = { raw: responseText }
    }

    console.log("[v0] Email enviado exitosamente. Message ID:", result.id)
    console.log("[v0] === FIN ENVÍO EXITOSO ===")

    return NextResponse.json({
      success: true,
      message: "Email enviado correctamente via Gmail",
      data: result,
    })
  } catch (error) {
    console.error("[v0] === ERROR EN ENVÍO VIA GMAIL ===")
    console.error("[v0] Error:", error)
    if (error instanceof Error) {
      console.error("[v0] Mensaje:", error.message)
      console.error("[v0] Stack:", error.stack)
    }

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Error al enviar email via Gmail",
        error: error instanceof Error ? error.stack : String(error),
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
        const base64Content = buffer.toString('base64')

        console.log(`[v0] Attachment convertido a Base64: ${attachment.filename} (${base64Content.length} caracteres)`)

        // Agregar el attachment al MIME
        parts.push(`--${boundary}`)
        parts.push(`Content-Type: application/octet-stream; name="${attachment.filename}"`)
        parts.push(`Content-Disposition: attachment; filename="${attachment.filename}"`)
        parts.push("Content-Transfer-Encoding: base64")
        parts.push("")

        // Agregar el contenido Base64 en líneas de máximo 76 caracteres (estándar MIME)
        let base64Line = ""
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
}*/