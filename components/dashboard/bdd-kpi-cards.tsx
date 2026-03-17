"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { fetchBddKpis, type BddKpiData } from "@/lib/services/bdd-dashboard-service"
import { useTranslations } from "@/hooks/use-translations"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowDown, ArrowUp, DollarSign, Percent, PieChart, Users } from "lucide-react"

export function BddKpiCards() {
  const { t } = useTranslations()
  const [kpiData, setKpiData] = useState<BddKpiData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadKpiData() {
      try {
        setLoading(true)
        const { data, error } = await fetchBddKpis()

        if (error) {
          throw error
        }

        setKpiData(data)
      } catch (err) {
        console.error("Error loading KPI data:", err)
        setError("No se pudieron cargar los datos. Intente nuevamente más tarde.")
      } finally {
        setLoading(false)
      }
    }

    loadKpiData()
  }, [])

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-800 rounded-md">
        <p>{error}</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-5 w-[120px]" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-[100px] mb-1" />
              <Skeleton className="h-4 w-[80px]" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!kpiData) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p>No hay datos disponibles.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">
            {t("dashboard.bdd.pipelineValue", "Valor del Pipeline")}
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${kpiData.pipelineValue.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            {t("dashboard.bdd.activeOpportunities", "En {count} oportunidades activas", {
              count: kpiData.activeOpportunities,
            }).replace("{count}", kpiData.activeOpportunities.toString())}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">
            {t("dashboard.bdd.conversionRate", "Tasa de Conversión")}
          </CardTitle>
          <Percent className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{kpiData.conversionRate}%</div>
          <p className="text-xs text-muted-foreground">
            {t("dashboard.bdd.totalOpportunities", "De {count} oportunidades totales", {
              count: kpiData.totalOpportunities,
            }).replace("{count}", kpiData.totalOpportunities.toString())}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">
            {t("dashboard.bdd.activeOpportunities", "Oportunidades Activas")}
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{kpiData.activeOpportunities}</div>
          <div className="flex items-center space-x-1 text-xs">
            {kpiData.activeOpportunitiesChange > 0 ? (
              <ArrowUp className="h-3 w-3 text-green-500" />
            ) : (
              <ArrowDown className="h-3 w-3 text-red-500" />
            )}
            <span className={kpiData.activeOpportunitiesChange > 0 ? "text-green-500" : "text-red-500"}>
              {Math.abs(kpiData.activeOpportunitiesChange)}%
            </span>
            <span className="text-muted-foreground">{t("dashboard.bdd.vsLastMonth", "vs. mes anterior")}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">
            {t("dashboard.bdd.closedOpportunities", "Oportunidades Cerradas")}
          </CardTitle>
          <PieChart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{kpiData.closedOpportunities}</div>
          <div className="flex items-center space-x-1 text-xs">
            {kpiData.closedOpportunitiesChange > 0 ? (
              <ArrowUp className="h-3 w-3 text-green-500" />
            ) : (
              <ArrowDown className="h-3 w-3 text-red-500" />
            )}
            <span className={kpiData.closedOpportunitiesChange > 0 ? "text-green-500" : "text-red-500"}>
              {Math.abs(kpiData.closedOpportunitiesChange)}%
            </span>
            <span className="text-muted-foreground">{t("dashboard.bdd.vsLastMonth", "vs. mes anterior")}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
