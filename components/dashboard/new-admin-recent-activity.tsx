"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useTranslations } from "@/hooks/use-translations"
import { supabase } from "@/lib/supabase/client"

interface ActivityItem {
  id: string
  type: "opportunity_created" | "opportunity_updated" | "task_completed" | "validation"
  title: string
  description: string
  timestamp: string
  user?: {
    name: string
    avatar?: string
  }
  entity?: {
    id: string
    name: string
    type: "opportunity" | "task"
  }
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

interface NewAdminRecentActivityProps {
  filters: DashboardFilters
}

export function NewAdminRecentActivity({ filters }: NewAdminRecentActivityProps) {
  const { t, isLoaded } = useTranslations()
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isLoaded) {
      loadRecentActivity()
    }
  }, [filters, isLoaded])

  const loadRecentActivity = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const activities: ActivityItem[] = []

      // 1. Oportunidades creadas recientemente
      let opportunitiesQuery = supabase
        .from("opportunities")
        .select(`
          id,
          title,
          created_at,
          tech_companies(name),
          users!opportunities_created_by_fkey(first_name, last_name, profile_image)
        `)
        .gte("created_at", filters.dateRange.from.toISOString())
        .lte("created_at", filters.dateRange.to.toISOString())
        .order("created_at", { ascending: false })
        .limit(5)

      if (filters.partnerId) {
        opportunitiesQuery = opportunitiesQuery.eq("partner_id", filters.partnerId)
      }

      if (filters.techCompanyId) {
        opportunitiesQuery = opportunitiesQuery.eq("tech_company_id", filters.techCompanyId)
      }

      const { data: opportunities, error: oppsError } = await opportunitiesQuery

      if (oppsError) throw oppsError

      opportunities?.forEach((opp) => {
        activities.push({
          id: `opp-created-${opp.id}`,
          type: "opportunity_created",
          title: "Nueva oportunidad creada",
          description: `${opp.title} - ${opp.tech_companies?.name || "Tech Company"}`,
          timestamp: opp.created_at,
          user: {
            name: `${opp.users?.first_name || ""} ${opp.users?.last_name || ""}`.trim() || "Usuario",
            avatar: opp.users?.profile_image,
          },
          entity: {
            id: opp.id,
            name: opp.title,
            type: "opportunity",
          },
        })
      })

      // 2. Oportunidades actualizadas recientemente
      let updatedOppsQuery = supabase
        .from("opportunities")
        .select(`
          id,
          title,
          updated_at,
          validation_status,
          tech_companies(name)
        `)
        .gte("updated_at", filters.dateRange.from.toISOString())
        .lte("updated_at", filters.dateRange.to.toISOString())
        .neq("created_at", "updated_at") // Solo las que fueron actualizadas, no creadas
        .order("updated_at", { ascending: false })
        .limit(5)

      if (filters.partnerId) {
        updatedOppsQuery = updatedOppsQuery.eq("partner_id", filters.partnerId)
      }

      if (filters.techCompanyId) {
        updatedOppsQuery = updatedOppsQuery.eq("tech_company_id", filters.techCompanyId)
      }

      const { data: updatedOpps, error: updatedError } = await updatedOppsQuery

      if (updatedError) throw updatedError

      updatedOpps?.forEach((opp) => {
        let activityType: ActivityItem["type"] = "opportunity_updated"
        let title = "Oportunidad actualizada"

        if (opp.validation_status === "validated") {
          activityType = "validation"
          title = "Oportunidad validada"
        }

        activities.push({
          id: `opp-updated-${opp.id}`,
          type: activityType,
          title,
          description: `${opp.title} - ${opp.tech_companies?.name || "Tech Company"}`,
          timestamp: opp.updated_at,
          entity: {
            id: opp.id,
            name: opp.title,
            type: "opportunity",
          },
        })
      })

      // 3. Tareas completadas recientemente
      const { data: completedTasks, error: tasksError } = await supabase
        .from("tasks")
        .select(`
          id,
          title,
          updated_at,
          users!tasks_assigned_to_fkey(first_name, last_name, profile_image)
        `)
        .eq("status", "completed")
        .gte("updated_at", filters.dateRange.from.toISOString())
        .lte("updated_at", filters.dateRange.to.toISOString())
        .order("updated_at", { ascending: false })
        .limit(3)

      if (tasksError) throw tasksError

      completedTasks?.forEach((task) => {
        activities.push({
          id: `task-completed-${task.id}`,
          type: "task_completed",
          title: "Tarea completada",
          description: task.title,
          timestamp: task.updated_at,
          user: {
            name: `${task.users?.first_name || ""} ${task.users?.last_name || ""}`.trim() || "Usuario",
            avatar: task.users?.profile_image,
          },
          entity: {
            id: task.id,
            name: task.title,
            type: "task",
          },
        })
      })

      // Ordenar todas las actividades por timestamp
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

      setActivities(activities.slice(0, 10)) // Máximo 10 actividades
    } catch (err) {
      console.error("Error loading recent activity:", err)
      setError("Error al cargar actividad reciente")
    } finally {
      setIsLoading(false)
    }
  }

  const getActivityBadgeColor = (type: ActivityItem["type"]) => {
    switch (type) {
      case "opportunity_created":
        return "default"
      case "opportunity_updated":
        return "secondary"
      case "validation":
        return "default"
      case "task_completed":
        return "default"
      default:
        return "secondary"
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) {
      return "Hace menos de 1 hora"
    } else if (diffInHours < 24) {
      return `Hace ${diffInHours} horas`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `Hace ${diffInDays} días`
    }
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
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-32 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-48 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-24"></div>
                </div>
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
        <CardHeader>
          <CardTitle>{t("admin.dashboard.recentActivity.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-red-600">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.dashboard.recentActivity.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">No hay actividad reciente para el período seleccionado</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("admin.dashboard.recentActivity.title")}</CardTitle>
        <div className="text-sm text-muted-foreground">Últimas {activities.length} actividades</div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-4">
              <Avatar className="w-10 h-10">
                <AvatarImage src={activity.user?.avatar || undefined} alt={activity.user?.name} />
                <AvatarFallback>{activity.user?.name?.substring(0, 2).toUpperCase() || "U"}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <p className="font-medium text-sm">{activity.title}</p>
                  <Badge variant={getActivityBadgeColor(activity.type)} className="text-xs">
                    {activity.type.replace("_", " ")}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground truncate">{activity.description}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatTimestamp(activity.timestamp)}
                  {activity.user && ` • ${activity.user.name}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
