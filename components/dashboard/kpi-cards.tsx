"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CircleDollarSign, Users, TrendingUp, Clock, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { useTranslations } from "@/hooks/use-translations"
import { fetchDashboardKpis, type KpiData } from "@/lib/services/dashboard-service"
import { Skeleton } from "@/components/ui/skeleton"

export function KpiCards() {
  const { t } = useTranslations()
  const [data, setData] = useState<KpiData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        const { data: kpis, error } = await fetchDashboardKpis()

        if (error) {
          console.error("Error loading KPI data:", error)
          setError("Error al cargar los datos. Intente nuevamente.")
        } else {
          setData(kpis)
        }
      } catch (err) {
        console.error("Unexpected error loading KPI data:", err)
        setError("Error inesperado. Intente nuevamente.")
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-1/3 mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
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

  if (!data) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">{t("dashboard.noData")}</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">{t("dashboard.kpis.pipelineValue")}</CardTitle>
          <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${(data.pipelineValue / 1000000).toFixed(2)}M</div>
          <div className="flex items-center text-xs text-muted-foreground">
            <TrendingUp className="mr-1 h-3 w-3" />
            {t("dashboard.kpis.totalOpportunities")}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">{t("dashboard.kpis.conversionRate")}</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.conversionRate}%</div>
          <div className="flex items-center text-xs text-muted-foreground">
            <Clock className="mr-1 h-3 w-3" />
            {t("dashboard.kpis.lastQuarter")}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">{t("dashboard.kpis.newOpportunities")}</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.newOpportunities}</div>
          <div className="flex items-center gap-1 text-xs">
            {data.newOpportunitiesChange > 0 ? (
              <>
                <ArrowUpRight className="h-3 w-3 text-success" />
                <span className="text-success">+{data.newOpportunitiesChange}%</span>
              </>
            ) : (
              <>
                <ArrowDownRight className="h-3 w-3 text-destructive" />
                <span className="text-destructive">{data.newOpportunitiesChange}%</span>
              </>
            )}
            <span className="text-muted-foreground">{t("dashboard.kpis.vsLastMonth")}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">{t("dashboard.kpis.closedOpportunities")}</CardTitle>
          <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.closedOpportunities}</div>
          <div className="flex items-center gap-1 text-xs">
            {data.closedOpportunitiesChange > 0 ? (
              <>
                <ArrowUpRight className="h-3 w-3 text-success" />
                <span className="text-success">+{data.closedOpportunitiesChange}%</span>
              </>
            ) : (
              <>
                <ArrowDownRight className="h-3 w-3 text-destructive" />
                <span className="text-destructive">{data.closedOpportunitiesChange}%</span>
              </>
            )}
            <span className="text-muted-foreground">{t("dashboard.kpis.vsLastMonth")}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
