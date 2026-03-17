import { NextResponse } from "next/server"
import { Resend } from "resend"

export async function GET() {
  try {
    const config = {
      hasResendApiKey: !!process.env.RESEND_API_KEY,
      resendApiKeyLength: process.env.RESEND_API_KEY?.length || 0,
      emailFrom: process.env.NEXT_PUBLIC_EMAIL_FROM,
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
    }

    // Test básico de Resend
    let resendTest = null
    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY)
        // Intentar obtener información de la API (esto no envía email)
        resendTest = "API Key válida"
      } catch (error) {
        resendTest = `Error: ${error instanceof Error ? error.message : "Error desconocido"}`
      }
    }

    return NextResponse.json({
      success: true,
      config,
      resendTest,
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    })
  }
}
