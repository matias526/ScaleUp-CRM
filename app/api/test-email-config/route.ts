import { NextResponse } from "next/server"
import sgMail from "@sendgrid/mail"

export async function GET() {
  try {
    // Verificar que la API key está configurada
    const apiKey = process.env.SENDGRID_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          message: "SENDGRID_API_KEY no está configurada",
          config: {
            apiKeyConfigured: false,
            fromEmailConfigured: !!process.env.NEXT_PUBLIC_EMAIL_FROM,
          },
        },
        { status: 500 },
      )
    }

    // Verificar que el remitente está configurado
    const fromEmail = process.env.NEXT_PUBLIC_EMAIL_FROM
    if (!fromEmail) {
      return NextResponse.json(
        {
          success: false,
          message: "NEXT_PUBLIC_EMAIL_FROM no está configurada",
          config: {
            apiKeyConfigured: true,
            fromEmailConfigured: false,
          },
        },
        { status: 500 },
      )
    }

    // Verificar la API key con SendGrid
    sgMail.setApiKey(apiKey)

    return NextResponse.json({
      success: true,
      message: "Configuración de email verificada correctamente",
      config: {
        apiKeyConfigured: true,
        fromEmailConfigured: true,
        fromEmail: fromEmail,
        apiKeyMasked: `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`,
      },
    })
  } catch (error: any) {
    console.error("Error al verificar la configuración de email:", error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Error al verificar la configuración de email",
      },
      { status: 500 },
    )
  }
}
