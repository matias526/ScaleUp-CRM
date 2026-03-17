"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslations } from "@/hooks/use-translations"
import { supabase } from "@/lib/supabase/client"

interface PipelineStageData {
  id: string
  code: string
  display_order: number
  count: number
  value: number
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

interface NewAdminPipelineChartProps {
  filters: DashboardFilters
}

export function NewAdminPipelineChart({ filters }: NewAdminPipelineChartProps) {
  const { t, isLoaded } = useTranslations()
  const [pipelineData, setPipelineData] = useState<PipelineStageData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isLoaded) {
      loadPipelineData()
    }
  }, [filters, isLoaded])

  const loadPipelineData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Obtener todos los pipeline stages
      const { data: stages, error: stagesError } = await supabase
        .from("pipeline_stages")
        .select("id, code, display_order")
        .order("display_order")

      if (stagesError) throw stagesError

      // Para cada stage, contar oportunidades y sumar valores
      const stageData = await Promise.all(
        stages.map(async (stage) => {
          let query = supabase
            .from("opportunities")
            .select("estimated_value")
            .eq("pipeline_stage_id", stage.id)
            .gte("created_at", filters.dateRange.from.toISOString())
            .lte("created_at", filters.dateRange.to.toISOString())

          // Aplicar filtros
          if (filters.partnerId) {
            query = query.eq("partner_id", filters.partnerId)
          }

          if (filters.techCompanyId) {
            query = query.eq("tech_company_id", filters.techCompanyId)
          }

          const { data: opportunities, error: oppsError } = await query

          if (oppsError) throw oppsError

          const count = opportunities?.length || 0
          const value = opportunities?.reduce((sum, opp) => sum + (opp.estimated_value || 0), 0) || 0

          return {
            id: stage.id,
            code: stage.code,
            display_order: stage.display_order,
            count,
            value,
          }
        }),
      )

      setPipelineData(stageData)
    } catch (err) {
      console.error("Error loading pipeline data:", err)
      setError("Error al cargar datos del pipeline")
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  if (!isLoaded || isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <div className="h-6 bg-gray-200 rounded animate-pulse w-48"></div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.dashboard.pipeline.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-red-600">{error}</p>
        </CardContent>
      </Card>
    )
  }

  const totalValue = pipelineData.reduce((sum, stage) => sum + stage.value, 0)
  const totalCount = pipelineData.reduce((sum, stage) => sum + stage.count, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("admin.dashboard.pipeline.title")}</CardTitle>
        <div className="text-sm text-muted-foreground">
          {totalCount} oportunidades • {formatCurrency(totalValue)}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {pipelineData.map((stage) => {
            const percentage = totalValue > 0 ? (stage.value / totalValue) * 100 : 0

            return (
              <div key={stage.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{stage.code}</span>
                  <div className="text-right">
                    <div className="font-semibold">{formatCurrency(stage.value)}</div>
                    <div className="text-sm text-muted-foreground">{stage.count} oportunidades</div>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
