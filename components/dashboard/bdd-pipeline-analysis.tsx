"use client"

import { useEffect, useState } from "react"
import { fetchBddPipelineData, type PipelineData } from "@/lib/services/bdd-dashboard-service"
import { Skeleton } from "@/components/ui/skeleton"
import { useTranslations } from "@/hooks/use-translations"
import { cn } from "@/lib/utils"

export function BddPipelineAnalysis() {
  const { t } = useTranslations()
  const [pipelineData, setPipelineData] = useState<PipelineData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadPipelineData() {
      try {
        setLoading(true)
        const { data, error } = await fetchBddPipelineData()

        if (error) {
          throw error
        }

        setPipelineData(data)
      } catch (err) {
        console.error("Error loading pipeline data:", err)
        setError("No se pudieron cargar los datos del pipeline. Intente nuevamente más tarde.")
      } finally {
        setLoading(false)
      }
    }

    loadPipelineData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i}>
            <div className="flex justify-between mb-1">
              <Skeleton className="h-4 w-1/4" />
              <div className="flex gap-8">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
            <Skeleton className="h-2 w-full" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return <div className="text-center text-destructive">{error}</div>
  }

  if (!pipelineData || pipelineData.stages.length === 0) {
    return <div className="text-center text-muted-foreground">{t("dashboard.noData", "No hay datos disponibles")}</div>
  }

  // Encontrar el valor máximo para calcular porcentajes (basado en count, no en value)
  const maxCount = Math.max(...pipelineData.stages.map((stage) => stage.count))

  return (
    <div className="space-y-4">
      <div className="flex justify-between mb-2 text-sm text-muted-foreground">
        <div>{t("dashboard.pipeline.stage", "Etapa")}</div>
        <div className="flex gap-8">
          <div>{t("dashboard.pipeline.count", "Cant.")}</div>
          <div>{t("dashboard.pipeline.value", "Valor")}</div>
        </div>
      </div>

      {pipelineData.stages.map((stage, index) => (
        <div key={index} className="space-y-1">
          <div className="flex justify-between">
            <span className="font-medium">{stage.code}</span>
            <div className="flex gap-8">
              <span className="w-12 text-right">{stage.count}</span>
              <span className="w-24 text-right">
                {stage.value > 0
                  ? `$${stage.value >= 1000 ? (stage.value / 1000).toFixed(0) + "K" : stage.value}`
                  : "$0K"}
              </span>
            </div>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            {stage.count > 0 && (
              <div
                className={cn(stage.color, "h-full rounded-full")}
                style={{
                  width: `${maxCount > 0 ? (stage.count / maxCount) * 100 : 0}%`,
                }}
              />
            )}
          </div>
        </div>
      ))}

      <div className="pt-4 border-t mt-4">
        <div className="flex justify-between font-medium">
          <span>{t("dashboard.pipeline.total", "Total")}</span>
          <div className="flex gap-8">
            <span className="w-12 text-right">{pipelineData.totalCount}</span>
            <span className="w-24 text-right">
              $
              {pipelineData.totalValue >= 1000
                ? (pipelineData.totalValue / 1000).toFixed(0) + "K"
                : pipelineData.totalValue}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
