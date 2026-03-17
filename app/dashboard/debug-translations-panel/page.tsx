import { TranslationDebugPanel } from "@/components/debug/translation-debug-panel"

export default function DebugTranslationsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Depuración de Traducciones</h1>
      <TranslationDebugPanel />
    </div>
  )
}
