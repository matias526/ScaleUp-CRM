import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
)

export async function GET(request: NextRequest) {
  try {
    const techCompanyId = request.nextUrl.searchParams.get("techCompanyId")
    const prospectId = request.nextUrl.searchParams.get("prospectId")
    const partnerId = request.nextUrl.searchParams.get("partnerId")

    const result: Record<string, any> = {}

    // Traer tech_company si existe el ID
    if (techCompanyId) {
      const { data, error } = await supabase
        .from("tech_companies")
        .select("id, name")
        .eq("id", techCompanyId)
        .limit(1)

      if (!error && data && data.length > 0) {
        result.tech_company = data[0]
      }
    }

    // Traer prospect si existe el ID
    if (prospectId) {
      const { data, error } = await supabase
        .from("prospect_partners")
        .select("id, name")
        .eq("id", prospectId)
        .limit(1)

      if (!error && data && data.length > 0) {
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

      if (!error && data && data.length > 0) {
        result.partner = data[0]
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
