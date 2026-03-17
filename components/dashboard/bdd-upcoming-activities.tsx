"use client"

import { useEffect, useState } from "react"
import { fetchBddUpcomingActivities, type ActivityItem } from "@/lib/services/bdd-dashboard-service"
import { Skeleton } from "@/components/ui/skeleton"
import { CalendarIcon, CheckCircleIcon, ClockIcon, FileTextIcon, UsersIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface BddUpcomingActivitiesProps {
  showCalendar?: boolean
}

export function BddUpcomingActivities({ showCalendar = false }: BddUpcomingActivitiesProps) {
  const [activities, setActivities] = useState<ActivityItem[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadActivities() {
      try {
        setLoading(true)
        const { data, error } = await fetchBddUpcomingActivities()

        if (error) {
          throw error
        }

        setActivities(data)
      } catch (err) {
        console.error("Error loading activities:", err)
        setError("No se pudieron cargar las actividades. Intente nuevamente más tarde.")
      } finally {
        setLoading(false)
      }
    }

    loadActivities()
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
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-start space-x-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p>No hay actividades próximas programadas.</p>
        <Button variant="outline" className="mt-4">
          <CalendarIcon className="mr-2 h-4 w-4" />
          Programar nueva actividad
        </Button>
      </div>
    )
  }

  // Si showCalendar es true, mostrar una vista de calendario (simplificada para este ejemplo)
  if (showCalendar) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium">
          {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day) => (
            <div key={day} className="py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 text-sm">
          {Array.from({ length: 35 }).map((_, i) => {
            const day = i + 1
            const hasActivity = activities.some((activity) => {
              const activityDate = new Date(activity.dueDate)
              return activityDate.getDate() === day
            })

            return (
              <div
                key={i}
                className={`aspect-square flex flex-col items-center justify-center border rounded-md p-1 ${
                  hasActivity ? "bg-primary/10 border-primary/30" : ""
                }`}
              >
                <span>{day <= 31 ? day : ""}</span>
                {hasActivity && <div className="w-1 h-1 bg-primary rounded-full mt-1" />}
              </div>
            )
          })}
        </div>

        <div className="space-y-2 mt-4">
          <h3 className="font-medium">Próximas actividades</h3>
          {activities.slice(0, 3).map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
        </div>
      </div>
    )
  }

  // Vista de lista normal
  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <ActivityCard key={activity.id} activity={activity} />
      ))}
    </div>
  )
}

function ActivityCard({ activity }: { activity: ActivityItem }) {
  // Determinar el icono según el tipo de actividad
  const getIcon = () => {
    switch (activity.type) {
      case "meeting":
        return <UsersIcon className="h-5 w-5 text-blue-500" />
      case "followup":
        return <ClockIcon className="h-5 w-5 text-orange-500" />
      case "note":
        return <FileTextIcon className="h-5 w-5 text-green-500" />
      default:
        return <CheckCircleIcon className="h-5 w-5 text-primary" />
    }
  }

  // Formatear la fecha
  const formatDate = (dateString: string) => {
    if (!dateString) return "Sin fecha"

    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Determinar el color de la prioridad
  const getPriorityColor = () => {
    switch (activity.priority) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className={`p-3 rounded-lg border ${activity.isPastDue ? "border-red-200 bg-red-50" : "border-gray-200"}`}>
      <div className="flex items-start space-x-3">
        <div className="mt-1">{getIcon()}</div>

        <div className="flex-1">
          <div className="flex items-start justify-between">
            <h4 className="font-medium">{activity.title}</h4>
            <Badge variant="outline" className={getPriorityColor()}>
              {activity.priority}
            </Badge>
          </div>

          {activity.description && <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>}

          <div className="flex items-center justify-between mt-2 text-xs">
            <div className="flex items-center text-muted-foreground">
              <CalendarIcon className="h-3 w-3 mr-1" />
              <span>{formatDate(activity.dueDate)}</span>
              {activity.isPastDue && <span className="ml-2 text-red-500 font-medium">Vencida</span>}
            </div>

            {activity.relatedTo && (
              <span className="text-primary">
                {activity.relatedTo.type}: {activity.relatedTo.name}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
