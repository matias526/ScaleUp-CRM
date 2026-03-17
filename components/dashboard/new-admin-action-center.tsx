"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertTriangle, Clock, UserX, FileText, CheckCircle } from "lucide-react"
import { useTranslations } from "@/hooks/use-translations"
import { supabase } from "@/lib/supabase/client"
import Link from "next/link"

interface ActionItem {
  id: string
  type: "validation" | "assignment" | "overdue" | "risk"
  title: string
  description: string
  priority: "high" | "medium" | "low"
  entityId?: string
  entityType?: "opportunity" | "task"
  url: string
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

interface NewAdminActionCenterProps {
  filters: DashboardFilters
}

export function NewAdminActionCenter({ filters }: NewAdminActionCenterProps) {
  const { t, isLoaded } = useTranslations()
  const [actionItems, setActionItems] = useState<ActionItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isLoaded) {
      loadActionItems()
    }
  }, [filters, isLoaded])

  const loadActionItems = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const actions: ActionItem[] = []

      // 1. Oportunidades pendientes de validación
      let validationQuery = supabase
        .from("opportunities")
        .select("id, title, tech_companies(name)")
        .eq("validation_status", "pending")
        .gte("created_at", filters.dateRange.from.toISOString())
        .lte("created_at", filters.dateRange.to.toISOString())
        .limit(3)

      if (filters.partnerId) {
        validationQuery = validationQuery.eq("partner_id", filters.partnerId)
      }

      if (filters.techCompanyId) {
        validationQuery = validationQuery.eq("tech_company_id", filters.techCompanyId)
      }

      const { data: pendingValidation, error: validationError } = await validationQuery

      if (validationError) {
        console.warn("Error loading validation data:", validationError)
      } else if (pendingValidation && Array.isArray(pendingValidation)) {
        pendingValidation.forEach((opp) => {
          actions.push({
            id: `validation-${opp.id}`,
            type: "validation",
            title: `Validar: ${opp.title}`,
            description: `Oportunidad de ${opp.tech_companies?.name || "Tech Company"} pendiente de validación`,
            priority: "high",
            entityId: opp.id,
            entityType: "opportunity",
            url: `/dashboard/opportunities/${opp.id}`,
          })
        })
      }

      // 2. Oportunidades sin asignar
      let unassignedQuery = supabase
        .from("opportunities")
        .select("id, title, tech_companies(name)")
        .is("assigned_to", null)
        .gte("created_at", filters.dateRange.from.toISOString())
        .lte("created_at", filters.dateRange.to.toISOString())
        .limit(3)

      if (filters.partnerId) {
        unassignedQuery = unassignedQuery.eq("partner_id", filters.partnerId)
      }

      if (filters.techCompanyId) {
        unassignedQuery = unassignedQuery.eq("tech_company_id", filters.techCompanyId)
      }

      const { data: unassigned, error: unassignedError } = await unassignedQuery

      if (unassignedError) {
        console.warn("Error loading unassigned data:", unassignedError)
      } else if (unassigned && Array.isArray(unassigned)) {
        unassigned.forEach((opp) => {
          actions.push({
            id: `assignment-${opp.id}`,
            type: "assignment",
            title: `Asignar: ${opp.title}`,
            description: `Oportunidad de ${opp.tech_companies?.name || "Tech Company"} sin asignar`,
            priority: "medium",
            entityId: opp.id,
            entityType: "opportunity",
            url: `/dashboard/opportunities/${opp.id}`,
          })
        })
      }

      // 3. Oportunidades en riesgo (sin actividad reciente)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      let riskQuery = supabase
        .from("opportunities")
        .select("id, title, tech_companies(name), updated_at")
        .lt("updated_at", thirtyDaysAgo.toISOString())
        .neq("validation_status", "rejected")
        .limit(3)

      if (filters.partnerId) {
        riskQuery = riskQuery.eq("partner_id", filters.partnerId)
      }

      if (filters.techCompanyId) {
        riskQuery = riskQuery.eq("tech_company_id", filters.techCompanyId)
      }

      const { data: atRisk, error: riskError } = await riskQuery

      if (riskError) {
        console.warn("Error loading risk data:", riskError)
      } else if (atRisk && Array.isArray(atRisk)) {
        atRisk.forEach((opp) => {
          const daysSinceUpdate = Math.floor((Date.now() - new Date(opp.updated_at).getTime()) / (1000 * 60 * 60 * 24))
          actions.push({
            id: `risk-${opp.id}`,
            type: "risk",
            title: `En riesgo: ${opp.title}`,
            description: `Sin actividad desde hace ${daysSinceUpdate} días`,
            priority: "high",
            entityId: opp.id,
            entityType: "opportunity",
            url: `/dashboard/opportunities/${opp.id}`,
          })
        })
      }

      // 4. Tareas vencidas
      const today = new Date()
      const { data: overdueTasks, error: tasksError } = await supabase
        .from("tasks")
        .select("id, title, due_date")
        .lt("due_date", today.toISOString())
        .eq("status", "pending")
        .limit(3)

      if (tasksError) {
        console.warn("Error loading tasks data:", tasksError)
      } else if (overdueTasks && Array.isArray(overdueTasks)) {
        overdueTasks.forEach((task) => {
          const daysOverdue = Math.floor((Date.now() - new Date(task.due_date).getTime()) / (1000 * 60 * 60 * 24))
          actions.push({
            id: `overdue-${task.id}`,
            type: "overdue",
            title: `Vencida: ${task.title}`,
            description: `Tarea vencida hace ${daysOverdue} días`,
            priority: "medium",
            entityId: task.id,
            entityType: "task",
            url: `/dashboard/tasks/${task.id}`,
          })
        })
      }

      // Ordenar por prioridad
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      actions.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])

      setActionItems(actions.slice(0, 8)) // Máximo 8 elementos
    } catch (err) {
      console.error("Error loading action items:", err)
      setError("Error al cargar elementos de acción")
    } finally {
      setIsLoading(false)
    }
  }

  const getActionIcon = (type: ActionItem["type"]) => {
    switch (type) {
      case "validation":
        return <FileText className="h-4 w-4" />
      case "assignment":
        return <UserX className="h-4 w-4" />
      case "risk":
        return <AlertTriangle className="h-4 w-4" />
      case "overdue":
        return <Clock className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  const getPriorityColor = (priority: ActionItem["priority"]) => {
    switch (priority) {
      case "high":
        return "destructive"
      case "medium":
        return "default"
      case "low":
        return "secondary"
      default:
        return "default"
    }
  }

  if (!isLoaded || isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-48" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="w-8 h-8 rounded" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="w-16 h-6 rounded" />
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
          <CardTitle>{t("admin.dashboard.actionCenter.title", "Centro de Acciones")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-red-600">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (!actionItems || actionItems.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.dashboard.actionCenter.title", "Centro de Acciones")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-muted-foreground">¡Excelente! No hay acciones pendientes</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("admin.dashboard.actionCenter.title", "Centro de Acciones")}</CardTitle>
        <div className="text-sm text-muted-foreground">{actionItems.length} elementos requieren atención</div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {actionItems.map((item) => (
            <div key={item.id} className="flex items-start space-x-3 p-3 rounded-lg border">
              <div className="flex-shrink-0 mt-0.5">{getActionIcon(item.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <p className="font-medium text-sm truncate">{item.title}</p>
                  <Badge variant={getPriorityColor(item.priority)} className="text-xs">
                    {item.priority}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
              <Button variant="ghost" size="sm" className="flex-shrink-0" asChild>
                <Link href={item.url}>Ver</Link>
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
