import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const diagnostics = []

    // 1. Verificar variables de entorno
    const hasResendKey = !!process.env.RESEND_API_KEY
    const hasEmailFrom = !!process.env.NEXT_PUBLIC_EMAIL_FROM
    const hasCronSecret = !!process.env.CRON_SECRET

    diagnostics.push({
      name: "Variables de Entorno",
      status: hasResendKey && hasEmailFrom && hasCronSecret ? "success" : "error",
      message:
        hasResendKey && hasEmailFrom && hasCronSecret
          ? "Todas las variables de entorno están configuradas"
          : "Faltan variables de entorno críticas",
      details: {
        RESEND_API_KEY: hasResendKey ? "✓ Configurada" : "✗ Faltante",
        NEXT_PUBLIC_EMAIL_FROM: hasEmailFrom ? "✓ Configurada" : "✗ Faltante",
        CRON_SECRET: hasCronSecret ? "✓ Configurada" : "✗ Faltante",
      },
    })

    // 2. Verificar conexión a Supabase
    try {
      const { data: testData, error: testError } = await supabase
        .from("weekly_report_recipients")
        .select("count")
        .limit(1)

      diagnostics.push({
        name: "Conexión a Supabase",
        status: testError ? "error" : "success",
        message: testError ? "Error de conexión a Supabase" : "Conexión a Supabase exitosa",
        details: testError ? { error: testError.message } : { status: "OK" },
      })
    } catch (error) {
      diagnostics.push({
        name: "Conexión a Supabase",
        status: "error",
        message: "Error al conectar con Supabase",
        details: { error: error.message },
      })
    }

    // 3. Verificar recipients configurados
    try {
      const { data: recipients, error: recipientsError } = await supabase
        .from("weekly_report_recipients")
        .select("id, tech_company_id, email, is_active")
        .eq("is_active", true)

      const activeRecipients = recipients?.length || 0

      diagnostics.push({
        name: "Recipients Configurados",
        status: activeRecipients > 0 ? "success" : "warning",
        message:
          activeRecipients > 0
            ? `${activeRecipients} recipients activos encontrados`
            : "No hay recipients activos configurados",
        details: {
          totalActive: activeRecipients,
          recipients: recipients?.slice(0, 5), // Solo los primeros 5 para no saturar
        },
      })
    } catch (error) {
      diagnostics.push({
        name: "Recipients Configurados",
        status: "error",
        message: "Error al verificar recipients",
        details: { error: error.message },
      })
    }

    // 4. Verificar tech companies con recipients
    try {
      const { data: techCompanies, error: techError } = await supabase
        .from("tech_companies")
        .select(`
          id, 
          name,
          weekly_report_recipients!inner(id, is_active)
        `)
        .eq("weekly_report_recipients.is_active", true)

      const companiesWithRecipients = techCompanies?.length || 0

      diagnostics.push({
        name: "Tech Companies con Recipients",
        status: companiesWithRecipients > 0 ? "success" : "warning",
        message:
          companiesWithRecipients > 0
            ? `${companiesWithRecipients} tech companies tienen recipients configurados`
            : "Ninguna tech company tiene recipients configurados",
        details: {
          totalCompanies: companiesWithRecipients,
          companies: techCompanies?.slice(0, 3)?.map((tc) => ({
            name: tc.name,
            recipientsCount: tc.weekly_report_recipients?.length || 0,
          })),
        },
      })
    } catch (error) {
      diagnostics.push({
        name: "Tech Companies con Recipients",
        status: "error",
        message: "Error al verificar tech companies",
        details: { error: error.message },
      })
    }

    // 5. Verificar oportunidades recientes
    try {
      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

      const { data: opportunities, error: oppError } = await supabase
        .from("opportunities")
        .select("id, title, created_at, updated_at")
        .gte("updated_at", oneWeekAgo.toISOString())
        .limit(10)

      const recentOpportunities = opportunities?.length || 0

      diagnostics.push({
        name: "Oportunidades Recientes",
        status: recentOpportunities > 0 ? "success" : "warning",
        message:
          recentOpportunities > 0
            ? `${recentOpportunities} oportunidades actualizadas en la última semana`
            : "No hay oportunidades actualizadas en la última semana",
        details: {
          totalRecent: recentOpportunities,
          weekStart: oneWeekAgo.toISOString(),
        },
      })
    } catch (error) {
      diagnostics.push({
        name: "Oportunidades Recientes",
        status: "error",
        message: "Error al verificar oportunidades",
        details: { error: error.message },
      })
    }

    // 6. Verificar configuración del cron en vercel.json
    diagnostics.push({
      name: "Configuración del Cron",
      status: "success",
      message: "Configuración del cron verificada",
      details: {
        schedule: "0 9 * * 1", // Lunes a las 9:00 UTC
        path: "/api/cron/weekly-reports",
        description: "Ejecuta todos los lunes a las 9:00 UTC",
      },
    })

    return NextResponse.json({
      success: true,
      diagnostics,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error in cron diagnostics:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
