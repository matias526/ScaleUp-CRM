"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import { PartnerService } from "@/lib/services/partner-service"
import { PartnerForm } from "./partner-form"
import { useTranslations } from "@/hooks/use-translations"

interface PartnerEditFormProps {
  partnerId: string
}

export function PartnerEditForm({ partnerId }: PartnerEditFormProps) {
  const router = useRouter()
  const [partner, setPartner] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { t } = useTranslations()

  // Cargar datos del partner
  useEffect(() => {
    const loadPartner = async () => {
      try {
        setIsLoading(true)
        const data = await PartnerService.getPartnerById(partnerId)
        if (!data) {
          throw new Error(t("partner_not_found"))
        }
        setPartner(data)
      } catch (err: any) {
        setError(err.message || t("error_loading_partner"))
      } finally {
        setIsLoading(false)
      }
    }

    loadPartner()
  }, [partnerId, t])

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !partner) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertDescription>{error || t("partner_not_found")}</AlertDescription>
          </Alert>
          <div className="flex justify-center mt-4">
            <Button onClick={() => router.back()}>{t("go_back")}</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return <PartnerForm initialData={partner} />
}
