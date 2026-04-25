import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const techCompanyId = request.nextUrl.searchParams.get("techCompanyId")
    const opportunityId = request.nextUrl.searchParams.get("opportunityId")
    const partnerId = request.nextUrl.searchParams.get("partnerId")

    if (!techCompanyId || !opportunityId) {
      return NextResponse.json(
        { error: "Missing techCompanyId or opportunityId" },
        { status: 400 }
      )
    }

    // 1. Traer contactos relacionados a esa oportunidad (solo activos)
    const { data: opportunityContacts, error: opportunityContactsError } =
      await supabase
        .from("opportunity_contacts")
        .select(
          `
          contact:contacts(
            id,
            email,
            first_name,
            last_name
          )
        `
        )
        .eq("opportunity_id", opportunityId)
        .eq("contacts.is_active", true)

    if (opportunityContactsError) {
      console.error("Error fetching opportunity contacts:", opportunityContactsError)
    }

    // 2. Traer usuarios de la TechCompany (solo activos, sin filtrar por role)
    const { data: techCompanyUsers, error: techCompanyError } = await supabase
      .from("users")
      .select("id, email, first_name, last_name")
      .eq("tech_company_id", techCompanyId)
      .eq("is_active", true)

    if (techCompanyError) {
      console.error("Error fetching tech company users:", techCompanyError)
      return NextResponse.json({ error: techCompanyError.message }, { status: 500 })
    }

    // 3. Traer usuarios del Partner (solo activos) si existe partnerId
    let partnerUsers = []
    if (partnerId) {
      const { data: partnerUsersData, error: partnerUsersError } = await supabase
        .from("users")
        .select("id, email, first_name, last_name")
        .eq("partner_id", partnerId)
        .eq("is_active", true)

      if (partnerUsersError) {
        console.error("Error fetching partner users:", partnerUsersError)
      } else {
        partnerUsers = partnerUsersData || []
      }
    }

    // 4. Traer usuarios de ScaleUp con rol Admin o BDD (solo activos)
    // Primero obtener los role_ids para Admin y BDD
    const { data: adminBddRoles, error: rolesError } = await supabase
      .from("roles")
      .select("id")
      .in("code", ["Admin", "BDD"])

    if (rolesError) {
      console.error("Error fetching admin/BDD roles:", rolesError)
      return NextResponse.json({ error: rolesError.message }, { status: 500 })
    }

    const adminBddRoleIds = adminBddRoles?.map((r) => r.id) || []

    let adminUsers = []
    if (adminBddRoleIds.length > 0) {
      const { data: adminUsersData, error: adminUsersError } = await supabase
        .from("users")
        .select("id, email, first_name, last_name")
        .in("role_id", adminBddRoleIds)
        .eq("is_active", true)

      if (adminUsersError) {
        console.error("Error fetching admin users:", adminUsersError)
      } else {
        adminUsers = adminUsersData || []
      }
    }

    // Combinar contactos
    const contacts = opportunityContacts
      ?.map((oc: any) => oc.contact)
      .filter((c) => c && c.email) || []

    // Combinar usuarios
    const allUsers = [
      ...(techCompanyUsers || []),
      ...partnerUsers,
      ...adminUsers,
    ]

    // Deduplicar usuarios por id
    const uniqueUsers = Array.from(
      new Map(allUsers.map((u) => [u.id, u])).values()
    )

    // Combinar contactos y usuarios, deduplicar por email
    const allRecipients = [...contacts, ...uniqueUsers]
    const uniqueRecipients = Array.from(
      new Map(allRecipients.map((r) => [r.email, r])).values()
    )

    return NextResponse.json(uniqueRecipients)
  } catch (error) {
    console.error("Error in recipients API:", error)
    return NextResponse.json(
      { error: "Error al obtener usuarios" },
      { status: 500 }
    )
  }
}
