import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { FeedbackDashboard } from "@/components/ai-knowledge-base/feedback-dashboard"

export const dynamic = "force-dynamic"

export default async function AIKnowledgeBaseFeedbackPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: userData } = await supabase
    .from("users")
    .select("role_id, roles:role_id(code)")
    .eq("id", user.id)
    .single()

  if (userData?.roles?.code !== "Admin") {
    redirect("/dashboard")
  }

  const { data: techCompanies } = await supabase.from("tech_companies").select("id, name").order("name")

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Feedback de Mika Techie</h1>
        <p className="text-muted-foreground mt-2">
          Analiza el feedback de los usuarios para mejorar las respuestas de Mika Techie
        </p>
      </div>

      <FeedbackDashboard techCompanies={techCompanies || []} />
    </div>
  )
}
