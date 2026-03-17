import { OpportunityNotesDebug } from "@/components/debug/opportunity-notes-debug"

interface PageProps {
  params: {
    id: string
  }
}

export default function OpportunityNotesPropsDebugPage({ params }: PageProps) {
  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">Depuración de Props de Notas</h1>
      <OpportunityNotesDebug opportunityId={params.id} />
    </div>
  )
}
