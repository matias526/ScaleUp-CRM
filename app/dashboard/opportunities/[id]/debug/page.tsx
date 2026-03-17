import { DebugLogger } from "@/components/debug/debug-logger"

export default function OpportunityDebugPage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-4">Depurador de Oportunidad</h1>
      <p className="mb-4">ID de Oportunidad: {params.id}</p>
      <p className="mb-4">Esta página muestra los logs de depuración para ayudar a solucionar problemas.</p>

      <div className="mt-8">
        <DebugLogger />
      </div>
    </div>
  )
}
