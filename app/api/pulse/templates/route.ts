import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
)

export async function GET(request: NextRequest) {
  try {
    const includeTranslations = request.nextUrl.searchParams.get("includeTranslations") === "true"

    // Obtener usuario autenticado
    const {
      data: { user },
    } = await supabase.auth.getUser()

    let templates: any[] = []

    // Traer templates globales (user_id IS NULL)
    const { data: globalTemplates, error: globalError } = await supabase
      .from("pulse_message_templates")
      .select("id, internal_code, category, user_id, is_active, created_at")
      .eq("is_active", true)
      .is("user_id", null)
      .order("created_at", { ascending: false })

    if (globalError) {
      console.error("Error fetching global templates:", globalError)
      return NextResponse.json({ error: globalError.message }, { status: 500 })
    }

    templates = globalTemplates || []

    // Si hay usuario autenticado, también traer sus templates personales
    if (user?.id) {
      const { data: userTemplates, error: userError } = await supabase
        .from("pulse_message_templates")
        .select("id, internal_code, category, user_id, is_active, created_at")
        .eq("is_active", true)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (userError) {
        console.error("Error fetching user templates:", userError)
        return NextResponse.json({ error: userError.message }, { status: 500 })
      }

      // Combinar templates del usuario con templates globales
      templates = [...(userTemplates || []), ...templates]
    }

    // Si se solicitan traducciones, traerlas por separado
    if (includeTranslations && templates.length > 0) {
      const templateIds = templates.map((t: any) => t.id)

      const { data: translations, error: translationsError } = await supabase
        .from("pulse_message_template_translations")
        .select("template_id, language_code, display_name, subject, body_content")
        .in("template_id", templateIds)

      if (translationsError) {
        console.error("Error fetching translations:", translationsError)
        return NextResponse.json({ error: translationsError.message }, { status: 500 })
      }

      // Agrupar traducciones por template
      const templatesWithTranslations = templates.map((template: any) => ({
        ...template,
        translations: translations?.filter((t: any) => t.template_id === template.id) || [],
      }))

      return NextResponse.json(templatesWithTranslations)
    }

    return NextResponse.json(templates)
  } catch (error) {
    console.error("Error in templates API:", error)
    return NextResponse.json(
      { error: "Error al obtener templates" },
      { status: 500 }
    )
  }
}
