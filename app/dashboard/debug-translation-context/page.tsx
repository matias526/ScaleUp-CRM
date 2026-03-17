import { TranslationContextDebug } from "@/components/debug/translation-context-debug"

export default function DebugTranslationContextPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Translation Context Debug</h1>
      <TranslationContextDebug />
    </div>
  )
}
