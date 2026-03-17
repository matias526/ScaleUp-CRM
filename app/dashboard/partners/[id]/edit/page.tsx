"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { PartnerEditForm } from "@/components/partners/partner-edit-form"
import { useTranslations } from "@/hooks/use-translations"

export default function EditPartnerPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { t } = useTranslations()

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">{t("edit_partner")}</h1>
      </div>

      <PartnerEditForm partnerId={params.id} />
    </div>
  )
}
