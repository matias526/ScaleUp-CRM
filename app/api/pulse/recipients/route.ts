import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const techCompanyId = request.nextUrl.searchParams.get("techCompanyId")

    if (!techCompanyId) {
      return NextResponse.json({ error: "Missing techCompanyId" }, { status: 400 })
    }

    // Traer users de la tech_company
    const { data: techCompanyUsers, error: techCompanyError } = await supabase
      .from("users")
      .select("id, email, first_name, last_name")
      .eq("tech_company_id", techCompanyId)

    if (techCompanyError) {
      console.error("Error fetching tech company users:", techCompanyError)
      return NextResponse.json({ error: techCompanyError.message }, { status: 500 })
    }

    // Traer users con rol Admin o BDD (estos pueden estar en cualquier tech_company)
    const { data: adminUsers, error: adminError } = await supabase
      .from("users")
      .select("id, email, first_name, last_name")
      .or("role.eq.Admin,role.eq.BDD")

    if (adminError) {
      console.error("Error fetching admin users:", adminError)
      return NextResponse.json({ error: adminError.message }, { status: 500 })
    }

    // Combinar y deduplicar users
    const allUsers = [
      ...(techCompanyUsers || []),
      ...(adminUsers || []),
    ]

    // Remover duplicados por id
    const uniqueUsers = Array.from(
      new Map(allUsers.map((u) => [u.id, u])).values()
    )

    return NextResponse.json(uniqueUsers)
  } catch (error) {
    console.error("Error in users API:", error)
    return NextResponse.json(
      { error: "Error al obtener usuarios" },
      { status: 500 }
    )
  }
}
