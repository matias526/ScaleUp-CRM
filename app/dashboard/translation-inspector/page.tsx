"use client"

import { TranslationServiceInspector } from "@/components/debug/translation-service-inspector"

export default function TranslationInspectorPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Translation Service Inspector</h1>
      <TranslationServiceInspector />
    </div>
  )
}
