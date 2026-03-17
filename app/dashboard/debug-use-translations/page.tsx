"use client"

import { UseTranslationsDebug } from "@/components/debug/use-translations-debug"

export default function DebugUseTranslationsPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Debug Hook useTranslations</h1>
      <UseTranslationsDebug />
    </div>
  )
}
