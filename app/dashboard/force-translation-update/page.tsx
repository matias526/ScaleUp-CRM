"use client"

import { ForceTranslationUpdate } from "@/components/debug/force-translation-update"

export default function ForceTranslationUpdatePage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Forzar Actualización de Traducciones</h1>
      <ForceTranslationUpdate />
    </div>
  )
}
