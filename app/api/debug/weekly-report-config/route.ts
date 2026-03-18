import { NextResponse } from "next/server"
//import { createClient } from "@/lib/supabase/server"
import { createServerClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = createServerClient()

    console.log("[WeeklyReportConfig] === INICIO DEBUG ===")

    // 1. Verificar configuración de email
    const emailConfig = {
      RESEND_API_KEY: !!process.env.RESEND_API_KEY,
      NEXT_PUBLIC_EMAIL_FROM: process.env.NEXT_PUBLIC_EMAIL_FROM,
    }

    // 2. Obtener todos los recipients
    const { data: allRecipients, error: recipientsError } = await supabase
      .from("weekly_report_recipients")
      .select(`
        id,
        tech_company_id,
        user_id,
        is_active,
        preferred_language,
        created_at,
        users (
          id,
          email,
          first_name,
          last_name,
          preferred_language
        ),
        tech_companies (
          id,
          name,
          logo_url
        )
      `)
      .order("created_at", { ascending: false })

    if (recipientsError) {
      console.error("[WeeklyReportConfig] Error getting recipients:", recipientsError)
      return NextResponse.json({ success: false, error: recipientsError.message })
    }

    // 3. Analizar recipients
    const activeRecipients = allRecipients?.filter((r) => r.is_active) || []
    const inactiveRecipients = allRecipients?.filter((r) => !r.is_active) || []

    // 4. Verificar integridad de datos
    const recipientsWithMissingUser = allRecipients?.filter((r) => !r.users) || []
    const recipientsWithMissingTechCompany = allRecipients?.filter((r) => !r.tech_companies) || []

    // 5. Obtener tech companies únicas que deberían recibir reportes
    const uniqueTechCompanyIds = Array.from(new Set(activeRecipients.map((r) => r.tech_company_id)))

    // 6. Obtener información de tech companies
    const { data: techCompanies, error: techCompaniesError } = await supabase
      .from("tech_companies")
      .select("id, name, logo_url")
      .in("id", uniqueTechCompanyIds)

    // 7. Verificar oportunidades por tech company
    const opportunitiesCount: { [key: string]: number } = {}
    for (const techCompanyId of uniqueTechCompanyIds) {
      const { count } = await supabase
        .from("opportunities")
        .select("*", { count: "exact", head: true })
        .eq("tech_company_id", techCompanyId)

      opportunitiesCount[techCompanyId] = count || 0
    }

    const debugInfo = {
      emailConfig,
      recipients: {
        total: allRecipients?.length || 0,
        active: activeRecipients.length,
        inactive: inactiveRecipients.length,
        withMissingUser: recipientsWithMissingUser.length,
        withMissingTechCompany: recipientsWithMissingTechCompany.length,
      },
      techCompanies: {
        total: uniqueTechCompanyIds.length,
        found: techCompanies?.length || 0,
        list: techCompanies || [],
      },
      opportunities: opportunitiesCount,
      activeRecipients: activeRecipients.map((r) => ({
        id: r.id,
        techCompany: r.tech_companies?.name || "MISSING",
        user: r.users ? `${r.users.first_name} ${r.users.last_name} (${r.users.email})` : "MISSING",
        language: r.preferred_language || r.users?.preferred_language || "es",
        isActive: r.is_active,
      })),
      issues: [
        ...(recipientsWithMissingUser.length > 0
          ? [`${recipientsWithMissingUser.length} recipients con usuarios faltantes`]
          : []),
        ...(recipientsWithMissingTechCompany.length > 0
          ? [`${recipientsWithMissingTechCompany.length} recipients con tech companies faltantes`]
          : []),
        ...(!emailConfig.RESEND_API_KEY ? ["RESEND_API_KEY no configurado"] : []),
        ...(activeRecipients.length === 0 ? ["No hay recipients activos"] : []),
      ],
    }

    console.log("[WeeklyReportConfig] Debug info:", debugInfo)

    return NextResponse.json({
      success: true,
      debug: debugInfo,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[WeeklyReportConfig] Error inesperado:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
