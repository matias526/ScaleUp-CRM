import { type NextRequest, NextResponse } from "next/server"
//import { createClient } from "@/lib/supabase/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { tech_company_id } = await request.json()

    if (!tech_company_id) {
      return NextResponse.json({ success: false, error: "tech_company_id is required" })
    }

    const supabase = createServerClient()

    // 1. Verificar tech company
    const { data: techCompany, error: techError } = await supabase
      .from("tech_companies")
      .select("id, name, logo_url")
      .eq("id", tech_company_id)
      .single()

    if (techError || !techCompany) {
      return NextResponse.json({
        success: false,
        error: "Tech company not found",
        details: techError,
      })
    }

    // 2. Verificar destinatarios
    const { data: recipientData, error: recipientError } = await supabase
      .from("weekly_report_recipients")
      .select("user_id")
      .eq("tech_company_id", tech_company_id)
      .eq("is_active", true)

    if (recipientError) {
      return NextResponse.json({
        success: false,
        error: "Error getting recipients",
        details: recipientError,
      })
    }

    const userIds = recipientData?.map((r) => r.user_id) || []

    // 3. Obtener datos de usuarios
    let userData = []
    if (userIds.length > 0) {
      const { data: users, error: userError } = await supabase
        .from("users")
        .select("id, email, first_name, last_name, preferred_language")
        .in("id", userIds)

      if (userError) {
        return NextResponse.json({
          success: false,
          error: "Error getting users",
          details: userError,
        })
      }
      userData = users || []
    }

    // 4. Verificar oportunidades
    const { data: opportunities, error: oppError } = await supabase
      .from("opportunities")
      .select("id, title, created_at, tech_company_id")
      .eq("tech_company_id", tech_company_id)
      .limit(3)

    if (oppError) {
      return NextResponse.json({
        success: false,
        error: "Error getting opportunities",
        details: oppError,
      })
    }

    // 5. Verificar configuración de email
    const hasResendKey = !!process.env.RESEND_API_KEY
    const emailFrom = process.env.NEXT_PUBLIC_EMAIL_FROM || "ScaleUp CRM <no-reply@scaleup-global.com>"

    return NextResponse.json({
      success: true,
      debug: {
        techCompany,
        recipients: {
          count: userData.length,
          userIds,
          users: userData,
        },
        opportunities: {
          count: opportunities?.length || 0,
          sample: opportunities?.slice(0, 3) || [],
        },
        emailConfig: {
          hasResendKey,
          emailFrom,
        },
      },
    })
  } catch (error) {
    console.error("Debug error:", error)
    return NextResponse.json({
      success: false,
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
