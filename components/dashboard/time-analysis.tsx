"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Clock, Calendar, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { useTranslations } from "@/hooks/use-translations"
import { cn } from "@/lib/utils"

type TimeData = {
  recentActivity: {
    type: string
    description: string
    time: string
    icon: string
    iconBg: string
  }[]
  cycleTime: {
    average: number
    trend: number
  }
}

export function TimeAnalysis({ className }: { className?: string }) {
  const { t } = useTranslations()
  const [data, setData] = useState<TimeData | null>(null)

  useEffect(() => {
    // In a real implementation, this would fetch data from the API
    // For now, we'll use mock data
    setData({
      recentActivity: [
        {
          type: "opportunity_created",
          description: "Nueva oportunidad creada",
          time: "2 horas",
          icon: "TrendingUp",
          iconBg: "bg-primary/10",
        },
        {
          type: "opportunity_stage_change",
          description: "Oportunidad avanzada a Propuesta",
          time: "5 horas",
          icon: "ArrowUpRight",
          iconBg: "bg-success/10",
        },
        {
          type: "partner_registered",
          description: "Nuevo partner registrado",
          time: "1 día",
          icon: "Handshake",
          iconBg: "bg-warning/10",
        },
        {
          type: "opportunity_lost",
          description: "Oportunidad perdida",
          time: "2 días",
          icon: "ArrowDownRight",
          iconBg: "bg-destructive/10",
        },
      ],
      cycleTime: {
        average: 42,
        trend: -5.2,
      },
    })
  }, [])

  if (!data) {
    return null
  }

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "TrendingUp":
        return <TrendingUp className="h-4 w-4 text-primary" />
      case "ArrowUpRight":
        return <ArrowUpRight className="h-4 w-4 text-success" />
      case "Handshake":
        return <Calendar className="h-4 w-4 text-warning" />
      case "ArrowDownRight":
        return <ArrowDownRight className="h-4 w-4 text-destructive" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{t("dashboard.timeAnalysis.title")}</CardTitle>
        <CardDescription>{t("dashboard.timeAnalysis.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">{t("dashboard.timeAnalysis.avgCycleTime")}</div>
            <div className="flex items-center gap-1 text-sm">
              {data.cycleTime.trend < 0 ? (
                <>
                  <ArrowDownRight className="h-3 w-3 text-success" />
                  <span className="text-success">{Math.abs(data.cycleTime.trend)}%</span>
                </>
              ) : (
                <>
                  <ArrowUpRight className="h-3 w-3 text-destructive" />
                  <span className="text-destructive">+{data.cycleTime.trend}%</span>
                </>
              )}
            </div>
          </div>
          <div className="text-2xl font-bold">
            {data.cycleTime.average} {t("dashboard.timeAnalysis.days")}
          </div>
          <div className="mt-2 h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div className="bg-primary h-1.5 rounded-full" style={{ width: "65%" }}></div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="text-sm font-medium">{t("dashboard.timeAnalysis.recentActivity")}</div>
          {data.recentActivity.map((activity, index) => (
            <div key={index} className="flex items-start gap-4">
              <div className={cn("rounded-full p-2", activity.iconBg)}>{getIcon(activity.icon)}</div>
              <div>
                <p className="text-sm font-medium">{activity.description}</p>
                <p className="text-xs text-muted-foreground">Hace {activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
