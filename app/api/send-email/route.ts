import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] === INICIO ENVÍO DE EMAIL ===")

    const { to, cc, bcc, subject, html, from, replyTo, attachments } = await request.json()

    console.log("[v0] Datos recibidos:", {
      to,
      cc,
      bcc,
      subject: subject?.substring(0, 50),
      from,
      htmlLength: html?.length,
      attachmentsCount: attachments?.length || 0
    })

    // Validar que tenemos la API key
    if (!process.env.RESEND_API_KEY) {
      console.error("[v0] ERROR: RESEND_API_KEY no está configurada")
      return NextResponse.json({ success: false, message: "API key de Resend no configurada" }, { status: 500 })
    }
    console.log("[v0] RESEND_API_KEY está configurada ✓")

    // Validar destinatarios
    if (!to || !Array.isArray(to) || to.length === 0) {
      console.error("[v0] ERROR: Destinatarios no válidos:", to)
      return NextResponse.json({ success: false, message: "Destinatarios no válidos" }, { status: 400 })
    }
    console.log("[v0] Destinatarios válidos ✓")

    // Usar el email por defecto si no se proporciona
    const fromEmail = from || process.env.NEXT_PUBLIC_EMAIL_FROM || "ScaleUp CRM <no-reply@scaleup-global.com>"
    console.log("[v0] Email remitente:", fromEmail)

    // Filtrar emails vacíos en CC y BCC
    const validCc = cc?.filter((email: string) => email && email.trim()) || []
    const validBcc = bcc?.filter((email: string) => email && email.trim()) || []

    // Construir objeto de envío
    const emailData: any = {
      from: fromEmail,
      to: to,
      subject: subject,
      html: html,
      replyTo: replyTo,
    }

    // Agregar CC si hay
    if (validCc.length > 0) {
      emailData.cc = validCc
      console.log("[v0] CC agregados:", validCc)
    }

    // Agregar BCC si hay
    if (validBcc.length > 0) {
      emailData.bcc = validBcc
      console.log("[v0] BCC agregados:", validBcc)
    }

    // Agregar attachments si hay
    if (attachments && attachments.length > 0) {
      console.log("[v0] Procesando", attachments.length, "adjuntos...")
      const processedAttachments = attachments.map((att: any) => {
        console.log("[v0] Adjunto:", { filename: att.filename, urlLength: att.url?.length })
        return {
          filename: att.filename,
          path: att.url, // Resend espera 'path' para URLs remotas
        }
      })
      emailData.attachments = processedAttachments
      console.log("[v0] Adjuntos procesados para Resend ✓")
    }

    console.log("[v0] Payload final para Resend:", {
      from: emailData.from,
      to: emailData.to,
      cc: emailData.cc,
      bcc: emailData.bcc,
      subject: emailData.subject?.substring(0, 50),
      htmlLength: emailData.html?.length,
      attachments: emailData.attachments
    })

    // Enviar email con Resend
    console.log("[v0] Llamando a Resend.emails.send()...")
    const result = await resend.emails.send(emailData)

    console.log("[v0] Respuesta de Resend:", result)

    if (result.error) {
      console.error("[v0] ERROR en respuesta de Resend:", result.error)
      return NextResponse.json({
        success: false,
        message: `Error de Resend: ${result.error.message || "Error desconocido"}`,
        error: result.error,
      }, { status: 400 })
    }

    console.log("[v0] === FIN ENVÍO EXITOSO ===")

    return NextResponse.json({
      success: true,
      message: "Email enviado correctamente",
      data: result,
    })
  } catch (error) {
    console.error("[v0] === ERROR EN ENVÍO DE EMAIL ===")
    console.error("[v0] Error:", error)
    console.error("[v0] Tipo:", error instanceof Error ? "Error object" : typeof error)
    if (error instanceof Error) {
      console.error("[v0] Mensaje:", error.message)
      console.error("[v0] Stack:", error.stack)
    }

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Error al enviar email",
        error: error instanceof Error ? error.stack : String(error),
      },
      { status: 500 },
    )
  }
}
