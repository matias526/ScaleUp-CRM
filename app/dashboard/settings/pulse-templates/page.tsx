"use client"

import { useTranslation } from "@/hooks/use-translations"
import PulseTemplateManager from "@/components/pulse/pulse-template-manager"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ChevronLeft, Zap } from "lucide-react"

export default function PulseTemplatesPage() {
  const { t } = useTranslation()

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center space-x-2 mb-6">
        <Link href="/dashboard/settings">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <Zap className="h-6 w-6" />
        <h1 className="text-2xl font-bold">{t("pulse.title", "Pulse Templates")}</h1>
      </div>

      <PulseTemplateManager />
    </div>
  )
}
