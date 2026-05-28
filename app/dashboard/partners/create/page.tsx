"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import { PartnerForm } from "@/components/partners/partner-form"
import { Button } from "@/components/ui/button"
import { useTranslations } from "@/hooks/use-translations"

const ProspectSelectModal = dynamic(() => import("@/components/partners/prospect-select-modal").then(mod => ({ default: mod.ProspectSelectModal })), { ssr: false })

export default function CreatePartnerPage() {
  const { t } = useTranslations()
  const [showModal, setShowModal] = useState(false)
  const [selectedProspect, setSelectedProspect] = useState<any>(null)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{t("new_partner")}</h1>
        <Button variant="outline" onClick={() => setShowModal(true)}>
          Crear desde Prospect
        </Button>
      </div>

      {selectedProspect && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            Creando partner desde prospect: <span className="font-semibold">{selectedProspect.name}</span>
            <Button variant="ghost" size="sm" onClick={() => setSelectedProspect(null)} className="ml-2">
              Cambiar
            </Button>
          </p>
        </div>
      )}

      <PartnerForm initialProspect={selectedProspect} />

      {showModal && <ProspectSelectModal open={showModal} onOpenChange={setShowModal} onSelect={setSelectedProspect} />}
    </div>
  )
}
