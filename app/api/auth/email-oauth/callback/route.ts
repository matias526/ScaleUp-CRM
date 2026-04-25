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
    
    // DEVOLVER HTML DE VERIFICACION INMEDIATA
    return new NextResponse(
      `
        <html>
          <head>
            <title>OAuth Callback - Verificación</title>
            <style>
              body { font-family: monospace; padding: 20px; background: #f0f0ff; }
              .info { color: #0066cc; }
              pre { background: white; padding: 15px; border-radius: 5px; overflow-x: auto; border: 2px solid #0066cc; }
              h1 { color: #0066cc; }
            </style>
          </head>
          <body>
            <h1>✓ CALLBACK CALLBACK CALLBACK</h1>
            <h2 class="info">Se ejecutó correctamente el endpoint</h2>
            <h3>URL recibida:</h3>
            <pre>${request.nextUrl.toString()}</pre>
            <h3>Parámetros:</h3>
            <pre>${JSON.stringify({
              code: request.nextUrl.searchParams.get("code")?.substring(0, 30) + "...",
              state: request.nextUrl.searchParams.get("state"),
              error: request.nextUrl.searchParams.get("error"),
            }, null, 2)}</pre>
          </body>
        </html>
      `,
      {
        status: 200,
        headers: { "Content-Type": "text/html" },
      }
    )
    
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

    // Guardar los tokens en la BD usando insert + update flow
    // Primero intentamos insertar. Si existe, actualizamos.
    const insertData = {
      user_id: userId,
      provider: "google",
      email: userEmail,
      access_token: access_token,
      refresh_token: refresh_token,
      token_expires_at: new Date(Date.now() + expires_in * 1000).toISOString(),
      is_connected: true,
    }

    console.log("[v0] Datos a insertar:", JSON.stringify(insertData, null, 2))
    console.log("[v0] Tipos:", {
      user_id: typeof userId,
      email: typeof userEmail,
      access_token: typeof access_token,
      refresh_token: typeof refresh_token,
      token_expires_at: typeof insertData.token_expires_at,
      is_connected: typeof insertData.is_connected,
    })

    // Intentar insert
    let insertError = null
    const { error: firstError, data: insertedData } = await (supabase
      .from("user_email_integrations" as any)
      .insert([insertData]) as any)

    console.log("[v0] Respuesta del insert:", { firstError, insertedData })

    // Si ya existe (unique constraint), hacer update
    if (firstError && firstError.code === "23505") {
      console.log("[v0] Conflicto de unique constraint, intentando update...")
      const { error: updateError, data: updatedData } = await (supabase
        .from("user_email_integrations" as any)
        .update(insertData)
        .eq("user_id", userId)
        .eq("email", userEmail) as any)
      console.log("[v0] Respuesta del update:", { updateError, updatedData })
      insertError = updateError
    } else {
      insertError = firstError
    }

    console.log("[v0] Resultado final del insert/update:", { insertError })

    if (insertError) {
      console.error("[v0] Error guardando integración de email:", insertError)
      
      // Devolver HTML con error detallado
      return new NextResponse(
        `
          <html>
            <head>
              <title>OAuth Callback - Error</title>
              <style>
                body { font-family: monospace; padding: 20px; background: #fff5f5; }
                .error { color: red; }
                .info { color: #333; }
                pre { background: #ffe0e0; padding: 15px; border-radius: 5px; overflow-x: auto; border: 1px solid red; }
                h1 { color: red; }
              </style>
            </head>
            <body>
              <h1>✗ Error al guardar integración de email</h1>
              <h2 class="error">Error details:</h2>
              <pre>${JSON.stringify(insertError, null, 2)}</pre>
              <h2 class="info">Datos intentados:</h2>
              <pre>${JSON.stringify({
                user_id: userId,
                email: userEmail,
                provider: "google",
              }, null, 2)}</pre>
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

    // Devolver HTML con toda la información de debug
    return new NextResponse(
      `
        <html>
          <head>
            <title>OAuth Callback - Debug</title>
            <style>
              body { font-family: monospace; padding: 20px; background: #f5f5f5; }
              .success { color: green; }
              .error { color: red; }
              .info { color: #333; }
              pre { background: white; padding: 15px; border-radius: 5px; overflow-x: auto; }
              h1 { color: #333; }
            </style>
          </head>
          <body>
            <h1 class="success">✓ OAuth exitoso!</h1>
            <h2 class="info">Datos guardados:</h2>
            <pre>${JSON.stringify({
              userId,
              userEmail,
              provider: "google",
              token_expires_at: new Date(Date.now() + expires_in * 1000).toISOString(),
              is_connected: true,
            }, null, 2)}</pre>
            <p class="info">La ventana se cerrará en 3 segundos...</p>
            <script>
              setTimeout(() => window.close(), 3000);
            </script>
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
    
    // Devolver HTML con error de servidor
    return new NextResponse(
      `
        <html>
          <head>
            <title>OAuth Callback - Server Error</title>
            <style>
              body { font-family: monospace; padding: 20px; background: #fff5f5; }
              .error { color: red; }
              pre { background: #ffe0e0; padding: 15px; border-radius: 5px; overflow-x: auto; border: 1px solid red; }
              h1 { color: red; }
            </style>
          </head>
          <body>
            <h1>✗ Error del servidor</h1>
            <h2 class="error">Error:</h2>
            <pre>${error instanceof Error ? error.message : JSON.stringify(error, null, 2)}</pre>
            <pre>${error instanceof Error ? error.stack : ""}</pre>
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
