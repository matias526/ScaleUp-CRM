"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { TrendingUp, TrendingDown, DollarSign, Target, Users } from "lucide-react"
import { useTranslations } from "@/hooks/use-translations"
import { supabase } from "@/lib/supabase/client"

interface KpiData {
  totalPipelineValue: number
  totalOpportunities: number
  conversionRate: number
  activePartners: number
  previousPipelineValue?: number
  previousOpportunities?: number
  previousConversionRate?: number
  previousActivePartners?: number
}

interface DashboardFilters {
  dateRange: {
    from: Date
    to: Date
  }
  country: string | null
  partnerId: string | null
  techCompanyId: string | null
}

interface NewAdminKpiCardsProps {
  filters: DashboardFilters
}

export function NewAdminKpiCards({ filters }: NewAdminKpiCardsProps) {
  const { t, isLoaded } = useTranslations()
  const [kpiData, setKpiData] = useState<KpiData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isLoaded) {
      loadKpiData()
    }
  }, [filters, isLoaded])

  const loadKpiData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Estados que se consideran activos (excluyendo Lost y Freeze)
      const activeStages = ["Pre-Lead", "Lead", "Initial Communication", "Engagement", "Quotation"]
      const wonStages = ["Won"]

      // Construir query base para oportunidades
      let opportunitiesQuery = supabase
        .from("opportunities")
        .select(`
          id,
          estimated_value,
          validation_status,
          partner_id,
          tech_company_id,
          created_at,
          pipeline_stages!inner(code)
        `)
        .gte("created_at", filters.dateRange.from.toISOString())
        .lte("created_at", filters.dateRange.to.toISOString())

      // Aplicar filtros
      if (filters.country) {
        opportunitiesQuery = opportunitiesQuery.eq("country", filters.country)
      }

      if (filters.partnerId) {
        opportunitiesQuery = opportunitiesQuery.eq("partner_id", filters.partnerId)
      }

      if (filters.techCompanyId) {
        opportunitiesQuery = opportunitiesQuery.eq("tech_company_id", filters.techCompanyId)
      }

      const { data: opportunities, error: oppError } = await opportunitiesQuery

      if (oppError) {
        console.error("Error loading opportunities:", oppError)
        throw oppError
      }

      // Asegurar que opportunities no sea null
      const safeOpportunities = opportunities || []

      // Filtrar oportunidades activas y ganadas
      const activeOpportunities = safeOpportunities.filter(
        (opp) => opp.pipeline_stages && activeStages.includes(opp.pipeline_stages.code),
      )

      const wonOpportunities = safeOpportunities.filter(
        (opp) => opp.pipeline_stages && wonStages.includes(opp.pipeline_stages.code),
      )

      // Calcular KPIs
      const totalPipelineValue = activeOpportunities.reduce((sum, opp) => sum + (opp.estimated_value || 0), 0)

      const totalOpportunities = activeOpportunities.length

      const conversionRate =
        safeOpportunities.length > 0 ? (wonOpportunities.length / safeOpportunities.length) * 100 : 0

      // Partners únicos con oportunidades activas
      const uniquePartnerIds = new Set(activeOpportunities.filter((opp) => opp.partner_id).map((opp) => opp.partner_id))
      const activePartners = uniquePartnerIds.size

      // Para el período anterior (comparación)
      const previousPeriodStart = new Date(filters.dateRange.from)
      const previousPeriodEnd = new Date(filters.dateRange.to)
      const periodDuration = previousPeriodEnd.getTime() - previousPeriodStart.getTime()

      previousPeriodStart.setTime(previousPeriodStart.getTime() - periodDuration)
      previousPeriodEnd.setTime(previousPeriodEnd.getTime() - periodDuration)

      let previousQuery = supabase
        .from("opportunities")
        .select(`
          id,
          estimated_value,
          partner_id,
          pipeline_stages!inner(code)
        `)
        .gte("created_at", previousPeriodStart.toISOString())
        .lte("created_at", previousPeriodEnd.toISOString())

      // Aplicar los mismos filtros al período anterior
      if (filters.country) {
        previousQuery = previousQuery.eq("country", filters.country)
      }

      if (filters.partnerId) {
        previousQuery = previousQuery.eq("partner_id", filters.partnerId)
      }

      if (filters.techCompanyId) {
        previousQuery = previousQuery.eq("tech_company_id", filters.techCompanyId)
      }

      const { data: previousOpportunities, error: prevError } = await previousQuery

      if (prevError) {
        console.warn("Error loading previous period data:", prevError)
      }

      // Calcular KPIs del período anterior
      const safePreviousOpportunities = previousOpportunities || []
      const previousActiveOpportunities = safePreviousOpportunities.filter(
        (opp) => opp.pipeline_stages && activeStages.includes(opp.pipeline_stages.code),
      )

      const previousWonOpportunities = safePreviousOpportunities.filter(
        (opp) => opp.pipeline_stages && wonStages.includes(opp.pipeline_stages.code),
      )

      const previousPipelineValue = previousActiveOpportunities.reduce(
        (sum, opp) => sum + (opp.estimated_value || 0),
        0,
      )

      const previousOpportunitiesCount = previousActiveOpportunities.length

      const previousConversionRate =
        safePreviousOpportunities.length > 0
          ? (previousWonOpportunities.length / safePreviousOpportunities.length) * 100
          : 0

      const previousUniquePartnerIds = new Set(
        previousActiveOpportunities.filter((opp) => opp.partner_id).map((opp) => opp.partner_id),
      )
      const previousActivePartnersCount = previousUniquePartnerIds.size

      setKpiData({
        totalPipelineValue,
        totalOpportunities,
        conversionRate,
        activePartners,
        previousPipelineValue,
        previousOpportunities: previousOpportunitiesCount,
        previousConversionRate,
        previousActivePartners: previousActivePartnersCount,
      })
    } catch (err) {
      console.error("Error loading KPI data:", err)
      setError("Error al cargar datos de KPI")
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const calculateTrend = (current: number, previous: number | undefined) => {
    if (!previous || previous === 0) return null
    const change = ((current - previous) / previous) * 100
    return {
      value: Math.abs(change),
      direction: change >= 0 ? "up" : "down",
      isPositive: change >= 0,
    }
  }

  const TrendIndicator = ({ trend }: { trend: ReturnType<typeof calculateTrend> }) => {
    if (!trend) return null

    const Icon = trend.direction === "up" ? TrendingUp : TrendingDown
    const colorClass = trend.isPositive ? "text-green-600" : "text-red-600"

    return (
      <div className={`flex items-center gap-1 text-xs ${colorClass}`}>
        <Icon className="h-3 w-3" />
        <span>{formatPercentage(trend.value)}</span>
      </div>
    )
  }

  if (!isLoaded || isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-[120px] mb-2" />
              <Skeleton className="h-3 w-[80px]" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error || !kpiData) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-red-600">{error || "Error al cargar datos"}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const kpiCards = [
    {
      title: t("admin.dashboard.kpis.pipelineValue", "Valor del Pipeline"),
      value: formatCurrency(kpiData.totalPipelineValue),
      icon: DollarSign,
      trend: calculateTrend(kpiData.totalPipelineValue, kpiData.previousPipelineValue),
      description: t("admin.dashboard.kpis.pipelineValueDesc", "Valor total de oportunidades activas"),
    },
    {
      title: t("admin.dashboard.kpis.totalOpportunities", "Oportunidades Totales"),
      value: kpiData.totalOpportunities.toString(),
      icon: Target,
      trend: calculateTrend(kpiData.totalOpportunities, kpiData.previousOpportunities),
      description: t("admin.dashboard.kpis.totalOpportunitiesDesc", "Número de oportunidades activas"),
    },
    {
      title: t("admin.dashboard.kpis.conversionRate", "Tasa de Conversión"),
      value: formatPercentage(kpiData.conversionRate),
      icon: TrendingUp,
      trend: calculateTrend(kpiData.conversionRate, kpiData.previousConversionRate),
      description: t("admin.dashboard.kpis.conversionRateDesc", "Porcentaje de oportunidades ganadas"),
    },
    {
      title: t("admin.dashboard.kpis.activePartners", "Partners Activos"),
      value: kpiData.activePartners.toString(),
      icon: Users,
      trend: calculateTrend(kpiData.activePartners, kpiData.previousActivePartners),
      description: t("admin.dashboard.kpis.activePartnersDesc", "Partners con oportunidades activas"),
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {kpiCards.map((kpi, index) => {
        const Icon = kpi.icon
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{kpi.value}</div>
                <TrendIndicator trend={kpi.trend} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{kpi.description}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
