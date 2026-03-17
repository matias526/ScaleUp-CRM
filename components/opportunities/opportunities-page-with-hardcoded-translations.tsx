"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OpportunitiesTable } from "./opportunities-table"
import { OpportunitiesKanban } from "./opportunities-kanban"
import { useTranslations } from "@/hooks/use-translations"
import Link from "next/link"

// Traducciones de respaldo
const fallbackTranslations = {
  en: {
    "opportunities.table_view": "Table View",
    "opportunities.kanban_view": "Kanban View",
    "opportunities.title": "Opportunities",
    "opportunities.create": "Create Opportunity",
  },
  es: {
    "opportunities.table_view": "Vista de Tabla",
    "opportunities.kanban_view": "Vista Kanban",
    "opportunities.title": "Oportunidades",
    "opportunities.create": "Crear Oportunidad",
  },
  pt: {
    "opportunities.table_view": "Visualização em Tabela",
    "opportunities.kanban_view": "Visualização Kanban",
    "opportunities.title": "Oportunidades",
    "opportunities.create": "Criar Oportunidade",
  },
}

// Función para obtener una traducción con respaldo garantizado
function getTranslation(key: string, language: string, t: (key: string, defaultValue?: string) => string): string {
  // Intentar obtener la traducción usando el hook
  const translation = t(key)

  // Si la traducción es igual a la clave, significa que no se encontró
  if (translation === key) {
    // Intentar obtener la traducción del respaldo
    return (
      fallbackTranslations[language as keyof typeof fallbackTranslations]?.[
        key as keyof (typeof fallbackTranslations)[keyof typeof fallbackTranslations]
      ] || key
    )
  }

  return translation
}

export function OpportunitiesPageWithHardcodedTranslations({ opportunities = [], stages = [] }) {
  const [view, setView] = useState("kanban")
  const { t, language, isLoaded } = useTranslations()

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">{getTranslation("opportunities.title", language, t)}</h1>
        <Link href="/dashboard/opportunities/create" passHref>
          <Button>{getTranslation("opportunities.create", language, t)}</Button>
        </Link>
      </div>

      <Tabs defaultValue="kanban" value={view} onValueChange={setView}>
        <TabsList>
          <TabsTrigger value="table">{getTranslation("opportunities.table_view", language, t)}</TabsTrigger>
          <TabsTrigger value="kanban">{getTranslation("opportunities.kanban_view", language, t)}</TabsTrigger>
        </TabsList>
        <TabsContent value="table">
          <OpportunitiesTable opportunities={opportunities} />
        </TabsContent>
        <TabsContent value="kanban">
          <OpportunitiesKanban opportunities={opportunities} stages={stages} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
