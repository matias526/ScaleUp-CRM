"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslations } from "@/hooks/use-translations"
import { cn } from "@/lib/utils"
import { fetchPipelineData, type PipelineData } from "@/lib/services/dashboard-service"
import { Skeleton } from "@/components/ui/skeleton"

export function PipelineAnalysis({ className }: { className?: string }) {
  const { t, isLoaded } = useTranslations()
  const [data, setData] = useState<PipelineData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        const { data: pipelineData, error } = await fetchPipelineData()

        if (error) {
          console.error("Error loading pipeline data:", error)
          setError("Error al cargar los datos del pipeline. Intente nuevamente.")
        } else {
          setData(pipelineData)
        }
      } catch (err) {
        console.error("Unexpected error loading pipeline data:", err)
        setError("Error inesperado. Intente nuevamente.")
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-1/3 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center text-destructive">{error}</div>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.stages.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">{t("dashboard.noData")}</div>
        </CardContent>
      </Card>
    )
  }

  const maxValue = Math.max(...data.stages.map((stage) => stage.value))
  const maxHeight = 250 // Maximum height in pixels for the tallest bar

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{isLoaded ? t("dashboard.pipeline.title") : "Pipeline Analysis"}</CardTitle>
        <CardDescription>
          {isLoaded ? t("dashboard.pipeline.description") : "Analysis of opportunities by stage"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col">
          <div className="flex justify-between mb-2 text-sm text-muted-foreground">
            <div>{t("dashboard.pipeline.stage")}</div>
            <div className="flex gap-8">
              <div>{t("dashboard.pipeline.count")}</div>
              <div>{t("dashboard.pipeline.value")}</div>
            </div>
          </div>

          {data.stages.map((stage) => (
            <div key={stage.name} className="mb-4">
              <div className="flex justify-between mb-1">
                <div className="font-medium">{stage.name}</div>
                <div className="flex gap-8">
                  <div className="w-12 text-right">{stage.count}</div>
                  <div className="w-24 text-right">${(stage.value / 1000).toFixed(0)}K</div>
                </div>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(stage.color, "h-full rounded-full")}
                  style={{ width: `${(stage.count / data.totalCount) * 100}%` }}
                />
              </div>
            </div>
          ))}

          <div className="mt-6">
            <div className="flex justify-between items-end h-[300px]">
              {data.stages.map((stage) => (
                <div key={stage.name} className="flex flex-col items-center gap-2 flex-1">
                  <div
                    className={cn(stage.color, "w-12 rounded-t-md")}
                    style={{ height: `${(stage.value / maxValue) * maxHeight}px` }}
                  />
                  <span className="text-xs text-muted-foreground">{stage.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
