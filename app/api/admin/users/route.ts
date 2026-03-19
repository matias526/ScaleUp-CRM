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

export async function POST(request: NextRequest) {
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

    if (userError) {
      console.error("Error al verificar permisos del usuario:", userError)
      return NextResponse.json({ error: "Error al verificar permisos del usuario" }, { status: 500 })
    }

    // Validar datos de entrada
    if (!data.email || !data.first_name || !data.last_name || !data.role_id) {
      return NextResponse.json(
        { error: "Faltan datos obligatorios: email, first_name, last_name, role_id" },
        { status: 400 },
      )
    }

    // Crear el usuario en Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true, // Confirmar el email automáticamente
      user_metadata: {
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone,
      },
    })

    if (authError) {
      console.error("Error al crear usuario en Auth:", authError)
      return NextResponse.json({ error: `Error al crear usuario en Auth: ${authError.message}` }, { status: 500 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: "No se pudo crear el usuario en Auth" }, { status: 500 })
    }

    // Esperar un momento para que el trigger de Supabase cree el registro en la tabla users
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Verificar si el usuario ya existe en la tabla users
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("id")
      .eq("id", authData.user.id)
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 es "no se encontró ningún registro"
      console.error("Error al verificar si el usuario existe:", checkError)
      return NextResponse.json(
        { error: `Error al verificar si el usuario existe: ${checkError.message}` },
        { status: 500 },
      )
    }

    let userData

    // Si el usuario no existe en la tabla users, crearlo manualmente
    if (!existingUser) {
      console.log("El trigger no creó el usuario, creándolo manualmente")
      const { data: insertedUser, error: insertError } = await supabase
        .from("users")
        .insert([
          {
            id: authData.user.id,
            email: data.email,
            first_name: data.first_name,
            last_name: data.last_name,
            role_id: data.role_id,
            tech_company_id: data.tech_company_id || null,
            partner_id: data.partner_id || null,
            is_active: data.is_active !== undefined ? data.is_active : true,
            preferred_language: data.preferred_language || "es",
            theme_preference: data.theme_preference || "light",
            phone: data.phone || null,
          },
        ])
        .select()

      if (insertError) {
        console.error("Error al insertar usuario manualmente:", insertError)
        return NextResponse.json(
          { error: `Error al insertar usuario manualmente: ${insertError.message}` },
          { status: 500 },
        )
      }

      userData = insertedUser?.[0]
    } else {
      // Si el usuario ya existe, actualizar sus datos
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
          phone: data.phone || null,
        })
        .eq("id", authData.user.id)
        .select()

      if (updateError) {
        console.error("Error al actualizar datos del usuario:", updateError)
        return NextResponse.json(
          { error: `Error al actualizar datos del usuario: ${updateError.message}` },
          { status: 500 },
        )
      }

      userData = updatedUser?.[0]
    }

    return NextResponse.json({ user: userData })
  } catch (error: any) {
    console.error("Error inesperado:", error)
    return NextResponse.json({ error: `Error inesperado: ${error.message}` }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const searchParams = request.nextUrl.searchParams
    const partnerId = searchParams.get("partner_id")
    const techCompanyId = searchParams.get("tech_company_id")
    const searchTerm = searchParams.get("search")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const pageSize = Number.parseInt(searchParams.get("pageSize") || "10")

    // Calcular el rango para la paginación
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    // Construir la consulta base
    let query = supabase.from("users").select(`
        id, email, first_name, last_name, role_id, tech_company_id, partner_id, 
        is_active, preferred_language, theme_preference, created_at, updated_at,
        roles:role_id (code),
        tech_companies:tech_company_id (name),
        partners:partner_id (name)
      `)

    // Aplicar filtros si existen
    if (partnerId) {
      query = query.eq("partner_id", partnerId)
    }

    if (techCompanyId) {
      query = query.eq("tech_company_id", techCompanyId)
    }

    if (searchTerm) {
      query = query.or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
    }

    // Aplicar ordenamiento y paginación
    const { data, error, count } = await query.order("first_name").range(from, to)

    if (error) {
      console.error("Error al obtener usuarios:", error)
      return NextResponse.json({ error: { message: error.message } }, { status: 500 })
    }

    // Formatear los datos para incluir nombres de roles, tech companies y partners
    const formattedData = data.map((user) => ({
      ...user,
      role_code: user.roles?.code || null,
      tech_company_name: user.tech_companies?.name || null,
      partner_name: user.partners?.name || null,
    }))

    // Eliminar los objetos anidados
    formattedData.forEach((user) => {
      delete (user as any).roles
      delete (user as any).tech_companies
      delete (user as any).partners
    })

    return NextResponse.json({
      data: formattedData,
      total: count || 0,
      page,
      pageSize,
    })
  } catch (error: any) {
    console.error("Error inesperado:", error)
    return NextResponse.json({ error: { message: "Error interno del servidor" } }, { status: 500 })
  }
}
