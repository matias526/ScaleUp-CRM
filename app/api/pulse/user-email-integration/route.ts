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

    // Verificar si existe una integración de email para este usuario
    const { data, error } = await supabase
      .from("user_email_integrations")
      .select("id")
      .eq("user_id", userId)
      .eq("is_active", true)
      .limit(1)
      .single()

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned
      console.error("Error fetching email integration:", error)
      return NextResponse.json(
        { error: "Error al verificar integración de email" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      hasIntegration: !!data,
      userId,
    })
  } catch (error) {
    console.error("Error in user-email-integration API:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
