"use client"

import { OpportunitiesPageWithDebug } from "@/components/opportunities/opportunities-page-with-debug"

export default function DebugOpportunitiesPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-4">Depuración de Página de Oportunidades</h1>
      <OpportunitiesPageWithDebug />
    </div>
  )
}
