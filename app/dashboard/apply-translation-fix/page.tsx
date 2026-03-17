"use client"

import { ApplyTranslationServiceFix } from "@/components/debug/apply-translation-service-fix"

export default function ApplyTranslationFixPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Aplicar Solución de Traducciones</h1>
      <ApplyTranslationServiceFix />
    </div>
  )
}
