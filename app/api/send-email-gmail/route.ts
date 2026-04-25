import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase/client"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] === INICIO ENVÍO DE EMAIL VIA GMAIL ===")
    
    const { to, cc, bcc, subject, html, replyTo, userId } = await request.json()

    console.log("[v0] Datos recibidos:", { 
      to, 
      cc, 
      bcc, 
      subject: subject?.substring(0, 50), 
      userId,
      htmlLength: html?.length 
    })

    // Validar userId
    if (!userId) {
      console.error("[v0] ERROR: userId no proporcionado")
      return NextResponse.json({ success: false, message: "userId requerido" }, { status: 400 })
    }

    // Obtener el access_token de la BD
    console.log("[v0] Buscando token para user:", userId)
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
    const mimeMessage = buildMimeMessage({
      to,
      cc,
      bcc,
      subject,
      html,
      from: userEmail,
      replyTo,
    })

    console.log("[v0] Mensaje MIME construido, longitud:", mimeMessage.length)

    // Enviar via Gmail API
    console.log("[v0] Enviando a través de Gmail API...")
    const gmailResponse = await fetch("https://www.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        raw: Buffer.from(mimeMessage).toString("base64"),
      }),
    })

    console.log("[v0] Respuesta de Gmail API:", gmailResponse.status, gmailResponse.statusText)

    if (!gmailResponse.ok) {
      const errorData = await gmailResponse.json()
      console.error("[v0] ERROR de Gmail API:", errorData)
      return NextResponse.json({
        success: false,
        message: `Error de Gmail: ${errorData.error?.message || "Error desconocido"}`,
        error: errorData,
      }, { status: 400 })
    }

    const result = await gmailResponse.json()
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

// Función para construir un mensaje MIME
function buildMimeMessage(data: {
  to: string[]
  cc?: string[]
  bcc?: string[]
  subject: string
  html: string
  from: string
  replyTo?: string
}): string {
  const headers = [
    `From: ${data.from}`,
    `To: ${data.to.join(", ")}`,
    `Subject: ${data.subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=UTF-8",
  ]

  if (data.cc && data.cc.length > 0) {
    headers.push(`Cc: ${data.cc.join(", ")}`)
  }

  if (data.replyTo) {
    headers.push(`Reply-To: ${data.replyTo}`)
  }

  const mimeMessage = headers.join("\r\n") + "\r\n\r\n" + data.html

  return mimeMessage
}
