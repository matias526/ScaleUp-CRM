import { type NextRequest, NextResponse } from "next/server"
import sgMail from "@sendgrid/mail"

// Configurar la API key de SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)
} else {
  console.error("SENDGRID_API_KEY no está configurada en las variables de entorno")
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ success: false, message: "Se requiere un email" }, { status: 400 })
    }

    // Verificar que la API key está configurada
    if (!process.env.SENDGRID_API_KEY) {
      console.error("SENDGRID_API_KEY no está configurada")
      return NextResponse.json(
        { success: false, message: "Error de configuración del servidor de email" },
        { status: 500 },
      )
    }

    const from = process.env.NEXT_PUBLIC_EMAIL_FROM || "noreply@example.com"

    // Configurar el mensaje
    const msg = {
      to: email,
      from: from,
      subject: "Prueba de SendGrid - CRM ScaleUp",
      text: "Este es un email de prueba para verificar que SendGrid está correctamente configurado.",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
          <h1 style="color: #333;">Prueba de SendGrid</h1>
          <p>Este es un email de prueba para verificar que SendGrid está correctamente configurado en tu aplicación CRM ScaleUp.</p>
          <p>Si estás recibiendo este email, significa que la configuración es correcta y puedes comenzar a enviar emails desde tu aplicación.</p>
          <div style="margin-top: 20px; padding: 10px; background-color: #f8f9fa; border-radius: 4px;">
            <p style="margin: 0; color: #666;">Fecha y hora de envío: ${new Date().toLocaleString()}</p>
          </div>
        </div>
      `,
    }

    console.log("Enviando email de prueba a:", email)

    try {
      // Enviar el email
      await sgMail.send(msg)
      console.log("Email de prueba enviado correctamente")
      return NextResponse.json({ success: true, message: "Email de prueba enviado correctamente" })
    } catch (sendError: any) {
      console.error("Error al enviar email de prueba con SendGrid:", sendError)

      // Obtener detalles del error de SendGrid
      let errorMessage = "Error al enviar el email de prueba"
      if (sendError.response) {
        console.error("SendGrid API response:", sendError.response.body)
        errorMessage = `Error de SendGrid: ${JSON.stringify(sendError.response.body)}`
      }

      return NextResponse.json({ success: false, message: errorMessage }, { status: 500 })
    }
  } catch (error: any) {
    console.error("Error general al procesar la solicitud de envío de email de prueba:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Error al enviar el email de prueba" },
      { status: 500 },
    )
  }
}
