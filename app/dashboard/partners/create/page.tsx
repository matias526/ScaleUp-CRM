"use client"

import { PartnerForm } from "@/components/partners/partner-form"
import { useTranslations } from "@/hooks/use-translations"

export default function CreatePartnerPage() {
  const { t } = useTranslations()

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t("new_partner")}</h1>
      <PartnerForm />
    </div>
  )
}

