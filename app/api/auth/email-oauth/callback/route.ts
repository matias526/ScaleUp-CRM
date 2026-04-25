import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase/client"

/**
 * Callback de Google OAuth
 * Recibe el código de autorización y lo intercambia por tokens de acceso
 */
export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Callback OAuth iniciado")
    console.log("[v0] URL:", request.nextUrl.toString())
    
    const code = request.nextUrl.searchParams.get("code")
    const state = request.nextUrl.searchParams.get("state")
    const error = request.nextUrl.searchParams.get("error")

    console.log("[v0] Code:", code?.substring(0, 20) + "...")
    console.log("[v0] State:", state)
    console.log("[v0] Error:", error)

    // Si el usuario rechazó la autorización
    if (error) {
      return NextResponse.redirect(
        `${request.nextUrl.origin}?email_oauth_error=${error}`
      )
    }

    if (!code) {
      return NextResponse.redirect(
        `${request.nextUrl.origin}?email_oauth_error=no_code`
      )
    }

    if (!state) {
      return NextResponse.redirect(
        `${request.nextUrl.origin}?email_oauth_error=no_state`
      )
    }

    // Decodificar state para obtener userId
    let userId: string
    try {
      const decodedState = Buffer.from(state, "base64").toString("utf-8")
      const [userIdFromState] = decodedState.split(":")
      userId = userIdFromState
      
      if (!userId) {
        throw new Error("userId no encontrado en state")
      }
    } catch (decodeError) {
      console.error("[v0] Error decodificando state:", decodeError)
      return NextResponse.redirect(
        `${request.nextUrl.origin}?email_oauth_error=invalid_state`
      )
    }

    // Intercambiar código por tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        client_id: process.env.GOOGLE_OAUTH_CLIENT_ID,
        client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
        redirect_uri: process.env.OAUTH_REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json()
      console.error("[v0] Error exchanging code for token:", errorData)
      return NextResponse.redirect(
        `${request.nextUrl.origin}?email_oauth_error=token_exchange_failed`
      )
    }

    const tokens = await tokenResponse.json()
    const { access_token, refresh_token, expires_in } = tokens

    // Obtener info del usuario
    const userInfoResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${access_token}` },
      }
    )

    if (!userInfoResponse.ok) {
      console.error("[v0] Error fetching user info")
      return NextResponse.redirect(
        `${request.nextUrl.origin}?email_oauth_error=user_info_failed`
      )
    }

    const userInfo = await userInfoResponse.json()
    const userEmail = userInfo.email
    console.log("[v0] Preparando guardar integración para user:", userId, "email:", userEmail)

    // Guardar los tokens en la BD
    const { error: insertError } = await supabase
      .from("user_email_integrations")
      .upsert({
        user_id: userId,
        provider: "google",
        email: userEmail,
        access_token: access_token,
        refresh_token: refresh_token,
        expires_at: new Date(Date.now() + expires_in * 1000).toISOString(),
        connected_at: new Date().toISOString(),
        is_active: true,
      }, {
        onConflict: "user_id"
      })

    console.log("[v0] Resultado del upsert:", { insertError })

    if (insertError) {
      console.error("[v0] Error guardando integración de email:", insertError)
      
      // Devolver HTML que cierra la ventana con error
      return new NextResponse(
        `
          <html>
            <body>
              <script>
                localStorage.setItem('email_oauth_error', 'save_failed: ${insertError.message}');
                window.close();
              </script>
              <p>Error al guardar la integración. Ventana cerrándose...</p>
            </body>
          </html>
        `,
        {
          status: 500,
          headers: { "Content-Type": "text/html" },
        }
      )
    }

    console.log("[v0] OAuth exitoso para user:", userId, "email:", userEmail)

    // Devolver HTML que cierra la ventana del popup
    return new NextResponse(
      `
        <html>
          <body>
            <script>
              window.close();
            </script>
            <p>Ventana cerrándose...</p>
          </body>
        </html>
      `,
      {
        status: 200,
        headers: { "Content-Type": "text/html" },
      }
    )
  } catch (error) {
    console.error("[v0] Error en email OAuth callback:", error)
    
    // Devolver HTML que cierra la ventana con error
    return new NextResponse(
      `
        <html>
          <body>
            <script>
              localStorage.setItem('email_oauth_error', 'server_error');
              window.close();
            </script>
            <p>Error en la autenticación. Ventana cerrándose...</p>
          </body>
        </html>
      `,
      {
        status: 500,
        headers: { "Content-Type": "text/html" },
      }
    )
  }
}
