//import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { createServerClient } from "@/lib/supabase/server"
//import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { OpportunityNotes } from "@/components/opportunities/opportunity-notes"
import { OpportunityNotesAlt } from "@/components/opportunities/opportunity-notes-alt"

export default async function OpportunityNotesComparePage({ params }: { params: { id: string } }) {
  //const supabase = createServerComponentClient({ cookies })
  const supabase = createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/auth/login")
  }

  const opportunityId = params.id
  const currentUserId = session.user.id

  // Verificar si el usuario es de ScaleUp (no tiene partner_id)
  const { data: userData } = await supabase.from("users").select("partner_id, role_id").eq("id", currentUserId).single()

  const isScaleUpMember = !userData?.partner_id

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Comparación de Renderizado de Notas</h1>

      <div className="bg-yellow-50 border border-yellow-300 rounded-md p-4 mb-6">
        <h2 className="font-bold text-lg mb-2">Información de Depuración</h2>
        <p>Esta página muestra dos versiones de las notas para comparar el renderizado:</p>
        <ul className="list-disc ml-6 mt-2">
          <li>La versión superior usa ReactMarkdown para renderizar el contenido</li>
          <li>La versión inferior usa texto plano con formato básico</li>
        </ul>
        <p className="mt-2">
          <strong>Usuario:</strong> {session.user.email}
        </p>
        <p>
          <strong>Es miembro de ScaleUp:</strong> {isScaleUpMember ? "Sí" : "No"}
        </p>
        <p>
          <strong>ID de Oportunidad:</strong> {opportunityId}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Versión con ReactMarkdown</h2>
          <OpportunityNotes
            opportunityId={opportunityId}
            currentUserId={currentUserId}
            isScaleUpMember={isScaleUpMember}
          />
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Versión con Texto Plano</h2>
          <OpportunityNotesAlt
            opportunityId={opportunityId}
            currentUserId={currentUserId}
            isScaleUpMember={isScaleUpMember}
          />
        </div>
      </div>
    </div>
  )
}
