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
    const accessToken = emailIntegration.access_token
    const userEmail = emailIntegration.email

    console.log("[v0] Token obtenido. Email:", userEmail)
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
