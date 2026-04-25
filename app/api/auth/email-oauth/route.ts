import { NextRequest, NextResponse } from "next/server"

/**
 * Inicia el flujo OAuth para conectar email del usuario
 * Por ahora, redirige a Google OAuth
 */
export async function POST(request: NextRequest) {
  try {
    const { provider = "google", userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId requerido" },
        { status: 400 }
      )
    }

    if (provider === "google") {
      // Construir URL de OAuth de Google
      const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID
      const redirectUri = process.env.OAUTH_REDIRECT_URI

      if (!clientId || !redirectUri) {
        return NextResponse.json(
          { success: false, error: "Variables de entorno no configuradas" },
          { status: 500 }
        )
      }

      const scopes = [
        "https://www.googleapis.com/auth/gmail.send",
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
      ]

      const state = Math.random().toString(36).substring(7)
      const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth")
      authUrl.searchParams.set("client_id", clientId)
      authUrl.searchParams.set("redirect_uri", redirectUri)
      authUrl.searchParams.set("response_type", "code")
      authUrl.searchParams.set("scope", scopes.join(" "))
      authUrl.searchParams.set("access_type", "offline")
      authUrl.searchParams.set("prompt", "consent")
      authUrl.searchParams.set("state", state)

      // Guardar userId en una cookie temporal
      const response = NextResponse.json({
        success: true,
        authUrl: authUrl.toString(),
      })

      response.cookies.set("oauth_user_id", userId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 600, // 10 minutos
      })

      response.cookies.set("oauth_state", state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 600, // 10 minutos
      })

      return response
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
