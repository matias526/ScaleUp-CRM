"use client"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "@/hooks/use-translations"

export function CustomFieldsHeader() {
  const { t } = useTranslations()

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("opportunity_tech_fields.title")}</h1>
        <p className="text-muted-foreground">{t("opportunity_tech_fields.description")}</p>
      </div>
      <Button asChild className="mt-4 sm:mt-0">
        <Link href="/dashboard/settings/custom-fields/create">
          <Plus className="mr-2 h-4 w-4" />
          {t("opportunity_tech_fields.create")}
        </Link>
      </Button>
    </div>
  )
}
