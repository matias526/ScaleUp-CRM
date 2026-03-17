"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { fetchBddPartnersData, type BddPartnerData } from "@/lib/services/bdd-dashboard-service"
import { useTranslations } from "@/hooks/use-translations"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { formatDistanceToNow } from "date-fns"
import { es, enUS, pt } from "date-fns/locale"

export function BddPartnersAnalysis() {
  const { t, currentLanguage } = useTranslations()
  const [partnersData, setPartnersData] = useState<BddPartnerData[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Seleccionar el locale adecuado para formatDistanceToNow
  const getLocale = () => {
    switch (currentLanguage) {
      case "es":
        return es
      case "pt":
        return pt
      default:
        return enUS
    }
  }

  useEffect(() => {
    async function loadPartnersData() {
      try {
        setLoading(true)
        const { data, error } = await fetchBddPartnersData()

        if (error) {
          throw error
        }

        setPartnersData(data)
      } catch (err) {
        console.error("Error loading partners data:", err)
        setError("No se pudieron cargar los datos de partners. Intente nuevamente más tarde.")
      } finally {
        setLoading(false)
      }
    }

    loadPartnersData()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/3 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-1 flex-1">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-destructive">{error}</div>
        </CardContent>
      </Card>
    )
  }

  if (!partnersData || partnersData.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            {t("dashboard.noPartnersData", "No tienes partners asignados")}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("dashboard.bdd.partners.title", "Mis Partners")}</CardTitle>
        <CardDescription>
          {t("dashboard.bdd.partners.description", "Actividad y rendimiento de tus partners asignados")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {partnersData.map((partner) => (
            <div key={partner.id} className="space-y-2">
              <div className="flex items-center gap-4">
                {partner.logo ? (
                  <img
                    src={partner.logo || "/placeholder.svg"}
                    alt={partner.name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    {partner.name.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <h4 className="font-medium">{partner.name}</h4>
                  <p className="text-xs text-muted-foreground">
                    {partner.opportunities} {t("dashboard.bdd.partners.opportunities", "oportunidades")} · $
                    {partner.pipelineValue.toLocaleString()}
                  </p>
                </div>
                <div className="text-sm">
                  {partner.lastActivity ? (
                    <span className="text-muted-foreground">
                      {formatDistanceToNow(new Date(partner.lastActivity), {
                        addSuffix: true,
                        locale: getLocale(),
                      })}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      {t("dashboard.bdd.partners.noActivity", "Sin actividad")}
                    </span>
                  )}
                </div>
              </div>
              <Progress value={partner.opportunities * 10} className="h-1" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
