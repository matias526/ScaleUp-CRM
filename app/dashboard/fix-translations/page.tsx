"use client"

import { AddMissingTranslations } from "@/components/debug/add-missing-translations"
import { TranslationServiceInspector } from "@/components/debug/translation-service-inspector"

export default function FixTranslationsPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Corregir Traducciones Faltantes</h1>

      <div className="space-y-8">
        <AddMissingTranslations />

        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Inspector de Traducciones</h2>
          <TranslationServiceInspector />
        </div>
      </div>
    </div>
  )
}
