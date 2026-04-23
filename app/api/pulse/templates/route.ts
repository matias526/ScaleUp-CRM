import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
)

export async function GET(request: NextRequest) {
  try {
    const includeTranslations = request.nextUrl.searchParams.get("includeTranslations") === "true"

    // Query para obtener templates activos
    let query = supabase
      .from("pulse_message_templates")
      .select("id, internal_code, category, is_active, created_at")
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    const { data: templates, error } = await query

    if (error) {
      console.error("Error fetching templates:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Si se solicitan traducciones, traerlas por separado
    if (includeTranslations && templates && templates.length > 0) {
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
