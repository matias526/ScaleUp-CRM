import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
)

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId")

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      )
    }

    console.log("[v0] Verificando email integration para userId:", userId)

    // Verificar si existe una integración de email para este usuario
    const { data, error } = await (supabase
      .from("user_email_integrations" as any)
      .select("id")
      .eq("user_id", userId)
      .eq("is_active", true)
      .limit(1) as any)

    console.log("[v0] Resultado query:", { data, error })

    if (error) {
      console.error("[v0] Error fetching email integration:", error)
      return NextResponse.json(
        { error: "Error al verificar integración de email", details: error.message },
        { status: 500 }
      )
    }

    const hasIntegration = data && data.length > 0

    return NextResponse.json({
      hasIntegration,
      userId,
    })
  } catch (error) {
    console.error("[v0] Error in user-email-integration API:", error)
    return NextResponse.json(
      { error: "Error interno del servidor", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
