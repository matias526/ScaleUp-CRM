import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
//import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { createServerClient } from "@/lib/supabase/server"

// Obtener las variables de entorno
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Faltan variables de entorno necesarias: NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY")
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Crear un cliente de Supabase con la clave de servicio para operaciones de administración
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Crear un cliente normal para verificar la autenticación del usuario actual
    //const supabase = createRouteHandlerClient({ cookies })
    const supabase = createServerClient()

    // Obtener los datos del cuerpo de la solicitud
    const data = await request.json()

    // Verificar que el usuario actual tiene permisos de administrador
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "No autorizado. Debe iniciar sesión." }, { status: 401 })
    }

    // Verificar si el usuario actual es administrador
    const { data: currentUser, error: userError } = await supabase
      .from("users")
      .select("role_id, roles:role_id(code)")
      .eq("id", session.user.id)
      .single()

    if (userError || !currentUser || currentUser.roles?.code !== "Admin") {
      return NextResponse.json({ error: "No autorizado. Se requieren permisos de administrador." }, { status: 403 })
    }

    // Actualizar el usuario en Auth si se proporciona una nueva contraseña
    if (data.password) {
      const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(params.id, {
        password: data.password,
        email: data.email,
      })

      if (updateAuthError) {
        console.error("Error al actualizar usuario en Auth:", updateAuthError)
        return NextResponse.json(
          { error: `Error al actualizar usuario en Auth: ${updateAuthError.message}` },
          { status: 500 },
        )
      }
    }

    // Actualizar los datos del usuario en la tabla users
    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .update({
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        role_id: data.role_id,
        tech_company_id: data.tech_company_id || null,
        partner_id: data.partner_id || null,
        is_active: data.is_active !== undefined ? data.is_active : true,
        preferred_language: data.preferred_language || "es",
        theme_preference: data.theme_preference || "light",
        updated_at: new Date().toISOString(),
        phone: data.phone || null,
        profile_image: data.profile_image || null,
      })
      .eq("id", params.id)
      .select()
      .single()

    if (updateError) {
      console.error("Error al actualizar datos del usuario:", updateError)
      return NextResponse.json(
        { error: `Error al actualizar datos del usuario: ${updateError.message}` },
        { status: 500 },
      )
    }

    return NextResponse.json({ user: updatedUser })
  } catch (error: any) {
    console.error("Error inesperado:", error)
    return NextResponse.json({ error: `Error inesperado: ${error.message}` }, { status: 500 })
  }
}

// Agregar el método DELETE para eliminar usuarios
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Crear un cliente de Supabase con la clave de servicio para operaciones de administración
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Crear un cliente normal para verificar la autenticación del usuario actual
    const supabase = createRouteHandlerClient({ cookies })

    // Verificar que el usuario actual tiene permisos de administrador
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "No autorizado. Debe iniciar sesión." }, { status: 401 })
    }

    // Verificar si el usuario actual es administrador
    const { data: currentUser, error: userError } = await supabase
      .from("users")
      .select("role_id, roles:role_id(code)")
      .eq("id", session.user.id)
      .single()

    if (userError || !currentUser || currentUser.roles?.code !== "Admin") {
      return NextResponse.json({ error: "No autorizado. Se requieren permisos de administrador." }, { status: 403 })
    }

    // Verificar que no se está intentando eliminar al usuario actual
    if (params.id === session.user.id) {
      return NextResponse.json({ error: "No puede eliminar su propio usuario." }, { status: 400 })
    }

    // Intentar eliminar el usuario de Auth
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(params.id)

    // Si hay un error que no sea "User not found", retornar error
    if (deleteAuthError && !deleteAuthError.message.includes("User not found")) {
      console.error("Error al eliminar usuario de Auth:", deleteAuthError)
      return NextResponse.json(
        { error: `Error al eliminar usuario de Auth: ${deleteAuthError.message}` },
        { status: 500 },
      )
    }

    // Si el error es "User not found", continuar con la eliminación del usuario en la tabla users
    if (deleteAuthError && deleteAuthError.message.includes("User not found")) {
      console.log("Usuario no encontrado en Auth, continuando con la eliminación en la tabla users")
    }

    // Eliminar el usuario de la tabla users
    const { error: deleteUserError } = await supabase.from("users").delete().eq("id", params.id)

    if (deleteUserError) {
      console.error("Error al eliminar usuario de la tabla users:", deleteUserError)
      return NextResponse.json(
        { error: `Error al eliminar usuario de la tabla users: ${deleteUserError.message}` },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true, message: "Usuario eliminado correctamente" })
  } catch (error: any) {
    console.error("Error inesperado:", error)
    return NextResponse.json({ error: `Error inesperado: ${error.message}` }, { status: 500 })
  }
}
