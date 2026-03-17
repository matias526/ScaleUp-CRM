"use client"

import { TranslationServiceDebug } from "@/components/debug/translation-service-debug"

export default function DebugTranslationServicePage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-4">Depuración del Servicio de Traducciones</h1>
      <TranslationServiceDebug />
    </div>
  )
}
