import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

// Inicializar Resend con la API key
const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { subject, comment, userEmail, userName } = await req.json()

    if (!subject || !comment) {
      return NextResponse.json({ success: false, message: "Tema y comentario son obligatorios" }, { status: 400 })
    }

    // Verificar que la API key está configurada
    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY no está configurada")
      return NextResponse.json(
        { success: false, message: "Error de configuración del servidor de email" },
        { status: 500 },
      )
    }

    // Obtener información adicional
    const timestamp = new Date().toLocaleString("es-ES", {
      timeZone: "Europe/Madrid",
      dateStyle: "full",
      timeStyle: "long",
    })
    const ip = req.headers.get("x-forwarded-for") || "IP no disponible"
    const userAgent = req.headers.get("user-agent") || "User-Agent no disponible"

    // Crear el asunto del email
    const emailSubject = `Ayuda desde el CRM ScaleUp - ${subject}`

    // Crear el cuerpo del email
    const emailHtml = `
      <h2>Solicitud de ayuda desde el CRM ScaleUp</h2>
      <p><strong>Tema:</strong> ${subject}</p>
      <p><strong>Comentario:</strong></p>
      <p>${comment.replace(/\n/g, "<br>")}</p>
      <hr>
      <h3>Información del remitente:</h3>
      <ul>
        <li><strong>Usuario:</strong> ${userName} (${userEmail})</li>
        <li><strong>Fecha y hora:</strong> ${timestamp}</li>
        <li><strong>IP:</strong> ${ip}</li>
        <li><strong>Navegador:</strong> ${userAgent}</li>
      </ul>
    `

    const defaultFrom = process.env.NEXT_PUBLIC_EMAIL_FROM || "ScaleUp CRM <no-reply@scaleup-global.com>"

    console.log("Enviando email con Resend:", {
      from: defaultFrom,
      to: "support@scaleup-global.com",
      subject: emailSubject,
      reply_to: userEmail,
    })

    // Enviar el email usando Resend
    const { data, error } = await resend.emails.send({
      from: defaultFrom,
      to: "support@scaleup-global.com",
      subject: emailSubject,
      html: emailHtml,
      reply_to: userEmail,
    })

    if (error) {
      console.error("Error al enviar email con Resend:", error)
      return NextResponse.json(
        { success: false, message: error.message || "Error al enviar el email" },
        { status: 500 },
      )
    }

    console.log("Email enviado correctamente con Resend:", data)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error("Error en la API de ayuda:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Error interno del servidor" },
      { status: 500 },
    )
  }
}
