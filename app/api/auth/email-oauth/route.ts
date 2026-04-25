import { NextRequest, NextResponse } from "next/server"

/**
 * Inicia el flujo OAuth para conectar email del usuario
 * Por ahora, redirige a Google OAuth
 */
export async function POST(request: NextRequest) {
  try {
    const { provider = "google" } = await request.json()

    if (provider === "google") {
      // Construir URL de OAuth de Google
      const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID
      const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/email-oauth/callback`
      const scopes = [
        "https://www.googleapis.com/auth/gmail.send",
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
      ]

      const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth")
      authUrl.searchParams.set("client_id", clientId || "")
      authUrl.searchParams.set("redirect_uri", redirectUri)
      authUrl.searchParams.set("response_type", "code")
      authUrl.searchParams.set("scope", scopes.join(" "))
      authUrl.searchParams.set("access_type", "offline")
      authUrl.searchParams.set("prompt", "consent")

      return NextResponse.json({
        success: true,
        authUrl: authUrl.toString(),
      })
    }

    if (provider === "outlook") {
      // Para Outlook/Microsoft
      const clientId = process.env.MICROSOFT_OAUTH_CLIENT_ID
      const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/email-oauth/callback`
      const scopes = [
        "Mail.Send",
        "offline_access",
        "https://outlook.office.com/Mail.Read",
      ]

      const authUrl = new URL("https://login.microsoftonline.com/common/oauth2/v2.0/authorize")
      authUrl.searchParams.set("client_id", clientId || "")
      authUrl.searchParams.set("redirect_uri", redirectUri)
      authUrl.searchParams.set("response_type", "code")
      authUrl.searchParams.set("scope", scopes.join(" "))
      authUrl.searchParams.set("access_type", "offline")

      return NextResponse.json({
        success: true,
        authUrl: authUrl.toString(),
      })
    }

    return NextResponse.json(
      { success: false, error: "Provider no soportado" },
      { status: 400 }
    )
  } catch (error) {
    console.error("Error en email OAuth:", error)
    return NextResponse.json(
      { success: false, error: "Error al iniciar OAuth" },
      { status: 500 }
    )
  }
}
