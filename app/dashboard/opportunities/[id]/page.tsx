import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { OpportunityDetail } from "@/components/opportunities/opportunity-detail"

interface OpportunityPageProps {
  params: {
    id: string
  }
}

export default async function OpportunityPage({ params }: OpportunityPageProps) {
  if (!params.id) {
    console.error("ID de oportunidad no proporcionado")
    notFound()
  }

  try {
    console.log("Intentando obtener oportunidad con ID:", params.id)

    const supabase = createClient()

    // Primero, verificar si la oportunidad existe con una consulta simple
    const { data: opportunityExists, error: existsError } = await supabase
      .from("opportunities")
      .select("id")
      .eq("id", params.id)
      .single()

    if (existsError || !opportunityExists) {
      console.error("La oportunidad no existe:", existsError)
      notFound()
    }

    console.log("La oportunidad existe, obteniendo detalles completos")

    // Ahora obtener los detalles completos
    const { data: opportunity, error } = await supabase
      .from("opportunities")
      .select(`
        *,
        stage:pipeline_stages(*),
        tech_company:tech_companies(*),
        partner:partners(*),
        end_customer:end_customers(*),
        creator:users!created_by(*)
      `)
      .eq("id", params.id)
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
