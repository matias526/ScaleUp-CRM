import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CompanyContextEditor } from "@/components/ai-knowledge-base/company-context-editor"

export default async function AIKnowledgeBaseSettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Obtener la primera tech company del usuario (puedes ajustar esto según tu lógica)
  const { data: techCompanies } = await supabase.from("tech_companies").select("id, name").limit(1).single()

  if (!techCompanies) {
    return <div>No se encontró ninguna empresa tecnológica</div>
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Configuración de Mika</h1>
        <p className="text-muted-foreground">Personaliza cómo Mika entiende tu empresa y responde a las consultas</p>
      </div>

      <CompanyContextEditor techCompanyId={techCompanies.id} />
    </div>
  )
}
