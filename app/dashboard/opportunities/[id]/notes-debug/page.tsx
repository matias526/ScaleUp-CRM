//import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { createServerClient } from "@/lib/supabase/server"

//import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { OpportunityNotesSimple } from "@/components/opportunities/opportunity-notes-simple"

export default async function OpportunityNotesDebugPage({ params }: { params: { id: string } }) {
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
      <h1 className="text-2xl font-bold mb-6">Depuración de Notas</h1>

      <div className="bg-yellow-50 border border-yellow-300 rounded-md p-4 mb-6">
        <h2 className="font-bold text-lg mb-2">Información de Depuración</h2>
        <p>
          Esta página muestra una versión simplificada de las notas para ayudar a identificar problemas de renderizado.
        </p>
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

      <OpportunityNotesSimple
        opportunityId={opportunityId}
        currentUserId={currentUserId}
        isScaleUpMember={isScaleUpMember}
      />
    </div>
  )
}
