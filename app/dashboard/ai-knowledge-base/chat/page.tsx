import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { MikaChat } from "@/components/ai-knowledge-base/mika-chat"

export const dynamic = "force-dynamic"

export default async function AIKnowledgeBaseChatPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: userData } = await supabase
    .from("users")
    .select("tech_company_id, role_id, roles:role_id(code)")
    .eq("id", user.id)
    .single()

  const isAdmin = userData?.roles?.code === "Admin"

  let techCompaniesQuery = supabase.from("tech_companies").select("id, name").order("name")

  if (!isAdmin && userData?.tech_company_id) {
    techCompaniesQuery = techCompaniesQuery.eq("id", userData.tech_company_id)
  }

  const { data: techCompanies } = await techCompaniesQuery

  return (
    <div className="h-full">
      <MikaChat techCompanies={techCompanies || []} userTechCompanyId={userData?.tech_company_id} />
    </div>
  )
}
