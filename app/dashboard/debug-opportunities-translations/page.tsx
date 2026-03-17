import { OpportunitiesTranslationDebug } from "@/components/debug/opportunities-translation-debug-fixed"

export default function DebugOpportunitiesTranslationsPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Depuración de Traducciones de Oportunidades</h1>
      <OpportunitiesTranslationDebug />
    </div>
  )
}
