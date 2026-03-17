"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslations } from "@/hooks/use-translations"
import { CheckCircle2, AlertCircle, Clock, TrendingUp, BarChart3 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"

type MeetingDashboardProps = {
  opportunities: any[]
  isLoading: boolean
}

export function MeetingDashboard({ opportunities, isLoading }: MeetingDashboardProps) {
  const { t } = useTranslations()

  // Contar oportunidades con cambios recientes (última semana)
  const countRecentChanges = () => {
    if (!opportunities || opportunities.length === 0) return 0

    const lastWeek = new Date()
    lastWeek.setDate(lastWeek.getDate() - 7)

    return opportunities.filter((opp) => {
      if (!opp.updated_at) return false
      return new Date(opp.updated_at) > lastWeek
    }).length
  }

  // Contar oportunidades por estado de validación
  const countByValidationStatus = () => {
    if (!opportunities || opportunities.length === 0) {
      return { validated: 0, pending: 0 }
    }

    return opportunities.reduce(
      (acc, opp) => {
        if (opp.validation_status === "validated") {
          acc.validated += 1
        } else {
          acc.pending += 1
        }
        return acc
      },
      { validated: 0, pending: 0 },
    )
  }

  const recentChangesCount = countRecentChanges()
  const noChangesCount = opportunities.length - recentChangesCount
  const { validated, pending } = countByValidationStatus()

  // Calcular porcentajes para las barras de progreso
  const recentChangesPercentage =
    opportunities.length > 0 ? Math.round((recentChangesCount / opportunities.length) * 100) : 0

  const validatedPercentage = opportunities.length > 0 ? Math.round((validated / opportunities.length) * 100) : 0

  if (isLoading) {
    return (
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-semibold text-gray-800">
            {t("follow_up_meeting.dashboard.title", "Dashboard")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border border-gray-200 shadow-sm overflow-hidden">
      <CardHeader className="pb-2 bg-gradient-to-r from-gray-50 to-gray-100">
        <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-indigo-500" />
          {t("follow_up_meeting.dashboard.title", "Dashboard")}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total de oportunidades */}
          <Card className="border-none shadow-md bg-white hover:shadow-lg transition-shadow">
            <CardContent className="p-4 flex flex-col items-center justify-center h-28">
              <div className="w-full flex justify-between items-center mb-2">
                <p className="text-sm font-medium text-gray-600">
                  {t("follow_up_meeting.dashboard.total", "Total de Oportunidades")}
                </p>
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <BarChart3 className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-blue-600 self-start">{opportunities.length}</p>
            </CardContent>
          </Card>

          {/* Oportunidades con cambios recientes */}
          <Card className="border-none shadow-md bg-white hover:shadow-lg transition-shadow">
            <CardContent className="p-4 flex flex-col h-28">
              <div className="w-full flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-600">
                    {t("follow_up_meeting.dashboard.with_changes", "Con Cambios Recientes")}
                  </p>
                </div>
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
              </div>
              <div className="flex justify-between items-center mb-1">
                <p className="text-3xl font-bold text-green-600">{recentChangesCount}</p>
                <p className="text-sm font-medium text-gray-500">{recentChangesPercentage}%</p>
              </div>
              <Progress
                value={recentChangesPercentage}
                className="h-1.5 bg-gray-100"
                indicatorClassName="bg-green-500"
              />
            </CardContent>
          </Card>

          {/* Oportunidades sin cambios */}
          <Card className="border-none shadow-md bg-white hover:shadow-lg transition-shadow">
            <CardContent className="p-4 flex flex-col h-28">
              <div className="w-full flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-600">
                    {t("follow_up_meeting.dashboard.without_changes", "Sin Cambios Recientes")}
                  </p>
                </div>
                <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-amber-600" />
                </div>
              </div>
              <div className="flex justify-between items-center mb-1">
                <p className="text-3xl font-bold text-amber-600">{noChangesCount}</p>
                <p className="text-sm font-medium text-gray-500">
                  {opportunities.length > 0 ? Math.round((noChangesCount / opportunities.length) * 100) : 0}%
                </p>
              </div>
              <Progress
                value={opportunities.length > 0 ? Math.round((noChangesCount / opportunities.length) * 100) : 0}
                className="h-1.5 bg-gray-100"
                indicatorClassName="bg-amber-500"
              />
            </CardContent>
          </Card>

          {/* Oportunidades por estado de validación */}
          <Card className="border-none shadow-md bg-white hover:shadow-lg transition-shadow">
            <CardContent className="p-4 flex flex-col h-28">
              <div className="w-full flex justify-between items-center mb-2">
                <p className="text-sm font-medium text-gray-600">
                  {t("follow_up_meeting.dashboard.validation_status", "Estado de Validación")}
                </p>
                <div className="flex gap-1">
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  <div className="h-3 w-3 rounded-full bg-amber-500"></div>
                </div>
              </div>

              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <p className="text-sm text-gray-600">{t("follow_up_meeting.dashboard.validated", "Validadas")}</p>
                </div>
                <p className="text-sm font-medium">
                  {validated} <span className="text-gray-500 text-xs">({validatedPercentage}%)</span>
                </p>
              </div>
              <Progress
                value={validatedPercentage}
                className="h-1.5 mb-2 bg-gray-100"
                indicatorClassName="bg-green-500"
              />

              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <p className="text-sm text-gray-600">{t("follow_up_meeting.dashboard.pending", "Pendientes")}</p>
                </div>
                <p className="text-sm font-medium">
                  {pending} <span className="text-gray-500 text-xs">({100 - validatedPercentage}%)</span>
                </p>
              </div>
              <Progress
                value={100 - validatedPercentage}
                className="h-1.5 bg-gray-100"
                indicatorClassName="bg-amber-500"
              />
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  )
}

export default MeetingDashboard
