import { OpportunityDebug } from "@/components/opportunities/opportunity-debug"

interface DebugPageProps {
  params: {
    id: string
  }
}

export default function DebugPage({ params }: DebugPageProps) {
  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">Depuración de Oportunidad</h1>
      <OpportunityDebug id={params.id} />
    </div>
  )
}
