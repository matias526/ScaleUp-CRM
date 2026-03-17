import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DocumentUpload } from "@/components/ai-knowledge-base/document-upload"

export const dynamic = "force-dynamic"

export default async function AIKnowledgeBaseDocumentsPage() {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      redirect("/login")
    }

    // Check admin role
    const { data: userData } = await supabase
      .from("users")
      .select("role_id, roles!role_id(code)")
      .eq("id", user.id)
      .single()

    if (userData?.roles?.code !== "Admin") {
      redirect("/dashboard")
    }

    // Get tech companies for the dropdown
    const { data: techCompanies } = await supabase.from("tech_companies").select("id, name").order("name")

    const { data: documents } = await supabase
      .from("kb_documents")
      .select("*")
      .order("created_at", { ascending: false })

    return (
      <div className="container mx-auto py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Base de Conocimiento con IA</h1>
          <p className="text-muted-foreground mt-2">
            Sube documentos para entrenar a Mika Techie, tu asistente experto en cada tecnología
          </p>
        </div>

        <DocumentUpload techCompanies={techCompanies || []} documents={documents || []} />
      </div>
    )
  } catch (error) {
    console.error("[v0] Error in Documents page:", error)

    return (
      <div className="container mx-auto py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Base de Conocimiento con IA</h1>
          <p className="text-muted-foreground mt-2">
            Sube documentos para entrenar a Mika Techie, tu asistente experto en cada tecnología
          </p>
        </div>

        <DocumentUpload techCompanies={[]} documents={[]} />
      </div>
    )
  }
}
