"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslations } from "@/hooks/use-translations"
import { supabase } from "@/lib/supabase/client"

interface ActivityData {
  date: string
  opportunities: number
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

interface NewAdminActivityChartProps {
  filters: DashboardFilters
}

export function NewAdminActivityChart({ filters }: NewAdminActivityChartProps) {
  const { t, isLoaded } = useTranslations()
  const [activityData, setActivityData] = useState<ActivityData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isLoaded) {
      loadActivityData()
    }
  }, [filters, isLoaded])

  const loadActivityData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Generar fechas para el rango seleccionado
      const dates = []
      const currentDate = new Date(filters.dateRange.from)
      const endDate = new Date(filters.dateRange.to)

      while (currentDate <= endDate) {
        dates.push(new Date(currentDate))
        currentDate.setDate(currentDate.getDate() + 1)
      }

      // Para cada fecha, obtener oportunidades creadas
      const activityPromises = dates.map(async (date) => {
        const nextDate = new Date(date)
        nextDate.setDate(nextDate.getDate() + 1)

        let query = supabase
          .from("opportunities")
          .select("estimated_value")
          .gte("created_at", date.toISOString())
          .lt("created_at", nextDate.toISOString())

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
          date: date.toISOString().split("T")[0],
          opportunities: count,
          value,
        }
      })

      const results = await Promise.all(activityPromises)
      setActivityData(results)
    } catch (err) {
      console.error("Error loading activity data:", err)
      setError("Error al cargar datos de actividad")
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
          <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.dashboard.activity.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-red-600">{error}</p>
        </CardContent>
      </Card>
    )
  }

  const maxOpportunities = Math.max(...activityData.map((d) => d.opportunities))
  const maxValue = Math.max(...activityData.map((d) => d.value))

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("admin.dashboard.activity.title")}</CardTitle>
        <div className="text-sm text-muted-foreground">Oportunidades creadas por día</div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activityData.slice(-7).map((day, index) => {
            const opportunityPercentage = maxOpportunities > 0 ? (day.opportunities / maxOpportunities) * 100 : 0
            const valuePercentage = maxValue > 0 ? (day.value / maxValue) * 100 : 0

            return (
              <div key={day.date} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">
                    {new Date(day.date).toLocaleDateString("es-ES", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{day.opportunities} oportunidades</div>
                    <div className="text-xs text-muted-foreground">{formatCurrency(day.value)}</div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${opportunityPercentage}%` }}
                    />
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1">
                    <div
                      className="bg-green-500 h-1 rounded-full transition-all duration-300"
                      style={{ width: `${valuePercentage}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
