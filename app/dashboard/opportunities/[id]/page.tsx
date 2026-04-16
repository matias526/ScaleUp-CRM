import { notFound } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { OpportunityDetail } from "@/components/opportunities/opportunity-detail"

// 1. Definimos params como Promise
interface OpportunityPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function OpportunityPage({ params }: OpportunityPageProps) {
  // 2. DESEMPAQUETAMOS el id con await
  const resolvedParams = await params
  const id = resolvedParams.id

  if (!id) {
    console.error("ID de oportunidad no proporcionado")
    notFound()
  }

  try {
    console.log("Intentando obtener oportunidad con ID:", id)

    const supabase = createServerClient()

    // 3. Verificamos existencia
    const { data: opportunityExists, error: existsError } = await supabase
      .from("opportunities")
      .select("id")
      .eq("id", id)
      .single()

    if (existsError || !opportunityExists) {
      console.error("La oportunidad no existe:", existsError)
      notFound()
    }

    // 4. Obtenemos detalles incluyendo PROSPECT_PARTNERS
    const { data: opportunity, error } = await supabase
      .from("opportunities")
      .select(`
        *,
        stage:pipeline_stages(*),
        tech_company:tech_companies(*),
        partner:partners(*),
        prospect:prospect_partners(*),
        end_customer:end_customers(*),
        creator:users!created_by(*)
      `)
      .eq("id", id)
      .single()

    if (error) {
      console.error("Error al obtener detalles de la oportunidad:", error)
      return (
        <div className="p-8">
          <h1 className="text-2xl font-bold mb-4">Error al cargar la oportunidad</h1>
          <p className="text-red-500">Se produjo un error al cargar los detalles de la oportunidad.</p>
          <pre className="mt-4 p-4 bg-gray-100 rounded overflow-auto">{JSON.stringify(error, null, 2)}</pre>
        </div>
      )
    }

    // 5. Se lo pasamos al componente de detalle
    return <OpportunityDetail opportunity={opportunity} />

  } catch (error) {
    console.error("Error inesperado:", error)
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Error Inesperado</h1>
        <p className="text-red-500">Se produjo un error inesperado al procesar la solicitud.</p>
        <pre className="mt-4 p-4 bg-gray-100 rounded overflow-auto">{JSON.stringify(error, null, 2)}</pre>
      </div>
    )
  }
}