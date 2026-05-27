"use client"

import { useState } from "react"
import { PartnerForm } from "@/components/partners/partner-form"
import { SelectProspectModal } from "@/components/partners/select-prospect-modal"
import { Button } from "@/components/ui/button"
import { useTranslations } from "@/hooks/use-translations"
import type { ProspectPartner } from "@/types/prospect-partner"

export default function CreatePartnerPage() {
  const { t } = useTranslations()
  const [showProspectModal, setShowProspectModal] = useState(false)
  const [selectedProspect, setSelectedProspect] = useState<ProspectPartner | null>(null)

  const handleProspectSelect = (prospect: ProspectPartner) => {
    setSelectedProspect(prospect)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{t("new_partner")}</h1>
        <Button
          variant="outline"
          onClick={() => setShowProspectModal(true)}
        >
          Crear desde Prospect
        </Button>
      </div>

      {selectedProspect && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            Creando partner desde prospect: <span className="font-semibold">{selectedProspect.name}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedProspect(null)}
              className="ml-2"
            >
              Cambiar
            </Button>
          </p>
        </div>
      )}

      <PartnerForm initialProspect={selectedProspect} />

      <SelectProspectModal
        open={showProspectModal}
        onOpenChange={setShowProspectModal}
        onSelect={handleProspectSelect}
      />
    </div>
  )
}

