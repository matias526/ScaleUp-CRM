import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase/client"

/**
 * Callback de Google OAuth
 * Recibe el código de autorización y lo intercambia por tokens de acceso
 */
export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get("code")
    const state = request.nextUrl.searchParams.get("state")
    const error = request.nextUrl.searchParams.get("error")

    // Obtener el userId y state de las cookies
    const userId = request.cookies.get("oauth_user_id")?.value
    const savedState = request.cookies.get("oauth_state")?.value

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

    // Validar state para CSRF protection
    if (!state || !savedState || state !== savedState) {
      console.error("[v0] State mismatch - potential CSRF attack")
      return NextResponse.redirect(
        `${request.nextUrl.origin}?email_oauth_error=state_mismatch`
      )
    }

    if (!userId) {
      console.error("[v0] userId no encontrado en cookie")
      return NextResponse.redirect(
        `${request.nextUrl.origin}?email_oauth_error=no_user_id`
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

    if (insertError) {
      console.error("[v0] Error guardando integración de email:", insertError)
      return NextResponse.redirect(
        `${request.nextUrl.origin}?email_oauth_error=save_failed`
      )
    }

    console.log("[v0] OAuth exitoso para user:", userId, "email:", userEmail)

    // Crear response y limpiar cookies
    const response = NextResponse.redirect(
      `${request.nextUrl.origin}?email_oauth_success=true`
    )
    response.cookies.delete("oauth_user_id")
    response.cookies.delete("oauth_state")

    return response
  } catch (error) {
    console.error("[v0] Error en email OAuth callback:", error)
    return NextResponse.redirect(
      `${request.nextUrl.origin}?email_oauth_error=server_error`
    )
  }
}


    if (!code) {
      return NextResponse.redirect(
        `${request.nextUrl.origin}?email_oauth_error=no_code`
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
      console.error("Error exchanging code for token:", errorData)
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
      console.error("Error fetching user info")
      return NextResponse.redirect(
        `${request.nextUrl.origin}?email_oauth_error=user_info_failed`
      )
    }

    const userInfo = await userInfoResponse.json()
    const userEmail = userInfo.email

    // Obtener el user_id del usuario autenticado desde la BD
    // Por ahora, asumimos que la sesión está activa y podemos obtener el user_id de otra forma
    // TODO: Usar la sesión del usuario para obtener su ID

    // Guardar los tokens en la BD
    // Esto es un placeholder - necesitarías obtener el user_id de la sesión actual
    console.log("[v0] OAuth exitoso para email:", userEmail)
    console.log("[v0] Access token:", access_token.substring(0, 20) + "...")

    // Redirigir de vuelta al frontend con éxito
    return NextResponse.redirect(
      `${request.nextUrl.origin}?email_oauth_success=true`
    )
  } catch (error) {
    console.error("Error en email OAuth callback:", error)
    return NextResponse.redirect(
      `${request.nextUrl.origin}?email_oauth_error=server_error`
    )
  }
}
