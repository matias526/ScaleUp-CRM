"use client"

import { use } from "react" // 1. Importamos 'use'
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { PartnerEditForm } from "@/components/partners/partner-edit-form"
import { useTranslations } from "@/hooks/use-translations"

// 2. Definimos la interfaz con la Promise
interface EditPartnerPageProps {
  params: Promise<{
    id: string
  }>
}

export default function EditPartnerPage({ params }: EditPartnerPageProps) {
  const router = useRouter()
  const { t } = useTranslations()

  // 3. Resolvemos los params de forma reactiva
  const resolvedParams = use(params)
  const id = resolvedParams.id

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">{t("edit_partner")}</h1>
      </div>

      {/* 4. Usamos el id resuelto */}
      <PartnerEditForm partnerId={id} />
    </div>
  )
}