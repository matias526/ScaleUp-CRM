import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { to, cc, bcc, subject, html, from, replyTo } = await request.json()

    console.log("Enviando email con Resend:", { to, cc, bcc, subject, from })

    // Validar que tenemos la API key
    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY no está configurada")
      return NextResponse.json({ success: false, message: "API key de Resend no configurada" }, { status: 500 })
    }

    // Validar destinatarios
    if (!to || !Array.isArray(to) || to.length === 0) {
      return NextResponse.json({ success: false, message: "Destinatarios no válidos" }, { status: 400 })
    }

    // Usar el email por defecto si no se proporciona
    const fromEmail = from || process.env.NEXT_PUBLIC_EMAIL_FROM || "ScaleUp CRM <no-reply@scaleup-global.com>"

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
    }

    // Agregar BCC si hay
    if (validBcc.length > 0) {
      emailData.bcc = validBcc
    }

    // Enviar email con Resend
    const result = await resend.emails.send(emailData)

    console.log("Email enviado correctamente:", result)

    return NextResponse.json({
      success: true,
      message: "Email enviado correctamente",
      data: result,
    })
  } catch (error) {
    console.error("Error al enviar email:", error)

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
