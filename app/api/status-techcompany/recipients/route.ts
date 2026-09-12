import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const techCompanyId = request.nextUrl.searchParams.get("techCompanyId")
  if (!techCompanyId) return NextResponse.json({ error: "techCompanyId is required" }, { status: 400 })

  const supabase = createServerClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const [companyUsers, companyContacts, roles, companyPartners] = await Promise.all([
    supabase.from("users").select("id,email,first_name,last_name,tech_company_id").eq("tech_company_id", techCompanyId).eq("is_active", true),
    supabase.from("contacts").select("id,email,first_name,last_name,tech_company_id").eq("tech_company_id", techCompanyId).eq("is_active", true),
    supabase.from("roles").select("id,code").in("code", ["Admin", "BDD", "admin", "bdd"]),
    supabase.from("partner_tech_companies").select("partner_id,scaleup_manager_id").eq("tech_company_id", techCompanyId),
  ])

  const roleIds = (roles.data ?? []).map((role) => role.id)
  const adminRoleIds = (roles.data ?? []).filter((role: any) => String(role.code).toLowerCase() === "admin").map((role) => role.id)
  const partnerIds = (companyPartners.data ?? []).map((item: any) => item.partner_id).filter(Boolean)
  const managerIds = (companyPartners.data ?? []).map((item: any) => item.scaleup_manager_id).filter(Boolean)
  const [{ data: roleUsers }, { data: partnerUsers }] = roleIds.length
    ? await Promise.all([
        supabase.from("users").select("id,email,first_name,last_name,role_id,partner_id").in("role_id", roleIds).eq("is_active", true),
        partnerIds.length ? supabase.from("users").select("id,email,first_name,last_name,role_id,partner_id").in("partner_id", partnerIds).in("role_id", roleIds).eq("is_active", true) : Promise.resolve({ data: [] as any[] }),
      ])
    : [{ data: [] as any[] }, { data: [] as any[] }]
  const scaleUpUsers = (roleUsers ?? []).filter((user: any) => user.role_id && (adminRoleIds.includes(user.role_id) || managerIds.includes(user.id) || partnerUsers?.some((partnerUser: any) => partnerUser.id === user.id)))

  const recipients = [
    ...(companyContacts.data ?? []).map((item: any) => ({ ...item, group: "TechCompany contacts" })),
    ...(companyUsers.data ?? []).map((item: any) => ({ ...item, group: "TechCompany users" })),
    ...scaleUpUsers.map((item: any) => ({ ...item, group: "ScaleUp Admin / BDD" })),
  ].filter((item: any) => item.email).reduce((items: any[], item: any) => {
    if (!items.some((existing) => existing.email.toLowerCase() === item.email.toLowerCase())) items.push(item)
    return items
  }, [])

  return NextResponse.json({ recipients })
}
