import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const techCompanyId = request.nextUrl.searchParams.get("techCompanyId")
    const prospectId = request.nextUrl.searchParams.get("prospectId")
    const partnerId = request.nextUrl.searchParams.get("partnerId")

    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
        },
      }
    )

    const result: Record<string, any> = {}

    // Traer tech_company si existe el ID
    if (techCompanyId) {
      const { data, error } = await supabase
        .from("tech_companies")
        .select("id, name")
        .eq("id", techCompanyId)
        .single()

      if (error) {
        console.error("Error fetching tech_company:", error)
      } else {
        result.tech_company = data
      }
    }

    // Traer prospect si existe el ID
    if (prospectId) {
      const { data, error } = await supabase
        .from("prospects")
        .select("id, name")
        .eq("id", prospectId)
        .single()

      if (error) {
        console.error("Error fetching prospect:", error)
      } else {
        result.prospect = data
      }
    }

    // Traer partner si existe el ID
    if (partnerId) {
      const { data, error } = await supabase
        .from("partners")
        .select("id, name")
        .eq("id", partnerId)
        .single()

      if (error) {
        console.error("Error fetching partner:", error)
      } else {
        result.partner = data
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error in opportunity-relations API:", error)
    return NextResponse.json(
      { error: "Error al obtener relaciones" },
      { status: 500 }
    )
  }
}
