import { TranslationServiceDeepDebug } from "@/components/debug/translation-service-deep-debug"

export default function DebugTranslationServiceDeepPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Translation Service Deep Debug</h1>
      <TranslationServiceDeepDebug />
    </div>
  )
}
