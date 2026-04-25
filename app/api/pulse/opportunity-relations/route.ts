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
        .limit(1)

      console.log("[v0] tech_company query:", { techCompanyId, data, error })

      if (error) {
        console.error("Error fetching tech_company:", error)
      } else if (data && data.length > 0) {
        result.tech_company = data[0]
      }
    }

    // Traer prospect si existe el ID
    if (prospectId) {
      const { data, error } = await supabase
        .from("prospects")
        .select("id, name")
        .eq("id", prospectId)
        .limit(1)

      console.log("[v0] prospect query:", { prospectId, data, error })

      if (error) {
        console.error("Error fetching prospect:", error)
      } else if (data && data.length > 0) {
        result.prospect = data[0]
      }
    }

    // Traer partner si existe el ID
    if (partnerId) {
      const { data, error } = await supabase
        .from("partners")
        .select("id, name")
        .eq("id", partnerId)
        .limit(1)

      console.log("[v0] partner query:", { partnerId, data, error })

      if (error) {
        console.error("Error fetching partner:", error)
      } else if (data && data.length > 0) {
        result.partner = data[0]
      }
    }

    console.log("[v0] opportunity-relations result:", result)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error in opportunity-relations API:", error)
    return NextResponse.json(
      { error: "Error al obtener relaciones" },
      { status: 500 }
    )
  }
}
